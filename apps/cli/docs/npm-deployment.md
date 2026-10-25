# Publishing `qbtools` to npm

A complete guide to packaging, verifying, versioning and publishing the CLI from the
QBTools monorepo — by hand the first time, then automatically from CI.

- [1. How the package is put together](#1-how-the-package-is-put-together)
- [2. One-time setup](#2-one-time-setup)
- [3. First release (manual)](#3-first-release-manual)
- [4. Every release after that (CI)](#4-every-release-after-that-ci)
- [5. Versioning](#5-versioning)
- [6. Verifying a release](#6-verifying-a-release)
- [7. Fixing mistakes](#7-fixing-mistakes)
- [8. Troubleshooting](#8-troubleshooting)
- [9. Checklist](#9-checklist)

---

## 1. How the package is put together

| Item | Value |
| --- | --- |
| npm name | `qbtools` (workspace `apps/cli`; the monorepo root is `qbtools-monorepo`) |
| Executable | `bin: { qbtools: ./dist/bin.js }` — first line is `#!/usr/bin/env bun` |
| Runtime | **Bun ≥ 1.4 only.** There is no Node fallback; users need Bun on `PATH` |
| Build | `bun run build:package` → `scripts/build-package.ts` → `dist/bin.js` (+ `.map`) |
| Shipped files | `dist/bin.js`, `dist/bin.js.map`, `README.md`, `docs/` (≈ 690 kB) |

### Bundling strategy

The monorepo workspace packages `@qbtools/engines` and `@qbtools/registry` are **not
published**. They are `devDependencies` (`workspace:*`) and get **inlined** into `dist/bin.js`
at build time.

Every package listed in `dependencies` / `optionalDependencies` of the CLI, engines and
registry manifests is kept **external** (43 packages) and installed by npm next to the CLI.
That is what lets the lazy `import()`s, WASM binaries (`@jsquash/*`, `qpdf`, `resvg`, …) and
`@fontsource/*` fonts resolve from `node_modules` at runtime.

> **Rule:** if an engine starts importing a new third-party package, add it to
> `apps/cli/package.json` `dependencies`. The build only externalises what is declared; an
> undeclared import is either bundled badly or fails after install with
> `Cannot find module`.

`sharp` is an `optionalDependency` (image tools degrade with exit code 2 and an install
hint when it has no prebuilt binary). `ffmpeg` is detected on `PATH`, never installed.

### Two different build outputs — don't confuse them

| Script | Output | Published? |
| --- | --- | --- |
| `bun run build:package` | `dist/bin.js` (needs Bun + `node_modules`) | **Yes** |
| `bun run build` | `dist/qbtools` — a 93 MB `bun --compile` executable | **No** |

`files` lists `dist/bin.js` and `dist/bin.js.map` explicitly. Do **not** change it back to
`"dist"`: it would put the 93 MB binary in the tarball (44 MB → 376 kB is the difference).

`prepack` runs `build:package`, so `npm pack` and `npm publish` always rebuild the bundle.

---

## 2. One-time setup

1. **npm account** with 2FA enabled: <https://www.npmjs.com/signup>.
2. **Name check** — `npm view qbtools` returned 404 on 2026-10-25, so the name was free.
   Names are first-come; re-check right before publishing. If it is taken, use a scoped name
   (`@your-org/qbtools`) — you'd need an npm org, and `publishConfig.access: public` is
   already set, which scoped packages require.
3. **License** — the repo has no `LICENSE` file and `package.json` has no `license` field.
   Pick one (e.g. MIT), add `LICENSE` to the repo root, add `"license": "MIT"` to
   `apps/cli/package.json`, and copy the file into `apps/cli/` (npm only includes a LICENSE
   from the package directory). Publishing without a license means nobody is legally allowed
   to use it.
4. **Local login:**
   ```bash
   npm login
   npm whoami
   ```
5. **CI token** (for section 4): on npmjs.com → Access Tokens → *Generate New Token* →
   **Granular access token**, scope *Read and write* limited to the `qbtools` package
   (create it after the first manual publish), then add it in GitHub →
   *Settings → Secrets and variables → Actions* as **`NPM_TOKEN`**.
   Granular tokens expire (max 1 year) — put the renewal date in your calendar.

---

## 3. First release (manual)

Run everything from the repo root unless a `cd` is shown. The first publish is done by hand so
that you can inspect the result before automating it.

```bash
# 0. Clean, current checkout
git switch beta && git pull
bun install --frozen-lockfile

# 1. Quality gates
bun run typecheck
bun test apps/cli packages/engines packages/registry
```

> The repo notes 3 known failures in `apps/cli/src/headless/cmd/media.test.ts`
> (temp-dir/auth-fixture teardown). Those same tests run in CI, so the release workflow
> **will fail on them until they are fixed or excluded**. Fix the tests before relying on CI.

```bash
# 2. Build and inspect the tarball
cd apps/cli
bun run build:package
npm pack --dry-run
```

Expected: package `qbtools@<version>`, **8 files**, ≈ 690 kB —
`README.md`, `dist/bin.js`, `dist/bin.js.map`, `docs/assets/qbtools-cli-banner.png`,
`docs/{features,tutorials,npm-deployment}.md`, `package.json`. Anything over a few MB means
something unintended is included.

```bash
# 3. Prove it installs and runs from a clean project (no monorepo on the path)
npm pack
mkdir /tmp/qb-smoke && cd /tmp/qb-smoke && npm init -y
npm i /path/to/apps/cli/qbtools-0.2.0.tgz
./node_modules/.bin/qbtools version
echo "one two three" | ./node_modules/.bin/qbtools run word-counter --stdin --json
./node_modules/.bin/qbtools doctor
```

(`qbtools doctor` reporting the local server as unreachable is normal.)

```bash
# 4. Publish
cd apps/cli
npm publish          # first publish of a name; --access public is already in publishConfig
```

npm asks for a 2FA one-time password. Then verify (section 6) and tag:

```bash
git tag v0.2.0 && git push origin v0.2.0   # see the CI caveat below
```

> **Careful:** pushing a `v*` tag triggers the release workflow, which would try to publish
> the same version again and fail with `403 cannot publish over existing version`. For the
> very first release, either let CI do the publish (skip step 4) or push the tag with the
> manual publish already done and accept a red run — don't do both expecting a green one.
> Simplest path: do steps 0–3 manually, then publish via the tag.

---

## 4. Every release after that (CI)

`.github/workflows/release-cli.yml` runs on any pushed tag matching `v*`:

1. checkout, **Bun 1.4.3** (matches the root `packageManager`), Node 22 for `npm`
2. `bun install --frozen-lockfile`
3. **tag must equal `v` + `apps/cli/package.json` version** — otherwise the run stops
4. typecheck, then `bun test apps/cli packages/engines packages/registry`
5. `build:package`
6. `npm pack`, assert `dist/bin.js` and `docs/features.md` are present and that the 93 MB
   `dist/qbtools` binary is **not**
7. smoke-run `bun dist/bin.js version` and the `word-counter` tool
8. `npm publish --provenance --access public` using `NPM_TOKEN`
9. create a GitHub Release with generated notes

Provenance requires the job's `id-token: write` permission (already set) and publishing from
GitHub-hosted runners; the npm page then shows a verified "Built and signed on GitHub
Actions" badge linking to the commit.

### Release recipe

```bash
git switch beta && git pull

# bump apps/cli/package.json AND apps/cli/src/version.ts to the same number
cd apps/cli
npm version minor --no-git-tag-version      # or patch / major
# edit src/version.ts: export const CLI_VERSION = "<same version>";
bun test src/version.test.ts                # must pass

cd ../..
bun install                                 # refresh bun.lock's workspace version
git add -A && git commit -m "release: qbtools v0.3.0"
git push

git tag v0.3.0
git push origin v0.3.0                      # triggers the workflow
```

`npm version` is run with `--no-git-tag-version` because the monorepo root is the git root;
the default behaviour would try to create a tag/commit scoped oddly. `CLI_VERSION` is a
hand-maintained constant — `version.test.ts` fails if it drifts from `package.json`, which is
exactly the bug that was present before this guide was written (`0.1.0` vs `0.2.0`).

---

## 5. Versioning

Follow semver:

| Change | Bump |
| --- | --- |
| Bug fix, internal change, dependency patch | patch (`0.2.0 → 0.2.1`) |
| New tool, new flag, new command | minor (`0.2.0 → 0.3.0`) |
| Removed/renamed command or flag, changed exit codes or JSON output shape | major (while `0.x`, bump minor and say so in the release notes) |

Pre-releases: `npm version 0.3.0-beta.1 --no-git-tag-version`, publish with
`npm publish --tag beta`, and users install with `npm i -g qbtools@beta`. `latest` stays on the
last stable release. In CI, add `--tag beta` when the tag contains a hyphen if you want this
automated.

---

## 6. Verifying a release

```bash
npm view qbtools version dist-tags
npx qbtools@latest version
npx qbtools@latest doctor
echo hi | npx qbtools@latest run word-counter --stdin --json
```

Also `bun add -g qbtools` / `npm i -g qbtools` on a machine (or container) that has never seen
the repo. Remember the shebang: **Bun must be installed**, otherwise `qbtools` fails with
`env: bun: No such file or directory`. Say this prominently in the README install section.

---

## 7. Fixing mistakes

- **Bad release:** you cannot overwrite a version. Publish a fixed patch version.
  `npm deprecate qbtools@0.3.0 "broken bundle, use 0.3.1"` warns users.
- **Unpublish** only within 72 hours and only if nothing depends on it:
  `npm unpublish qbtools@0.3.0`. Prefer deprecate.
- **Leaked token:** revoke it on npmjs.com → Access Tokens, create a new one, update the
  `NPM_TOKEN` secret.
- **Wrong dist-tag:** `npm dist-tag add qbtools@0.3.1 latest`.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `npm error code EPRIVATE` | `"private": true` in `apps/cli/package.json` | It was removed; make sure it stays out. The root package stays private |
| Tarball is ~44 MB / contains `dist/qbtools` | `files` contains `"dist"` | Use `dist/bin.js` + `dist/bin.js.map` |
| `403 You cannot publish over the previously published versions` | Version already on npm | Bump the version |
| `403 … requires two-factor authentication` | 2FA on account, no OTP/granular token | Use `--otp=<code>` locally; CI needs a granular token allowed to bypass 2FA |
| `E404 … is not in this registry` on publish of a scoped name | No access to the org/scope | Create the org or use an unscoped name |
| CI: "tag does not match version" | Tag ≠ `apps/cli/package.json` version | Delete the tag, fix the version, re-tag |
| `version.test.ts` fails | `CLI_VERSION` ≠ `package.json` version | Update `apps/cli/src/version.ts` |
| `Cannot find module "@jsquash/…"` after install | Engine imports a package missing from CLI `dependencies` | Add it to `apps/cli/package.json` |
| `bun install --frozen-lockfile` fails in CI | `bun.lock` stale after a version/name change | Run `bun install` locally and commit `bun.lock` |
| `env: bun: No such file or directory` | End user has no Bun | Install Bun; document it |
| Image tools: "needs the optional sharp package" | No prebuilt `sharp` binary (musl/alpine) | `npm i -g sharp`, or skip image tools |
| Graphics tools can't find fonts | `@fontsource/*` missing | They are real dependencies — reinstall |

---

## 9. Checklist

- [ ] `LICENSE` added and `license` set in `apps/cli/package.json`
- [ ] `npm view qbtools` still 404 (name free) or you own it
- [ ] `apps/cli/package.json` version == `CLI_VERSION` in `src/version.ts`
- [ ] `bun run typecheck` and tests green (media test failures resolved)
- [ ] `npm pack --dry-run` → 8 files, a few hundred kB, no `dist/qbtools`
- [ ] Clean-project install + `version` / `run` / `doctor` works
- [ ] `NPM_TOKEN` secret present and unexpired
- [ ] Tag `vX.Y.Z` matches the version, pushed → workflow green
- [ ] `npx qbtools@latest version` prints the new version
