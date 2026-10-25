## PWA implementation for QBTools

### Where things stand today

The app already links `/manifest.webmanifest` and emits a `theme-color` meta, but the manifest is **light-themed** (`#ffffff`) while the app is **dark-first** (`#111111` background), its two icons claim `purpose: "maskable"` even though the artwork bleeds to the canvas edge (Android would clip the "QB" monogram), and there is **no service worker anywhere** in the repo. `apps/web/public/site.webmanifest` is a byte-identical stray copy of the manifest (a leftover from the favicon-generator tool's own output) and nothing links to it.

### Architecture

A hand-written TypeScript service worker, bundled to `/sw.js` at build time with `Bun.build` — no new npm dependency, no lockfile or Docker changes, and full control over which SSR/auth requests must never be cached. The cache policy lives in a pure, unit-tested module shared by the worker and the client.

```
apps/web/src/pwa/rules.ts          pure cache policy (bypass lists, strategy choice, cache names, trimming)
apps/web/src/pwa/service-worker.ts worker entry: install / activate / fetch
scripts/build-sw.ts                 bundles the worker -> apps/web/public/sw.js (gitignored)
```

`scripts/build-sw.ts` hashes the worker sources and injects the hash as a build id, so every deploy that changes the worker creates a new cache version and the old caches are purged on activate. The output format is `iife` so it runs as a classic worker (no `type: "module"` requirement).

### Caching policy

| Request                                                           | Behaviour                                                                                                                                            |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/*`, `/_serverFn/*`, `/dashboard*`, `/login*`, `/admin*` | **Bypass** — network only, never read or written to cache (these carry sessions, media and account data)                                             |
| Non-`GET`, cross-origin                                           | Passthrough untouched                                                                                                                                |
| Navigations (`request.mode === "navigate"`)                       | **Network-first**; successful HTML is cached so a visited tool still opens offline; on failure fall back to the cached page, then to `/offline.html` |
| `/assets/*` (content-hashed)                                      | **Cache-first** — immutable by construction                                                                                                          |
| `/wasm/*` (PDF.js, FFmpeg, Tesseract, resvg)                      | **Cache-first**, lazy, per-entry size cap and entry-count cap so the multi-MB engine tree cannot blow the origin quota                               |
| Other same-origin static (icons, manifest, `offline.html`)        | **Stale-while-revalidate**                                                                                                                           |
| Everything else (Vite dev module paths, etc.)                     | Passthrough — the worker never calls `respondWith` for paths it does not own                                                                         |

### File-by-file changes

**New**
- `apps/web/src/pwa/rules.ts` — the policy above as pure functions: `isBypassed(path)`, `strategyFor(path, mode)`, `cacheNames(buildId)`, `shouldCacheResponse(...)`, trim helpers.
- `apps/web/src/pwa/rules.test.ts` — `bun:test` coverage for every path class (api/serverFn/dashboard bypass, hashed assets, wasm, static, dev passthrough).
- `apps/web/src/pwa/service-worker.ts` — the worker. Uses locally-declared minimal worker types so the DOM and WebWorker lib sets never conflict inside the app's tsconfig.
- `apps/web/src/pwa/manifest.test.ts` — asserts `public/manifest.webmanifest` matches `lib/site.ts` (name, `theme_color`, `background_color`), has `id`/`scope`/`start_url`, and declares a 192 `any` icon plus a 512 `maskable` icon. This is the drift guard.
- `apps/web/src/lib/pwa.ts` — client helpers: registration (production, or opt-in via `localStorage["qbtools.sw"] === "1"` so tests can enable it on the dev server), `isStandalone()`, iOS-Safari detection, and a small external store for the deferred install prompt.
- `apps/web/src/components/pwa-manager.tsx` — mounts in `__root.tsx`: registers the worker, shows a "New version available → Reload" toast when a new worker is waiting, tracks `beforeinstallprompt` / `appinstalled`, and keeps `meta[name="theme-color"]` in sync with the light/dark theme.
- `apps/web/src/components/pwa-install-button.tsx` — the header install button (Chromium: triggers the native prompt; iOS Safari: shows the "Share → Add to Home Screen" steps; hidden once installed).
- `apps/web/public/offline.html` — self-contained offline page, inline CSS, `prefers-color-scheme` aware, retry button and link home. No external assets, so it renders with zero dependencies.
- `apps/web/public/icons/{icon-192,icon-512,maskable-192,maskable-512}.png` — generated icon set. `maskable-*` is the existing monogram scaled to ~70% and centred on an opaque background so Android's circular mask cannot clip it.
- `apps/web/scripts/generate-pwa-icons.ts` — one-off generator that renders the maskable variants through the repo's own resvg engine (`@qbtools/engines`, already a dependency of `apps/web`); output is committed.
- `scripts/build-sw.ts` — the worker bundler, sitting alongside the existing `scripts/prepare-wasm.ts` / `prepare-server.ts`.
- `tests/browser/pwa.pw.ts` — Playwright coverage.

**Modified**
- `apps/web/public/manifest.webmanifest` — rewritten: `id`, `scope`, dark `theme_color`/`background_color`, `lang`/`dir`, `display_override`, `categories`, `purpose: "any"` **and** `purpose: "maskable"` icons, and `shortcuts` for compress-image / merge-pdf / qr-code-generator / all tools.
- `apps/web/src/routes/__root.tsx` — add `mobile-web-app-capable`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`; mount `<PwaManager />`; make the root loader tolerant of a failed session call (`sessionFn().catch(() => null)`) so a cached page can boot while offline instead of hitting the error boundary.
- `apps/web/src/components/site-header.tsx` — add the install button next to the theme toggle.
- `apps/web/server.ts` — serve `/sw.js` and `/manifest.webmanifest` with `Cache-Control: no-cache` so worker updates propagate (currently they inherit `max-age=3600`); add `worker-src 'self' blob:` to the CSP to document that the worker and the existing blob workers are allowed.
- `apps/web/package.json` — run `build-sw` in both `dev` and `build`; add an `icons` script.
- `.gitignore` — ignore the generated `apps/web/public/sw.js`.

**Deleted**
- `apps/web/public/site.webmanifest` — stray byte-identical duplicate; nothing in the app links to it (only the favicon-generator tool writes that name, and only into a user's own generated site).

### Testing

- `bun test` — new unit tests for the cache policy and the manifest drift guard, alongside the existing suite.
- `tests/browser/pwa.pw.ts` — in a fresh context with `serviceWorkers: "allow"` and the opt-in flag set: the worker registers and takes control, the manifest is served and parses with the expected fields, and going offline on a never-visited path serves `offline.html`. The cached-app-shell path (visited tool renders offline) is exercised manually against a production build, because Vite's dev server serves unbundled modules that the worker deliberately does not cache.
- `bun run typecheck`, `bun run lint`, `bun run build` — all must pass; the Docker build runs `bun test && bun run build`, so the generated worker must build cleanly in that pipeline too.

### Notes and limits

- The worker never caches `/api/*`, `/_serverFn/*`, `/dashboard`, `/login` or `/admin`, so no account or media data is ever written to disk by the browser.
- `/wasm/` is cached lazily and capped; a full offline prefetch of every engine would mean tens of megabytes at install time and is deliberately out of scope.
- Server-bound features (the AI text tools) still require a connection; they are disclosed as server-bound on their pages.
- If the maskable icon generator cannot resolve the resvg WASM in this environment, the fallback is to ship the manifest with `purpose: "any"` icons only, which still satisfies Chrome's install criteria — the plan does not depend on the generated assets to be installable.
