# QBTools CLI — `qbtools` (OpenTUI, Bun)

Build `apps/cli` (`@qbtools/cli`) — a modern interactive terminal app exposing all 42 QBTools tools, scriptable headless mode, authentication against the existing web app, **and a CLI-exclusive System Cleanup Utility** (macOS/Windows/Linux). OpenTUI **React** reconciler on **Bun**. Binary name: **`qbtools`**. npm-publishable with full docs (Tutorials, NPM Deployment, Features).

## 1. Workspace scaffolding + npm-ready packaging

- Scaffold via `bunx create-tui -t react apps/cli --no-git --no-install`, then adapt:
  - `package.json`: name `@qbtools/cli` with `publishConfig: { name: "qbtools", access: "public" }` (**step 1: verify `qbtools` is free on npm; fallback `@qbtools/cli` org scope or `qbtools-cli` — decide before docs print install commands**), `"bin": { "qbtools": "./dist/bin.js" }`, shebang `#!/usr/bin/env bun`, `files: ["dist", "README.md", "docs"]`, `prepublishOnly: bun run build:package`.
  - Deps: `@opentui/core`, `@opentui/react`, `@opentui/keymap`, `react@19`, `qrcode`, `"@qbtools/registry": "workspace:*"`, `"@qbtools/engines": "workspace:*"`; `optionalDependencies: { sharp }`; the `@fontsource/*` packages used by `graphic.test.ts`. Scripts: `dev`, `typecheck` (`tsc --noEmit` — required by root turbo), `test`, `build:package`, `build` (`bun build --compile`).
