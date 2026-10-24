# WASM Upgrade Validation

## Automated checks

- 77 unit tests pass, including known hash vectors, bounded file reads, cancellation, queue
  serialization, resource safeguards, audio fades, PCM WAV samples, and explicit Fast encoding.
- Workspace TypeScript checks, browser-test TypeScript checks, Biome, and the production build pass.
  Biome reports five existing unused-import warnings outside the new processing code.
- 81 browser checks passed in development across Chromium, Firefox, and WebKit. Additional production
  checks exercise forced AAC fallback and verify that the output video can be read.
- The Docker image builds and its health endpoint and SQLite initialization pass. Processing assets
  are served with `application/wasm` from the application origin, without isolation headers.
- Production browser scenarios cover image alpha, every new codec, chunked hashes, real OCR,
  mixed and forced OCR, Arabic language assets, PDF structure and selectable text, protected/malformed
  inputs, GIF modes, missing audio, cancellation during initialization, asset download failures, and
  successful retries. PDF checks inspect form values, links, bookmarks, dimensions, and rotation.

An initial production run exposed a bare `gifenc` import in the worker. Moving GIF processing into
an engine export resolved it. All production feature scenarios then passed. Two initial navigation
checks raced container startup and passed when rerun after health readiness; the test setup now waits
for `/api/health` before opening a browser.

## Small-fixture measurements

Production-container measurements for the same 320×100 transparent text drawing, encoded to AVIF:

| Browser  | Cold job | Warm job | Input PNG | Output AVIF | JS heap sample |
| -------- | -------- | -------- | --------- | ----------- | -------------- |
| Chromium | 216 ms   | 33 ms    | 5,350 B   | 2,784 B     | 10,000,000 B   |
| Firefox  | 287 ms   | 43 ms    | 4,163 B   | 2,784 B     | unavailable    |
| WebKit   | 214 ms   | 51 ms    | 4,797 B   | 2,726 B     | unavailable    |

These are local end-to-end job times, including worker/asset initialization on the cold run. Browser
canvas/font rendering produces different PNG inputs. This tiny synthetic fixture is a loading smoke
benchmark, not a representative large-photo performance comparison. JS heap values are coarse and
exclude some WASM/native allocations. The benchmark test writes `image-benchmark.json` in its
Playwright output directory for future comparisons.

## Limits of validation

- Real iOS Safari and Android Chrome device checks remain manual and were not performed here.
- Native codec availability depends on the device. Tests exercise successful native paths where
  available and verify actionable errors where unsupported; FFmpeg MP4 is tested independently.
- The pinned single-threaded FFmpeg core cannot reliably encode WebM in these tests. WebM is exposed
  only in native mode using VP9/Opus; Compatibility mode exports MP4. No alternative codec is silently
  substituted.
- Resource limits are safeguards rather than promises that a low-memory device can process every
  accepted file. Large real-world documents and photos should be profiled before raising limits.
