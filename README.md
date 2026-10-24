# QBTools — Free tools that just work

A fast, no-signup website of everyday tools for students, parents, freelancers and everyone else: 24 tools across image, PDF, text, calculators, generators and media. Files are processed **in the browser**, so they are never uploaded or stored.

**Stack:** Bun 1.4 · TanStack Start (React 19, SSR, server functions) · Vite 8 · Tailwind CSS 4 · SQLite (`bun:sqlite` + Drizzle) · Turborepo · Biome · Docker / Compose.

## Monorepo layout

```
apps/web/              @qbtools/web — TanStack Start app + Bun production server (server.ts)
  src/routes/          pages, server routes (sitemap.xml, robots.txt, ads.txt, /api/health)
  src/components/      layout, search, tool page template, ads, consent, widget kit
  src/tools/<slug>/    one lazily-loaded widget per tool (heavy libs load only there)
  src/server/          server functions: forms, AI, admin, env, rate limiting
packages/registry/     tool + category metadata, SEO copy, FAQs, presets, search ranker
packages/engines/      framework-free processing logic (calc, text, generators, image, pdf, media)
packages/ui/           design tokens (theme.css) + accessible primitives
packages/content/      guides
packages/db/           SQLite schema, embedded migrations, backup script
docker/Dockerfile      multi-stage build → small Alpine runtime with a self-contained bundle
compose.yml            production stack (app port only — bring your own proxy/tunnel)
```

**Adding a tool:**
1. Add a `ToolDef` in `packages/registry/src/tools/<category>.ts`. Write its copy, FAQs and any presets there.
2. Put pure logic in `packages/engines` and add tests.
3. Create `apps/web/src/tools/<slug>/index.tsx`.
4. Register it in `apps/web/src/tools/widgets.ts`.

`bun test` fails if the registry and the widgets get out of sync. The sitemap, search, category pages and footer pick the new tool up automatically.

## Develop

```bash
bun install
cp .env.example apps/web/.env        # optional: ADMIN_TOKEN, AI_API_KEY…
bun run dev                          # http://localhost:8310
```

| Command                           | What it does                                                                |
| --------------------------------- | --------------------------------------------------------------------------- |
| `bun run dev`                     | Dev server with HMR (runs Vite under the Bun runtime so `bun:sqlite` works) |
| `bun test`                        | Unit tests (engines, registry/search, db, rate limiter, widget parity)      |
| `bun run typecheck`               | TypeScript across all workspaces                                            |
| `bun run lint` / `bun run format` | Biome                                                                       |
| `bun run build && bun run start`  | Production build + Bun server on :8310                                      |
| `bun run db:backup`               | Online SQLite backup (`VACUUM INTO`)                                        |

## Deploy with Docker

```bash
cp .env.example .env          # set SITE_URL, VITE_SITE_URL, ADMIN_TOKEN, …
docker compose up -d --build
docker compose ps             # wait for "healthy"
```

- **Image.** The runtime image is `oven/bun:1.4.3-alpine` with just `dist/` and `server.ts`. The server bundle has no `node_modules`. It runs as the non-root `bun` user with a read-only root filesystem, all capabilities dropped and `no-new-privileges`.
- **Data.** Data lives in the `qbtools-data` volume (`/data/qbtools.db`, WAL mode). Migrations run automatically at startup.
- **Backups.** Run `docker compose exec web bun scripts/backup.ts /data/backups`, then copy the backup out with `docker compose cp web:/data/backups ./backups`.
- **Proxy.** Compose only publishes the app port. Put Nginx, Caddy, Traefik or a Cloudflare Tunnel in front for TLS, then set `TRUST_PROXY=true` and `HSTS=true`.
- **Build-time values.** `VITE_*` values are baked into the browser bundle when the image builds. Rebuild (`docker compose up -d --build`) after changing them.

## Configuration

Every option is documented in [.env.example](.env.example). The important ones:

| Variable                     | Purpose                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `SITE_URL` / `VITE_SITE_URL` | Canonical origin for SEO tags, sitemap and robots                             |
| `ADMIN_TOKEN`                | Enables `/admin` (messages, tool ideas + votes, leads, waitlist, CSV export)  |
| `AI_API_KEY`, `AI_MODEL`     | Grammar and paraphrase helpers (Anthropic). Leave empty to show "unavailable" |
| `VITE_ADSENSE_*`, `ADS_TXT`  | Ads (top + bottom slot per tool page) and `/ads.txt`                          |
| `VITE_ANALYTICS_*`           | Optional cookieless Plausible or Umami                                        |

## Privacy and security

- **Browser-only processing.** Image, PDF, media, calculator and generator tools run entirely in the browser. Each tool page shows a "0 bytes uploaded" badge.
- **AI text helpers.** These are the only tools that send content to a server, and both the page and the Privacy Policy say so. Input is capped (5,000 characters by default) and rate-limited per IP.
- **Forms.** Every form is validated with zod on the client and again on the server, and has a honeypot field and per-IP rate limits.
- **Admin.** The admin cookie is an HMAC of the token (HttpOnly, SameSite=Strict). Every admin server function checks it.
- **Response headers.** `nosniff`, `Referrer-Policy`, `X-Frame-Options`, a `Permissions-Policy`, and a CSP (`frame-ancestors`/`base-uri`/`object-src`/`form-action`) that stays compatible with ads.

## Before applying for AdSense

1. Deploy on your own domain with HTTPS and set `SITE_URL`.
2. Submit `https://your-domain/sitemap.xml` in Google Search Console.
3. Review the legal pages (`/privacy`, `/terms`, `/disclaimer`, `/cookies`) and adapt them to your business and country. They are templates, not legal advice.
4. Add a few more original guides. Reviewers look for useful content, not just tools.
5. Once approved:
   - set `VITE_ADSENSE_CLIENT` plus the two slot IDs and `ADS_TXT`, then rebuild;
   - for visitors in the EEA, UK or Switzerland, enable Google's certified CMP (_Privacy & messaging_) in AdSense. The built-in banner gates ad loading but is not a certified CMP.

## Third-party models and licences

- **Background remover.** Uses [ormbg](https://huggingface.co/onnx-community/ormbg-ONNX) (Apache-2.0) through transformers.js on WASM. The ~44MB model downloads once from Hugging Face, then the browser caches it.
- **Passphrases.** Use the EFF Short Wordlist (CC BY 3.0 US).
- **Fonts.** Plus Jakarta Sans, Anton, Bebas Neue, Dancing Script, Great Vibes, Sacramento and Caveat (all OFL) are self-hosted via Fontsource.
