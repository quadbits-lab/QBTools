# Features

The complete catalog of what `qbtools` does.

**Local-first:** every tool runs on your machine and no account is required.
Connecting a server is optional — it only unlocks favorites/recents sync, the
AI text helpers, and server media storage.

## Interactive console

Launch with `qbtools` (no arguments) in a terminal. `qbtools ui`, `qbtools tui`
and `qbtools ink` open the same console.

- **Fixed frame** — a hero header (ASCII wordmark, title, description,
  version), a command bar, the tool browser beside the inspector, an event log
  and a status bar. The panels keep their size while the content scrolls.
- **Card board** — the catalogue is grouped into eight category blocks, each a
  header (`.img (8) ────`) over a grid of tool cards (name + slug), 2–4 per row
  depending on width. The selected card takes its category's accent border.
- **Prompt filter** — the prompt filters the board with the shared fuzzy index;
  `cat:slug` narrows to a category (`.img`, `.pdf`, `.txt`, `.calc`, `.gen`,
  `.media`, `.sec`, `.dev`). Matching blocks stay, empty ones disappear.
- **Sticky inspector strip** — a fixed-height panel under the board with three
  zones: identity (name, `cat:slug`, tagline, availability chip) │ CLI
  invocation │ flags and synopsis. Opening a tool turns it into its form, with
  the fields laid out in 2–4 columns.
- **Direct commands** — a fully typed command runs immediately:
  `compress-image a.png --quality 80`, reusing the headless flag parser.
- **Schema-driven forms** — every tool renders its own typed fields (text,
  textarea, number, select, toggle, file paths). Tab cycles the fields, Ctrl+R
  runs.
- **File-path autocomplete** — typing in a file field suggests real files from
  the directory you're in; ↑↓ pick, Enter accepts, Esc dismisses.
- **Event log** — a ring buffer of system events and tool results, timestamped
  and tagged (`SYS_BOOT`, `OPEN`, `RUN`, `DONE`, `ERR`).
- **Zero egress** — the status bar always reads `0 NETWORK EGRESS`; nothing
  leaves the machine unless you sign in.

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

## Authentication & sync (optional)

The CLI is fully usable signed out; connecting an account is opt-in.

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

## Media storage (requires the optional sign-in)

Your server's per-user file storage, from the terminal:

```bash
qbtools media list [--search pdf] [--kind image]     # browse (40/page)
qbtools media get <asset-id> --out ./downloads       # copy a file down
qbtools media put ./hero.png --name hero.png         # upload
```

`list` supports fuzzy name search, kind filters and paging; `put` runs the
reserve → upload → complete flow and reports the stored name. Without
credentials, media commands exit `2` with the login hint — nothing else is
blocked.

## Configuration

`~/.config/qbtools/config.json` — profiles, output dir, update check. Env:
`QBTOOLS_SERVER` (override server URL), `QBTOOLS_PROFILE` (switch profile),
`QBTOOLS_CONFIG_DIR`, `QBTOOLS_NO_UPDATE_CHECK=1`. Update checks hit the npm
registry at most daily and can be disabled.

## Diagnostics

`qbtools doctor` checks the runtime, config, credentials, wasm asset
resolution, sharp, ffmpeg and server health in one shot — use it first when
anything looks off.
