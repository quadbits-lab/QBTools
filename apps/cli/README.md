# qbtools — QBTools in your terminal

A modern, interactive TUI for the [QBTools](https://github.com/Quadbits-Lab/QBTools) toolkit:
**42 tools** (calculators, PDF suite, images, media, graphics, security, developer utilities),
a **system cleanup utility**, scriptable headless mode with piping, and optional sync with your
QBTools server. Built with [Ink](https://github.com/vadimdemedes/ink) on Bun.

## Install

Requires [Bun](https://bun.sh) ≥ 1.4.

```bash
npm i -g qbtools        # published package
# or run from a checkout of this repo:
bun run cli             # bun run --cwd apps/cli start
```

`sharp` (image tools) is an optional dependency — install it globally to enable
compress/resize/convert. `ffmpeg` (media tools) is detected on your PATH.

## 60-second tour

```bash
qbtools                     # launch the interactive UI
qbtools list                # all 42 tools, grouped
qbtools search pdf          # fuzzy search
qbtools run bmi-calculator --weight 70 --height 175 --json
echo "text to count" | qbtools run word-counter --stdin
qbtools run merge-pdf --in a.pdf --in b.pdf --out merged.pdf
qbtools doctor              # environment check
qbtools help                # everything else
```

## The interactive console

`qbtools` opens a console, not a screen-per-task app. The frame is fixed:

```
┌─ QB-CORE v0.1.0 (bun · darwin-arm64) ─────────────────────────────── LOCAL ┐
│  #### #### #### #### #### #    ####  QBTools CLI - Private By Default      │
│  ...the ASCII wordmark...           Compress, merge, format, and encrypt   │
│                                     files locally from the command line.  │
│                                     Zero server calls.                    │
└───────────────────────────────────────────────────────────────────────────┘
 user@host : ~/dir$ qbtools                                       <Enter> Run
┌─ TELESCOPE: TOOLS ────────────────────────────────────── 42 TOOLS ────────┐
│ ▸ IMAGE TOOLS  .img (8) ────────────────────────────────────────────────  │
│ ╭──────────────╮ ╭──────────────╮ ╭──────────────╮ ╭──────────────╮ …     │
│ │ Compress     │ │ Resize Image │ │ Convert      │ │ Background   │       │
│ │ compress-…   │ │ resize-image │ │ convert-…    │ │ remove-back… │       │
│ ╰──────────────╯ ╰──────────────╯ ╰──────────────╯ ╰──────────────╯       │
│   PDF TOOLS  .pdf (8) ─────────────────────────────────────────────────   │
└──────────────────────────────────────────────────────────────────────────┘
┌─ ▸ INSPECTOR ───────────────────────────────────────────────────── IMG ──┐
│ Compress Image        │ CLI INVOCATION      │ SYNOPSIS / FLAGS           │
│ img:compress-image    │ $ qbtools run …     │ --in <path>  --quality <n> │
│ [+sharp]              │                     │ needs the sharp package    │
└──────────────────────────────────────────────────────────────────────────┘
┌─ SYS_STREAM: RING_BUFFER ─────────────────────────────────────────────────┐
│ [12:00:00.001] SYS_BOOT: qb-core local runtime initialised — 42 manifests │
└───────────────────────────────────────────────────────────────────────────┘
 NORMAL │ qbtools │ 0 NETWORK EGRESS │ <C-f> Focus  <C-k> Clear  <C-l> Log
```

- **A card board, grouped by category.** Every category gets a block header
  (`.img (8) ────`) followed by a grid of tool cards (name + slug), 2–6 per row
  depending on the terminal width.
- **The prompt is the only input.** Type to fuzzy-filter the board (the same
  index the website uses); `cat:slug` narrows to a category (`.img`, `.pdf`, …).
- **The inspector is a sticky strip under the board**, always visible: identity
  (name, `cat:slug`, availability) │ CLI invocation │ flags and synopsis. Enter
  opens the tool there and the CLI/flags zone becomes its form, with the fields
  laid out in columns. Tab cycles the fields, Ctrl+R runs.
- **A full command runs directly**: `compress-image a.png --quality 80` in the
  prompt runs the tool and writes the result into the event log.
- **The event log** carries system events and tool results, newest last.

`qbtools`, `qbtools ui`, `qbtools tui` and `qbtools ink` all open the console.

## Keys (interactive console)

| Key            | Action                                     |
| -------------- | ------------------------------------------ |
| ← →            | move across a card row                     |
| ↑ ↓            | move between card rows (across categories) |
| Enter          | open the highlighted tool / run / submit   |
| Tab            | complete the highlighted tool              |
| Shift+Tab      | next / previous field in a tool form       |
| Space          | toggle (cleanup categories)                |
| Ctrl+R         | run the open tool                          |
| Y              | confirm a cleanup                          |
| Esc            | clear the prompt / close the card          |
| Ctrl+F         | focus the prompt                           |
| Ctrl+K         | clear the prompt                           |
| Ctrl+L         | clear the event log                        |
| Ctrl+C         | cancel a running tool, then quit           |
| Ctrl+A/E/U/K/W | edit the focused text field                |

Slash commands: `/help`, `/clear`, `/settings`, `/account`, `/cleanup`,
`/update`, `/quit`.

## Commands

| Command                        | Purpose                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `run <slug> [flags]`           | Run any tool headless (`--in`, `--out`, `--outdir`, `--stdin`, `--stdout`, `--json`) |
| `list [--category]`            | List tools                                                                           |
| `search <query>`               | Fuzzy search                                                                         |
| `info <slug>`                  | Tool details + CLI availability                                                      |
| `open <slug>`                  | Open the tool's web page                                                             |
| `media list\|get\|put`         | Server media storage — browse, download, upload (needs sign-in)                      |
| `cleanup scan\|clean\|analyze` | System cleanup (dry-run default; `--yes` deletes; `--commands` runs brew/apt)        |
| `login` / `whoami` / `logout`  | Optional account connect via API key                                                 |
| `doctor`                       | Environment diagnostics                                                              |
| `completions zsh\|bash\|fish`  | Shell completions                                                                    |
| `config` / `version` / `help`  | The rest                                                                             |

Everything works fully offline. Signing in is optional — it unlocks favorites
sync, the AI text helpers, and server media storage. Mistyped commands and
tool slugs suggest the closest real names, and file fields in the TUI
autocomplete as you type.

Exit codes: `0` ok · `1` error · `2` missing optional dependency / not signed in.

## Docs

- [Features](docs/features.md) — the full catalog
- [Tutorials](docs/tutorials.md) — hands-on walkthroughs
- [NPM deployment](docs/npm-deployment.md) — packaging & publishing

## Platform support

macOS and Linux are tier-1. Windows: headless mode and the cleanup utility work;
the interactive TUI is best-effort. Cleanup categories adapt to the running OS.
