# qbtools — QBTools in your terminal

A modern, interactive TUI for the [QBTools](https://github.com/Quadbits-Lab/QBTools) toolkit:
**42 tools** (calculators, PDF suite, images, media, graphics, security, developer utilities),
a **system cleanup utility**, scriptable headless mode with piping, and optional sync with your
QBTools server. Built with [OpenTUI](https://opentui.com/) on Bun.

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
qbtools                     # launch the interactive UI (first run: 30-second setup)
qbtools list                # all 42 tools, grouped
qbtools search pdf          # fuzzy search
qbtools run bmi-calculator --weight 70 --height 175 --json
echo "text to count" | qbtools run word-counter --stdin
qbtools run merge-pdf --in a.pdf --in b.pdf --out merged.pdf
qbtools doctor              # environment check
qbtools help                # everything else
```

## Keys (interactive UI)

| Key             | Action                      |
| --------------- | --------------------------- |
| ↑↓ / j k        | move                        |
| Enter           | open / select / run         |
| Space           | toggle (cleanup categories) |
| Tab / Shift+Tab | next / previous field       |
| Ctrl+R          | run the open tool           |
| Esc             | back                        |
| /               | jump to search              |
| ?               | help overlay                |
| Ctrl+C          | cancel run / quit           |

## Commands

| Command                        | Purpose                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `run <slug> [flags]`           | Run any tool headless (`--in`, `--out`, `--outdir`, `--stdin`, `--stdout`, `--json`) |
| `list [--category]`            | List tools                                                                           |
| `search <query>`               | Fuzzy search                                                                         |
| `info <slug>`                  | Tool details + CLI availability                                                      |
| `open <slug>`                  | Open the tool's web page                                                             |
| `cleanup scan\|clean\|analyze` | System cleanup (dry-run default; `--yes` deletes; `--commands` runs brew/apt)        |
| `login` / `whoami` / `logout`  | Server auth via API key                                                              |
| `doctor`                       | Environment diagnostics                                                              |
| `completions zsh\|bash\|fish`  | Shell completions                                                                    |
| `config` / `version` / `help`  | The rest                                                                             |

Exit codes: `0` ok · `1` error · `2` missing optional dependency / not signed in.

## Docs

- [Features](docs/features.md) — the full catalog
- [Tutorials](docs/tutorials.md) — hands-on walkthroughs
- [NPM deployment](docs/npm-deployment.md) — packaging & publishing

## Platform support

macOS and Linux are tier-1. Windows: headless mode and the cleanup utility work;
the interactive TUI is best-effort. Cleanup categories adapt to the running OS.