- **Publish bundling**: `build:package` = `bun build src/bin.tsx --target=bun --outfile=dist/bin.js`, bundling private workspace packages into the artifact; public npm deps stay external in `dependencies` (mirror engines' dep list so lazy tool imports resolve post-install). Verified via `npm pack` + install-from-tarball smoke test.
- `apps/cli/tsconfig.json`: extends `../../tsconfig.base.json`, adds `jsxImportSource: "@opentui/react"`, `types: ["bun"]`, include `src`.
- Root `package.json`: add `"cli": "bun run --cwd apps/cli src/bin.tsx"`.
- `docker/Dockerfile`: add `COPY apps/cli/package.json apps/cli/` to the deps stage (**required** — frozen-lockfile breaks otherwise once `apps/cli` enters `bun.lock`).
- `bun install`; no turbo.json changes needed.

## 2. CLI architecture

```
apps/cli/src/
  bin.tsx              entry: argv dispatch; TTY + no subcommand → TUI (dynamic import); else headless
  headless/            subcommand dispatcher + flag parsing (zero OpenTUI imports)
  tui/                 app.tsx shell, theme.ts, screens/{dashboard,category,search,tool-runner,account,settings,cleanup}, components/{forms,progress,result-panel,status-bar}, keymap help overlay
  runner/              slug → runner definition (field schema + run fn + availability class), per-category runners calling @qbtools/engines/*
  services/            config.ts (profiles + first-run wizard state), auth.ts, api.ts, media.ts (ffmpeg), image-native.ts (sharp), output.ts, update-check.ts, cleanup/ (§9)
```

Shared runner core maps registry slugs → form schema → engine call (`ProcessingOptions`: AbortSignal ← cancel/SIGINT, `onProgress` → progress bar) → result (text/markdown/table/code/image-bytes/files). Same core serves TUI forms and headless flags.

**Config & onboarding**: first run launches a wizard (server URL default `http://localhost:8310`, optional login, output dir) writing `~/.config/qbtools/config.json`. Config supports **profiles** (`--profile work`) — named sets of server URL + output dir + ffmpeg path; credentials per profile in `auth.json` chmod 600. `QBTOOLS_SERVER` env overrides. **Update check**: non-blocking npm registry query at startup (15s timeout, daily cache), upgrade hint in TUI header/headless footer, `--no-update-check` or config opt-out.

## 3. Tool coverage (all 42)

- **Local now**: 5 calculators, word-counter, case-converter, password-generator, qr-code-generator (engines payloads + `qrcode` render), invoice-generator, merge/split/watermark-pdf, image-to-pdf (PNG), compress-pdf (qpdf text mode), protect-pdf, hash-generator, file/text-encryptor, code-formatter, compression-benchmark, og-banner-maker + favicon-generator + app-icon-generator (resvg Bun path; fonts via `file://` from CLI's @fontsource deps, mirroring `graphic.test.ts`), png-to-svg, barcode generate + scan (wasm injection).
- **Local with sharp** (optional dep, graceful message): compress-image, resize-image, convert-image; sharp decode feeds non-PNG inputs of image-to-pdf and png-to-svg.
- **Local with native ffmpeg** (`QBTOOLS_FFMPEG_PATH` or PATH; else "requires ffmpeg"): video-compressor, video-trimmer, video-to-audio, video-to-gif, audio-trimmer, thumbnail-maker (frame grab → graphic engine overlay). `Bun.$` with explicit arg arrays; progress from `-progress pipe:1` vs ffprobe duration; SIGINT kills cleanly.
- **Server + auth**: grammar-checker, paraphrasing-tool → new REST endpoints (§5).
- **Web-only** (status + deep-link via `qbtools open`): remove-background, signature-generator, redact-pdf, ocr-pdf, extract-text.
- **Engines change**: headless branch in `packages/engines/src/assets.ts` — when `location` undefined, resolve wasm keys (qpdf, zxing, brotli, zstd, jsquash) from node_modules → `file://` URLs (mirrors `resvg.ts`/`vectorize.ts` pattern). No browser behavior change.

## 4. Authentication (API keys + password)

Server changes (`apps/web`):
- `auth-core.ts`: add `apiKey()` plugin; `apiKeyClient()` in `auth-client.ts`.
- `packages/db/src/user-migrations.ts`: migration for the plugin's `api_key` table.
- Account page: "API Keys" card — create (show once), list, revoke.
- Extend `requireUser` to accept `Authorization: Bearer qbk_…`; API-key requests skip CSRF Origin check (non-cookie); rate limits unchanged. New server-side fetch stays http/https with host validation (no localhost/private).
- New `routes/api/ai/$.ts`: `POST /api/ai/grammar|paraphrase` reusing `ai.functions.ts` internals (requireUser, `RATE_LIMIT_AI_PER_HOUR`, `AI_MAX_INPUT_CHARS`).

CLI side:
- `services/api.ts`: injects `Authorization: Bearer` or `Cookie: better-auth.session_token=…` + `Origin: <server origin>` (CSRF hook requirement on mutations).
- `qbtools login` (password for dev servers via `/api/auth/sign-in/{username,email}` + Origin header; `--api-key` works everywhere), `logout`, `whoami` (GET `/api/account/profile`). Favorites work locally for anonymous users and **merge with server favorites on login**; recents sync both ways with local fallback offline. Error mapping: 401 → prompt login, 429 → retry-after.

## 5. TUI design

Theme from `packages/ui/src/theme.css`: monochrome dark (`#111111` bg, `#f8f8f8` fg, `#1a1a1a` card, `#212121`/`#292929`, `#b7b7b7`/`#8f8f8f`, `#191919` borders, `#f87171` destructive) + category accents (emerald/rose/indigo/amber/violet) for icons/status only. better-ui principles adapted: consistent spacing rhythm, explicit empty/loading/error/missing-dependency states, animation only for progress/entrance.

- **Shell**: header (ascii-font logo, version, update hint, server status dot, user chip) / sidebar (Dashboard, Search, 8 categories, **System** (cleanup + doctor), Favorites, Recents, Account, Settings) / contextual keybind footer.
- **Dashboard**: popular tools, recents, favorites, availability summary. **Search**: live fuzzy via `buildSearchIndex(tools)`.
- **Tool runner**: schema-driven forms (`input`/`textarea`/`select`/`tab-select`/`slider`), Run/Cancel, progress bar, result panel (`<text>`/`<markdown>`/TextTable/`<code>`/`<image>` preview, output paths), Esc back / R rerun.
- **Cleanup screen** (§9), **Account**, **Settings** (profiles UI), **Help overlay** (`?`, `@opentui/keymap`); global `/` search, Esc back, Ctrl+C via `exitOnCtrlC` (never `process.exit()`; `renderer.destroy()`).

## 6. Headless commands

`qbtools run <slug> [flags]` with **`--stdin`** (read input from pipe) and **`--stdout`** (write result bytes to stdout for chaining: `cat x.md | qbtools run word-counter --stdin --json | jq`), `--field value`, `--in <files…>`, `--out`, `--json`; `list [--category]`, `search`, `info`, `open <slug>` (opens web tool in browser); **`cleanup scan|clean|analyze`** (§9); `completions zsh|bash|fish` (generated from the command + flag registry); `login`/`logout`/`whoami`; `config get/set` (+ `--profile`); `doctor`; `version`, `help`. Non-TTY auto-headless. Exit codes: 0 ok, 1 error, 2 missing optional dependency.

## 7. System Cleanup Utility (CLI-exclusive, macOS/Windows/Linux)

Safety-first **scan → review → clean** model in `services/cleanup/`:
- **Scan always runs first**: every target category reports files + reclaimable size. Headless `cleanup clean` requires `--yes` after a scan report (or `--dry-run`, which is the default without `--yes`); TUI shows a checkbox category list with sizes → explicit confirm.
- **Allowlisted targets only** — well-known user-level paths per OS, no user-supplied recursive deletes:
  - *macOS*: `~/Library/Caches/*` (per-app), `~/Library/Logs`, `~/.Trash`, DNS flush (`dscacheutil`/`mDNSResponder` via native cmds), browser caches (Chrome/Edge/Firefox/Safari cache dirs, skipping locked/running profiles), dev caches (Xcode DerivedData + iOS Simulator caches, Homebrew via `brew cleanup`, npm/yarn/pnpm/**bun** install caches), `.DS_Store` sweep.
  - *Linux*: `~/.cache`, `~/.thumbnails`, `~/.local/share/Trash`, apt archives (`apt-get clean` where available), journald vacuum (`journalctl --vacuum-time`), flatpak unused, browser + dev caches as above.
  - *Windows*: `%TEMP%`, Recycle Bin (`Clear-RecycleBin` via PowerShell), browser caches (%LocalAppData%), npm/bun caches, Delivery Optimization (marked advanced/admin).
  - Prefer **native commands** where they exist (`brew cleanup`, `apt-get clean`, `journalctl`, `Clear-RecycleBin`, `docker system prune` behind an explicit opt-in flag).
- **Path guards**: every deletion candidate is resolved and verified inside its allowlisted base (realpath check — no symlink escapes), skips symlinks/socket/fifo/device files, refuses anything requiring elevation except via the native commands above (marked "requires elevation", skipped by default).
- **Audit log**: every run writes what was deleted (paths + sizes) to `~/.config/qbtools/cleanup-logs/<date>.json`; summary shows freed space per category.
- **`cleanup analyze`**: read-only storage report — largest directories/files among the target areas plus configurable roots (never deletes).
- TUI "System" section hosts cleanup + doctor; `doctor` reports per-OS cleanup target availability.

## 8. Documentation (new deliverables)

Under `apps/cli/` (shipped in the npm tarball):
1. **`README.md`** — overview, install (`npm i -g qbtools` / `bunx qbtools` / from repo; **verified npm name**), 60-second quickstart, key table, platform support note (macOS/Linux tier-1, Windows best-effort for TUI; cleanup supports all three), links.
2. **`docs/features.md`** — complete catalog: TUI capabilities, 42-tool coverage matrix (local/+sharp/+ffmpeg/server/web-only), cleanup utility (categories per OS, safety model, audit logs), auth, piping/scripting, completions, update check, profiles, doctor, offline-first.
3. **`docs/tutorials.md`** — (1) Install & first run + wizard; (2) TUI tour (BMI calc, QR with in-terminal image preview); (3) Authenticate with an API key; (4) Scripting & CI (piping, `--json`, batch PDF merge, exit codes); (5) Media with ffmpeg; (6) Image tools with sharp; (7) Graphics suite (OG banner, favicon set); (8) System cleanup safely (scan → review → clean, audit log).
4. **`docs/npm-deployment.md`** — bundling strategy, Bun ≥1.4 runtime requirement and why, `files`/`bin`/`prepublishOnly`, publish steps (`build:package` → `npm pack` verify → `npm publish` from `apps/cli`), versioning (`npm version`), CI workflow (`.github/workflows/release-cli.yml`: on tag → build, pack verify, publish with `NPM_TOKEN`, upload `bun build --compile` standalone binaries for darwin-arm64/linux-x64/windows-x64 to the GitHub Release), post-publish checklist (`npx qbtools@latest doctor`), troubleshooting (sharp platform binaries, wasm paths in bundled context).
- Root `README.md`: short CLI section linking to `apps/cli/README.md`.

## 9. Tests & verification

- `runner-map.test.ts` parity: every registry slug → exactly one CLI runner or explicit web-only entry (modeled on `widgets.test.ts`).
- Cleanup tests (highest-risk area): path-guard unit tests (symlink escape, symlink/socket skip, base containment) against temp dirs; scan/clean round-trip on fixtures; dry-run deletes nothing; audit log written.
- Headless round-trips (word-counter incl. `--stdin`, case-converter, password, qr, hash, merge-pdf temp files), completions snapshot per shell, auth store perms/round-trip, api.ts header formation (mocked fetch), assets.ts headless URLs exist, update-check cache behavior (mocked registry), TUI snapshot tests via `createTestRenderer` (shell, search, tool form, cleanup screen — few and stable).
- Packaging: `npm pack` tarball contains `dist/bin.js` + docs; install tarball in temp dir → `qbtools version` + one headless run works.
- Full gate: `bun install`, `bun test`, `bun run typecheck`, `bun run lint`, web `bun run build` unaffected, Docker deps stage installs, live smoke: `qbtools list`, `run word-counter --text "hello world" --json`, piping round-trip, TUI launch, login/whoami vs local dev server, `cleanup scan` on a fixture HOME. Actual `npm publish` stays a user-executed step per the guide.

## Execution order

1. Scaffold + workspace wiring (root script, Dockerfile COPY, lockfile, **npm name verification**) — `qbtools help/list/version/completions` headless works.
2. Runner core + registry map + availability + engines `assets.ts` headless branch; Tier-1 local tools runnable headless; `--stdin/--stdout` piping; `open` deep-link; config + profiles + first-run wizard + update check.
3. TUI shell: theme, sidebar, dashboard, search, category, tool runner.
4. Auth: server apiKey plugin + migration + account UI + bearer `requireUser`; CLI login/whoami/logout + favorites merge/recents sync.
5. AI endpoints + CLI AI runners; sharp service + image tools; ffmpeg service + media tools.
6. **System Cleanup Utility** (per-OS cleaners, path guards, scan/clean/analyze, TUI System screen, audit logs).
7. Packaging (`build:package`, npm pack verification, CI workflow) + all docs (README, features, tutorials incl. cleanup, npm-deployment) + doctor/help polish + complete tests + full verification pass.