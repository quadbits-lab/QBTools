# QBTools — Agent Guide

Privacy-first, browser-local suite of **42 tools** (Bun 1.4+, Turborepo monorepo, TanStack Start + React 19, Tailwind v4, Biome).

`packages/registry` is the single source of truth: category pages, the generic `/tools/$slug` route, sitemap/robots, the search index, and related-tool recommendations are all derived from it. **Never add a per-tool route file** and never hand-edit generated output.

## Commands

Run from the repo root.

- `bun install` — run first; several scripts read `packages/engines/node_modules` and `apps/web/node_modules` directly.
- `bun run dev` — web app only, `http://localhost:8310` (strict port). Runs `scripts/prepare-wasm.ts` + `scripts/build-sw.ts` first.
- `bun test` — all workspaces (`bunfig.toml` sets root = repo root). `bun test <path/to/file.test.ts>` for one file, `bun test -t "<name>"` for one case. **Pre-existing failures (not yours):** 3 cases in `apps/cli/src/headless/cmd/media.test.ts` (temp-dir/auth-fixture teardown).
- `bun run typecheck` — Turbo `tsc --noEmit` per package. One package: `bunx turbo run typecheck --filter=@qbtools/engines`.
- `bun run lint` / `bun run format` — Biome `check` / `check --write`. One file: `bunx biome check <file>`.
- `bun run build` — web only (root script filters `@qbtools/web`). `bun run start` then serves `apps/web/server.ts` (requires a prior build).
- `bun run test:browser` — Playwright; dev server on **8311** (not 8310).
- `bun run cli` — Ink terminal app (interactive command palette); published binary is `qbtools` (interactive TUI, `run`/`cleanup`/`doctor`/`open`).
- `bun run db:backup` — `VACUUM INTO` snapshot of the app SQLite DB.

## Layout

- `apps/web/` — TanStack Start app. `src/routes/` file-based routing; `src/tools/<slug>/index.tsx` lazily-loaded widgets; `src/server/` server functions (AI, auth, admin, rate limiting); `server.ts` production entry.
- `apps/cli/` — terminal app over `@qbtools/engines` + `@qbtools/registry`. `src/runner/runners/*.ts` implement tools; `src/runner/map.ts` registers them. The interactive UI is Ink: `src/tui/console.tsx` is the console shell (header/command bar/tool browser/inspector/event log/status bar), `src/tui/console/` holds its panels and cards, `src/tui/ui/` is the local component library (Ink has no `<select>`/`<input>`/`<textarea>` — they are built there). `src/tui/ui/key-router.tsx` owns the single `useInput` and dispatches by priority (widget 10 › card 5 › screen 0 › shell −10).
- `packages/registry/` — `ToolDef` per tool in `src/tools/<category>.ts`; `src/search.ts` builds the search index.
- `packages/engines/` — framework-free logic, exported only via subpath exports (`@qbtools/engines/calc`, `/text`, `/image`, `/pdf`, `/media`, `/crypto`, …). Deep paths are not exported.
- `packages/ui/` — design tokens (`theme.css`) + primitives; `packages/db/` — SQLite + PGlite schemas; `packages/content/` — guides.

## Adding a tool

1. `ToolDef` in `packages/registry/src/tools/<category>.ts` (`category` must be a `CategoryId` from `packages/registry/src/types.ts`).
2. Engine logic + `*.test.ts` in `packages/engines/`.
3. Widget at `apps/web/src/tools/<slug>/index.tsx` **and** an entry in `apps/web/src/tools/widgets.ts`. That file is parsed by regex (`/^\t"([a-z0-9-]+)": lazy/gm`) in `widgets.test.ts` — entries must be tab-indented, double-quoted, and start with `lazy(`.
4. CLI: a runner in `apps/cli/src/runner/runners/` registered in `map.ts` `RUNNERS`, **or** a `WEB_ONLY_TOOLS` entry. `runner-map.test.ts` asserts every registry slug is covered and that `WEB_ONLY_TOOLS.size === 5` — update that expectation if a 6th tool is genuinely browser-only.
5. `bun test` → `bun run typecheck` → `bun run lint`.

## Generated code, assets, migrations

