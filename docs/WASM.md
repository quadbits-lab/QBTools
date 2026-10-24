# Browser Processing Development Guide

QBTools processes files locally. This upgrade adds optimized image encoders, streaming hashes,
AAC/FLAC extensions, image/PDF OCR, structural PDF optimization, and a media compatibility engine.
The new text extraction tool is `/tools/extract-text`.

## Engines and workers

Processing implementations live in `packages/engines`. React hooks and worker ownership live in
`apps/web/src/lib/processing`. The tool-owned processing worker lazily loads image codecs, hashing,
qpdf, OCR, and GIF quantization. OCR's recognition worker runs inside this worker, allowing
cancellation even during initialization. PDF.js renders pages and reads native text separately.
Mediabunny uses native browser codecs or its AAC/MP3/FLAC worker extensions. FFmpeg owns its worker.

The shared lifecycle is `queued → loading → processing → done | error | cancelled`. Requests and
responses carry an ID. File queues serialize later batches as well as initial batches and capture
settings when files are added. Removing a queued file skips it; removing active work aborts it.
Worker termination interrupts synchronous WASM; engines initialize again on the next request.
`useTask` aborts replacements and unmounts and rejects stale UI results.

Keep loading progress separate from processing progress. Indeterminate progress is intentional when
a codec cannot report completion. Do not publish guessed percentages as measured progress.

## Formats and defaults

- Images default to Fast/native encoding. Optimized uses MozJPEG, libwebp, OxiPNG, or single-threaded
  libavif. AVIF selects Optimized automatically. PNG optimization is lossless and has no target-size
  or quality controls. Failed native output formats produce errors rather than mislabeled files.
- File hashes use one pass in 4 MiB chunks. SHA-256, SHA-512, and SHA-1 are enabled by default; BLAKE3
  and SHA3-256 are optional. Text is exact UTF-8, including whitespace and empty input.
- PDF Preserve text uses qpdf structural compression without lossy image optimization. Unchanged or
  larger output returns the original. Compress scans retains the previous JPEG/raster workflow.
  Rewriting a signed PDF may invalidate signatures.
- OCR reads native PDF text first, then recognizes scanned pages; Force OCR overrides this per job.
  English, Arabic, and combined language modes are available. TXT output uses form-feed page separators.
- MP3 remains the audio default. WAV and FLAC preserve decoded samples without restoring source quality.
  Extraction uses Mediabunny's incremental pipeline; waveform trimming still decodes the full audio.
- MP4/H.264/AAC remains the video default. Native WebM uses VP9/Opus where the browser supports it.
  Compatibility MP4 and optimized GIF use single-threaded FFmpeg.

### Verified FFmpeg limitation

The pinned `@ffmpeg/core@0.12.10` crashes in libvpx encoding in local browser tests, including small
synthetic videos and single-threaded settings. Compatibility mode therefore exposes MP4 output;
WebM remains a native-mode option. The adapter rejects unsupported compatibility WebM requests
explicitly rather than silently changing codecs. Revisit only after a replacement core passes the
same fixture suite. See the [upstream libvpx failure report](https://github.com/ffmpegwasm/ffmpeg.wasm/issues/786).

This core can also return `-1` from successful ffprobe calls. The adapter accepts that return only
when the resulting JSON has a valid video track and duration. Runtime failures terminate the engine
so subsequent jobs can start cleanly.

## Resource safeguards

Limits are centralized in `packages/engines/src/processing.ts`:

| Operation         | Initial safeguard                              |
| ----------------- | ---------------------------------------------- |
| Optimized images  | 24 megapixels                                  |
| OCR               | 50 MiB, 50 PDF pages, 24-megapixel image input |
| qpdf optimization | 100 MiB                                        |
| FFmpeg            | 128 MiB                                        |
| GIF               | 15 seconds, 720 pixels wide, 24 FPS            |

Limits do not guarantee a low-memory device can process every accepted file. Errors must preserve
an operable interface. No file content, extracted text, hashes, or processing logs are persisted or
sent to analytics. OCR disables Tesseract's IndexedDB cache; ordinary HTTP caching stores assets.

## Asset delivery

`bun run assets:prepare` copies pinned dependency assets into ignored `apps/web/public/wasm/`
folders and writes their manifest. Both `dev` and `build` run it automatically, including Docker.
WASM, worker scripts, PDF resources, and language data are served from the same origin. No CDN
fallbacks are used for these new engines. Do not commit generated assets or load codecs from a root
page import. No global COOP/COEP headers or multithreaded cores are required.

See [third-party notices](../THIRD_PARTY_NOTICES.md) before changing the dependency set.

## Validation

```sh
bun test
bun run typecheck
bun run lint
bun run build
bunx playwright install chromium firefox webkit
bun run test:browser
```

Browser tests use port 8311 and Chromium, Firefox, and WebKit. `QBTOOLS_TEST_URL` points the same
suite at a running production or Docker server. On macOS, the test configuration gives Firefox an
isolated temporary app-data root to avoid touching the real browser profile
([upstream issue](https://github.com/microsoft/playwright/issues/42768)). Synthetic one-second media fixtures are checked in;
`scripts/generate-media-fixtures.sh` regenerates them with an optional local FFmpeg installation.
The image benchmark attaches cold/warm time, input/output bytes, and available JS heap measurements
to the Playwright report. JS heap measurements do not include all WASM/native allocations.

Real iOS Safari and Android Chrome require a separate device check; desktop browser engines do not
substitute for those devices. Do not claim a universal speed or compression improvement.
