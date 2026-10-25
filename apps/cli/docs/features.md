# Features

The complete catalog of what `qbtools` does.

## Interactive TUI

Launch with `qbtools` (no arguments) in a terminal.

- **Dashboard** — popular tools, your favorites and recent runs.
- **Fuzzy search** — press `/` anywhere; matches names, slugs and keywords with
  typo tolerance (the same index the website uses).
- **Schema-driven forms** — every tool renders its own typed fields (text,
  number, select, toggle, file paths). Tab between fields, Enter or Ctrl+R to run.
- **Live progress** — long jobs stream progress with percentage and stage labels;
  Ctrl+C cancels the job without killing the app.
- **Result panel** — tables, formatted code, image bytes, and output file paths.
  Everything a run produces is saved under your output directory.
- **First-run wizard** — pick your server URL and output directory once.
- **Themed monochrome UI** — the QBTools design language (dark base, per-category
  accent colors) ported from the web app.

## Tool coverage (42 tools)

"local" = fully offline. "+sharp"/"+ffmpeg" = needs the optional dependency.
"server" = needs a signed-in QBTools server. "web" = browser only (`qbtools open`).

| Category     | Tools                                                                                   | Availability                |
| ------------ | --------------------------------------------------------------------------------------- | --------------------------- |
| Calculators  | age, BMI, EMI, GPA, percentage                                                          | local                       |
| Text         | word counter, case converter                                                            | local                       |
| Generators   | password/passphrase, QR code, invoice PDF                                               | local                       |
| PDF          | merge, split, watermark, image→PDF, compress (structure mode), protect/unlock           | local                       |
| Security     | hash & checksum (SHA-256/512/1, BLAKE3, SHA3), file encryptor (AES-GCM), text encryptor | local                       |
| Developer    | code formatter (Prettier + SQL), compression benchmark (gzip/deflate/brotli/zstd)       | local                       |
| Graphics     | OG banner maker, favicon set, app icon sets (iOS/Android/macOS)                         | local                       |
| Image        | PNG→SVG vectorize, barcode generate                                                     | local · barcode scan +sharp |
| Image        | compress, resize, convert                                                               | +sharp                      |
| Media        | video compress/trim, video→audio, video→GIF, audio trim, thumbnail                      | +ffmpeg                     |
| Text (AI)    | grammar checker, paraphraser                                                            | server                      |
| Browser-only | background remover, signature maker, redact PDF, OCR PDF, PDF/image→text                | web (`qbtools open`)        |

Every tool that works headless shares the exact engine code with the website
(`packages/engines`) — same options, same limits, same output formats.

## Scripting & CI

```bash
qbtools run <slug> --in file --out result --json     # structured output
cat notes.md | qbtools run word-counter --stdin       # pipes in
qbtools run qr-code-generator --text hi --stdout > qr.png   # bytes out
qbtools run hash-generator --in file --json | jq -r '."SHA-256"'
```

Deterministic exit codes (0 ok / 1 error / 2 unavailable) make CI gates trivial.
`completions zsh|bash|fish` generates tab-completion for every command and flag.

## System cleanup utility (CLI-exclusive)

`qbtools cleanup scan` inventories well-known cache/log/trash locations for your
OS with per-category sizes. Nothing is ever deleted without `clean --yes`.

- **macOS** — user caches, logs, Trash, Xcode DerivedData, iOS Simulator caches,
  Homebrew (`brew cleanup`), `.DS_Store` sweep, npm/pnpm/yarn/pip/bun caches.
- **Linux** — ~/.cache, thumbnails, Trash, APT archives, journald vacuum,
  flatpak-adjacent caches, dev caches.
- **Windows** — %TEMP%, browser caches, npm/bun caches.

Safety model: allowlisted paths only · realpath containment (a candidate must
live inside its category base) · symlinks and special files skipped · guards
re-verified at delete time · every run writes a JSON audit log to
`~/.config/qbtools/cleanup-logs/`. `cleanup analyze` is a read-only
largest-files report.

## Authentication & sync

Create a **CLI API key** in the web dashboard (Settings → CLI API keys), then:

```bash
qbtools login --api-key qbk_…
qbtools whoami
```

The key is stored at `~/.config/qbtools/auth.json` with `0600` permissions and
sent as `Authorization: Bearer`. On login, local favorites and recent tools
merge with your server profile; offline, they stay local and sync on the next
login. `logout` forgets the key locally (revoke it in the dashboard to kill it
server-side).

## Configuration

`~/.config/qbtools/config.json` — profiles, output dir, update check. Env:
`QBTOOLS_SERVER` (override server URL), `QBTOOLS_PROFILE` (switch profile),
`QBTOOLS_CONFIG_DIR`, `QBTOOLS_NO_UPDATE_CHECK=1`. Update checks hit the npm
registry at most daily and can be disabled.

## Diagnostics

`qbtools doctor` checks the runtime, config, credentials, wasm asset
resolution, sharp, ffmpeg and server health in one shot — use it first when
anything looks off.
