# Tutorials

Hands-on walkthroughs. All commands assume `qbtools` is installed (or use
`bun run cli` from the repo root).

## 1. Install & first run

1. Install Bun 1.4+, then `npm i -g qbtools`.
2. Run `qbtools` with no arguments — the console opens straight away. The
   header shows the wordmark, the version and the tool count. No setup
   required. Everything works offline immediately.
3. Type "qr" in the prompt — the board collapses to the QR card — then Enter:
   the tool opens in the inspector on the right.
4. If you want to set the server URL or output dir, type "/settings" and
   Enter — both optional.

The AI helpers and server media storage are the only features that need an
account (tutorial 3).

## 2. Console tour — three quick wins

1. **BMI** — type "bmi" in the prompt, Enter → the form opens in the inspector
   → type weight/height → Ctrl+R. The result lands in the event log at the
   bottom: your BMI, category and healthy range.
2. **QR code** — type "qr" → the "QR Code Generator" card → Enter → choose
   "URL", type a URL, Ctrl+R. The PNG is saved to your output dir and logged.
3. **Merge PDF with autocomplete** — type "merge" → Enter → in the first file
   field type the start of a path (say `~/Doc`) — live suggestions list
   matching files; ↓ to pick, Enter to accept. Repeat for the second file and
   run with Ctrl+R.

Shortcuts: Tab cycles the fields, Ctrl+F returns to the prompt, Ctrl+K clears
it, Ctrl+L clears the log, `/help` prints the key reference.

## 3. Connect an account (optional)

1. Open your QBTools web app → **Dashboard → Settings → CLI API keys**.
2. **Create new key**, copy the `qbk_…` value (shown once).
3. `qbtools login --api-key qbk_YOUR_KEY` — this verifies the key with the
   server, stores it at `~/.config/qbtools/auth.json` (mode 0600), and merges
   your favorites/recents with your web profile.
4. `qbtools whoami` confirms; `qbtools logout` forgets it (revoke in the
   dashboard to kill it server-side).

Signed in, three more things unlock: the AI tools (grammar checker,
paraphraser), favorites sync, and **media storage**:

```bash
qbtools media list                     # what's stored on the server
qbtools media put poster.pdf           # copy a file up
qbtools media get <asset-id> --out .   # copy a file down
```

Everything else keeps working offline either way.

## 4. Scripting & CI

Headless mode is the same engine with flags instead of forms:

```bash
# JSON out
qbtools run bmi-calculator --weight 70 --height 175 --json

# stdin + pipes
cat report.md | qbtools run word-counter --stdin --json | jq '.data.words'

# bytes to stdout
qbtools run qr-code-generator --text "https://example.com" --stdout > qr.png

# batch: merge every PDF in a folder
for f in invoices/*.pdf; do echo "$f"; done > list.txt   # order matters
qbtools run merge-pdf --in invoices/01.pdf --in invoices/02.pdf --out bundled.pdf
```

Exit codes: `0` success, `1` failure, `2` missing dependency/not signed in —
so `set -e` CI pipelines can gate on them directly.

## 5. Media tools (needs ffmpeg)

Install ffmpeg (`brew install ffmpeg` / `apt install ffmpeg`), then:

```bash
qbtools run video-compressor --in lecture.mov --preset small --resolution 720
qbtools run video-to-gif --in demo.mp4 --start 2 --duration 4 --width 480
qbtools run thumbnail-maker --in demo.mp4 --at 3 --width 640
qbtools doctor    # confirms the binary was found
```

## 6. Image tools (needs sharp)

`npm i -g sharp` (or `bun add sharp`), then:

```bash
qbtools run resize-image --in photo.jpg --width 1600
qbtools run convert-image --in photo.png --format webp --quality 85
qbtools run compress-image --in shot.png --format jpeg --quality 70
```

## 7. Graphics suite

```bash
# 1200×630 social banner from a template
qbtools run og-banner-maker --title "Ship faster" --subtitle "QBTools" --template gradient

# full favicon set: favicon.ico, PNGs, SVG, manifest + HTML snippet
qbtools run favicon-generator --initials QB --appName "QBTools"

# iOS + Android + macOS icon sets
qbtools run app-icon-generator --initials QB --platforms ios,android,macos
```

Fonts render through the bundled resvg pipeline — no browser needed.

## 8. System cleanup, safely

```bash
qbtools cleanup scan          # read-only inventory with sizes
qbtools cleanup analyze       # biggest files per category
qbtools cleanup clean         # ❌ refuses: dry-run by default
qbtools cleanup clean --yes   # deletes everything the scan listed
qbtools cleanup clean --yes --commands   # also brew cleanup / apt-get clean
```

Only allowlisted, well-known locations are ever touched. Every deletion is
written to `~/.config/qbtools/cleanup-logs/<timestamp>.json`. In the TUI
(type "cleanup" in the palette), Space toggles categories and a
two-step confirm (Enter, then Y) stands between you and deletion.
