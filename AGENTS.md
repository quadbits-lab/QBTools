# Repository Guidelines

## Project Structure & Module Organization
QBTools is a Bun workspace monorepo using TanStack Start, React, TypeScript, and Tailwind CSS.
- `apps/web/src/routes/`: pages and server routes; `components/`: shared interface components; `server/`: server functions and configuration.
- `apps/web/src/tools/<slug>/index.tsx`: individual tool widgets; `apps/web/public/`: static assets.
- `packages/engines/`: framework-free processing logic; `packages/registry/`: tool metadata, categories, SEO copy, and search.
- `packages/ui/`: design tokens and primitives; `packages/content/`: guides; `packages/db/`: SQLite schema, migrations, and backups.
- Tests live beside source files as `*.test.ts`. Deployment lives in `docker/` and Compose files.

## Build, Test, and Development Commands
Run commands from the repository root with Bun 1.4 or newer (package manager pinned to 1.4.3).
- `bun install`: install workspace dependencies.
- `bun run dev`: start development at `http://localhost:8310`.
- `bun test`: run all unit tests.
- `bun run typecheck`: check TypeScript across workspaces.
- `bun run lint`: run Biome checks; `bun run format`: apply formatting and automated fixes.
- `bun run build && bun run start`: build and serve production locally.

## Coding Style & Naming Conventions
Use strict TypeScript, tab indentation, double quotes, and Biome's 100-character line width and import organization. Follow existing kebab-case filenames and tool slugs, PascalCase React components, and camelCase functions. Avoid editing generated `routeTree.gen.ts`. Keep processing logic in engines and load heavy browser dependencies lazily.

## Testing Guidelines
Use `bun:test` with descriptive `describe`/`test` cases and `expect` assertions. Run focused tests with, for example, `bun test packages/engines/src/text/text.test.ts`. Cover behavior, edge cases, and regressions; no numeric coverage threshold is configured.

When adding a tool, define its `ToolDef` in the registry, add engine logic and tests, create its widget, and register it in `apps/web/src/tools/widgets.ts`. The widget parity test checks registry alignment. Run tests, typecheck, lint, and build before submitting.

## Commit & Pull Request Guidelines
Recent commits use descriptive phase summaries such as `Phase 6-12 Updates, Bug Fixes, RBAC Auth`; no strict commit format is established. Prefer focused messages describing the change. PRs should explain behavior changes, link relevant issues, report validation, and include screenshots for interface changes.

## Security & Configuration
Use `.env.example` for configuration; never commit secrets. Keep file processing browser-local and disclose server-bound AI requests. Preserve server-side validation, rate limits, and admin authorization checks.
