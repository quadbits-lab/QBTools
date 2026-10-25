# Repository Guidelines

## Commands

Run from the repo root. Bun 1.4+ (workspace pinned to 1.4.3); `dev`/`build`/`typecheck` are orchestrated by Turborepo, `lint` is plain Biome.

- `bun install`
- `bun run dev` — dev server at `http://localhost:8310` (strict port). The web `dev` script first runs `scripts/prepare-wasm.ts` + `scripts/build-sw.ts`; if `apps/web/public/wasm/` or `public/sw.js` are missing/stale, rerun via `bun run dev` — they are generated, never hand-edit them.
- `bun test` — all unit tests. Focused: `bun test packages/engines/src/text/text.test.ts`
- `bun run typecheck` — `tsc --noEmit` in every workspace package
- `bun run lint` / `bun run format` — Biome `check` / `check --write`
- `bun run build && bun run start` — production build + `apps/web/server.ts`
- `bun run test:browser` — Playwright suite (see Testing)
- `bun run cli` — OpenTUI terminal app in `apps/cli` (published as `qbtools` on npm)

## Layout

- `apps/web/` — TanStack Start app (React 19, Tailwind v4, Vite). `src/routes/` file-based routing; `src/tools/<slug>/index.tsx` lazily-loaded tool widgets; `src/server/` server functions (AI, auth, admin, rate limiting); `server.ts` production entry.
- `apps/cli/` — terminal app reusing `@qbtools/engines` + `@qbtools/registry`. **Adding a tool requires CLI coverage too**: a runner in `apps/cli/src/runner/` + `map.ts`, or an explicit entry in `WEB_ONLY_TOOLS`. Enforced by `runner-map.test.ts`.
- `packages/registry/` — `ToolDef` metadata per category in `src/tools/<category>.ts`; drives search index, sitemap, and recommendations automatically.
- `packages/engines/` — framework-free processing logic. `packages/ui/` tokens + primitives; `packages/db/` SQLite/PGlite schemas; `packages/content/` guides.

## Adding a tool

1. `ToolDef` in `packages/registry/src/tools/<category>.ts`
2. Engine logic + `*.test.ts` in `packages/engines/`
3. Widget at `apps/web/src/tools/<slug>/index.tsx`, lazy entry in `apps/web/src/tools/widgets.ts` (parity enforced by `widgets.test.ts`)
4. CLI runner or `WEB_ONLY_TOOLS` entry (see above)
5. `bun test`, then `bun run typecheck` and `bun run lint`

## Generated code & migrations

- `apps/web/src/routeTree.gen.ts` is emitted by the TanStack Start Vite plugin on dev/build — do not edit.
- `apps/web/public/wasm/` and `apps/web/public/sw.js` are build artifacts (gitignored).
- DB migrations live as code in `packages/db/src/` and are applied programmatically by `migrate()` on DB creation — there is no drizzle-kit CLI. `bun run db:backup` does a safe online SQLite snapshot.

## Environment

- `.env` is loaded from the **repo root** (Vite `envDir` in `apps/web/vite.config.ts`); values only apply when the corresponding process env var is unset. Compose files (`compose.yml`, `compose.dev.yml`) read the root `.env`. Full flag reference: `.env.example`.
- Server config is zod-validated in `apps/web/src/server/env.ts` (`ADMIN_TOKEN` ≥ 16 chars or empty; AI/rate-limit knobs).
- Turbo build passes through only `VITE_*` and `SITE_URL` plus the vars listed in `turbo.json` `globalPassThroughEnv` — new env vars used at build time must be added there or builds won't see them.

## Testing

- Unit tests use `bun:test`, files named `*.test.ts` beside sources.
- Browser tests: only `*.pw.ts` files under `tests/browser/`, run **serially** (`workers: 1`) across chromium/firefox/webkit. Playwright auto-starts the dev server on port 8311 unless `QBTOOLS_TEST_URL` points at an external server (e.g. the Docker container); setup waits for `/api/health` up to 30s.
- Binary fixtures live in `tests/fixtures/` (regenerate with `scripts/generate-media-fixtures.sh`).

## Coding Style

Strict TypeScript. Biome: tabs, double quotes, 100-char lines, organized imports; linting is disabled for `packages/ui/src/primitives/**`. kebab-case filenames and tool slugs, PascalCase components, camelCase functions. Keep processing logic in `packages/engines/`; load heavy browser dependencies (WASM, ML models) lazily per tool.

## Security

Never commit secrets (`.env*` is gitignored except `.env.example`). File processing must stay browser-local; only AI grammar/paraphrase tools hit the server — keep those requests disclosed, character-capped, and IP rate-limited. Preserve server-side Zod validation, rate limits, and admin HMAC-cookie authorization in any change to `apps/web/src/server/`.

## Commits & PRs

No strict commit format — use focused, descriptive messages. PRs should explain behavior changes, link issues, report test/typecheck/lint results, and include screenshots for UI changes.
