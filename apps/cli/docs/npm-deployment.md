# NPM deployment

How `qbtools` is packaged, verified, versioned and published.

## Package layout

The workspace package is `@qbtools/cli` (private); the published name is
**`qbtools`** via `publishConfig.name`. On `npm publish` npm applies
`publishConfig` (name/access) — the tarball installs as `qbtools`.

```
apps/cli/
├── src/               # TypeScript sources (not shipped)
├── scripts/build-package.ts
├── dist/bin.js        # the shipped bundle (built by prepublishOnly)
├── docs/              # shipped: features, tutorials, npm-deployment
└── package.json
```

`files: ["dist", "README.md", "docs"]` keeps the tarball tight;
`bin: { qbtools: "./dist/bin.js" }` points at the bundle, whose first line is
`#!/usr/bin/env bun`.

## Bundling strategy

`bun run build:package` runs `scripts/build-package.ts`:

- **Entry:** `src/bin.tsx` → `dist/bin.js` (ESM, target `bun`).
- **Inlined:** all `@qbtools/*` workspace sources (registry + engines) — the
  published package has no workspace links.
- **External:** everything listed in `dependencies`/`optionalDependencies` of
  the CLI and engines manifests (~45 packages). They ship as real npm
  dependencies, so lazy `import()`s inside the bundled engines resolve at
  runtime, and wasm binaries load from the installed packages (the CLI's
  `assetBase` maps keys → `file://…node_modules/…` — no CDN fetches).
- **Fonts:** the graphics tools resolve `@fontsource/*` woff2 files from the
  installed packages the same way, so `@fontsource/*` are regular dependencies.
- **sharp** is an `optionalDependency`: installs where prebuilt binaries
  exist; otherwise image tools degrade to exit code 2 with an install hint.

Runtime requirement: **Bun ≥ 1.4** (the Ink TUI + `bun:sqlite`-free engines path
rely on Bun's runtime; no Node support is claimed).

## Release flow

```bash
cd apps/cli
npm version minor            # or patch/major — updates package.json + git tag
bun install                  # refresh lockfile if deps moved
bun run build:package        # produces dist/bin.js
bun test                     # workspace tests still green
npm pack                     # inspect the tarball (next section)
npm publish                  # publishConfig renames it to qbtools
```

`prepublishOnly` runs `build:package`, so a plain `npm publish` cannot ship a
stale bundle. `npm pack` first — always eyeball `tarball --list` output
(`dist/bin.js`, `dist/bin.js.map`, `README.md`, `docs/*.md`, `package.json`).

## Post-publish verification

```bash
npx qbtools@latest version          # prints the new version
npx qbtools@latest doctor           # environment probe
echo hi | npx qbtools@latest run word-counter --stdin
```

Also smoke-test from a clean shell without the repo's node_modules on the path.

## Standalone binaries (optional)

For environments without npm, `bun build --compile` produces self-contained
executables (they still lazy-load wasm from the bundle's dependencies — ship
the whole `node_modules` or use `--compile` with embedded packages):

```bash
bun build src/bin.tsx --compile --outfile dist/qbtools-darwin-arm64
```

Attach per-platform binaries to the GitHub Release; the npm package remains
the primary distribution.

## Troubleshooting

| Symptom                                                               | Cause                                  | Fix                                                                                                            |
| --------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Cannot find module "@jsquash/jpeg/encode.js"` post-install           | dependency missing from `dependencies` | add it to apps/cli `dependencies` (build externalizes by that list)                                            |
| Image tools: "needs the optional sharp package" on a musl/alpine host | no prebuilt sharp binary               | `npm i -g sharp --build-from-source` or skip image tools                                                       |
| Graphics tools: font resolve errors in the published package          | `@fontsource/*` not installed          | they are dependencies — reinstall; check `bun pm ls @fontsource/inter`                                         |
| Published name collision                                              | `qbtools` taken                        | fallback: `@qbtools/cli` (needs org) or `qbtools-cli` — update `publishConfig.name`, docs and CI in one commit |

## CI workflow

`.github/workflows/release-cli.yml` (repo root) automates this: on a pushed
`v*` tag it installs Bun 1.4, runs install + typecheck + tests, builds the
bundle, verifies with `npm pack`, and publishes with `NPM_TOKEN` (configure
the secret in the repo settings; set `NPM_CONFIG_PROVENANCE: true` for
provenance attestations).