- `apps/web/src/routeTree.gen.ts` — emitted by the TanStack Start Vite plugin. Never edit.
- `apps/web/public/wasm/` and `apps/web/public/sw.js` — build artifacts, gitignored. `scripts/prepare-wasm.ts` copies each WASM/OCR package into `public/wasm/<key>-<version>/` and writes `manifest.json`. **A new WASM dependency is not picked up automatically** — add a `copyPackage(...)` call there.
- `apps/web/src/routeTree.gen.ts`, `drizzle/meta`, and `*.css` are excluded from Biome.
- DB migrations are forward-only SQL arrays in code (`packages/db/src/migrations.ts`, `user-migrations.ts`), applied by `migrate()` / `migrateUsers()` when a DB is created. There is no drizzle-kit CLI — append entries, never edit applied ones.

## Data

- App DB: SQLite via `bun:sqlite` + Drizzle (`packages/db/src/schema.ts`), path `DATABASE_PATH` (default `./data/qbtools.db`).
- User DB: PGlite (`packages/db/src/user-schema.ts`), directory `PGLITE_DATA_DIR` (default `./data/users`); PGlite is `external` in the Vite SSR config.
- Backups: `bun run db:backup` (app DB) and `bun run --cwd packages/db users:backup` (PGlite tarball).

## Environment

- **Root `.env` only.** `apps/web/vite.config.ts` sets `envDir: "../../"` and copies root env vars into `process.env` (only when unset), so server code sees them all. The README's `cp .env.example apps/web/.env` instruction is stale.
- `apps/web/src/server/env.ts` zod-validates server config on **first use** (not at boot): `ADMIN_TOKEN` ≥ 16 chars or empty, plus AI/rate-limit knobs. Bad values throw at request time.
- Build-time env: Turbo's `build.env` is only `VITE_*` + `SITE_URL`; anything else the build reads must be added to `turbo.json` `globalPassThroughEnv`.
- Compose (`compose.yml`, `compose.dev.yml`) reads the root `.env`; `compose.yml` pins container `PORT=8310`, `DATABASE_PATH=/data/qbtools.db`, `PGLITE_DATA_DIR=/data/users`.

## Testing quirks

- Unit: `bun:test`, `*.test.ts` beside sources. Browser: only `*.pw.ts` under `tests/browser/`, run **serially** (`workers: 1`) across chromium/firefox/webkit. Playwright starts the dev server on port 8311 unless `QBTOOLS_TEST_URL` points at an external server; `tests/browser/setup.ts` waits up to 30s for `/api/health` → `status === "ok"`.
- Opt-in suites: `QBTOOLS_RUSTFS_TEST=1` plus a disposable RustFS (`scripts/rustfs-test-setup.ts`) for `apps/web/src/server/rustfs.test.ts`; browser account tests need `QBTOOLS_AUTH_FIXTURE` from `scripts/seed-auth-test.ts` (writes only to a disposable `qbtools-auth-test-` dir).
- Binary fixtures live in `tests/fixtures/` — regenerate with `scripts/generate-media-fixtures.sh`.
- `apps/cli/src/version.ts` `CLI_VERSION` must equal `apps/cli/package.json`'s `version` (asserted by `version.test.ts`).

## Style

- Biome: tabs, double quotes, 100-char lines, organized imports. Linting is disabled for `packages/ui/src/primitives/**`.
- Strict TS with `noUncheckedIndexedAccess` (`tsconfig.base.json`).
- kebab-case file names and tool slugs; PascalCase components; camelCase functions.
- Keep processing logic in `packages/engines/`; load heavy browser dependencies (WASM, ML models) lazily per tool.

## Release

CLI publishes to npm on a `v*` tag (`.github/workflows/release-cli.yml`): typecheck → `bun test apps/cli packages/engines packages/registry` → `apps/cli build:package` → npm publish + GitHub release. Bump `apps/cli/package.json` and `CLI_VERSION` before tagging; the web app is deployed via Docker, not npm.

## Security

Files never leave the browser; only `grammar-checker` and `paraphrasing-tool` call the server (Anthropic SDK, char-capped, IP rate-limited) — keep those requests disclosed, capped, and rate-limited. `/admin` is guarded by an HMAC-signed HttpOnly `SameSite=Strict` cookie; preserve server-side Zod validation and rate limits in `apps/web/src/server/`. Never commit `.env*` (only `.env.example` is tracked).
