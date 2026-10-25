# syntax=docker/dockerfile:1.7
# QBTools — multi-stage build. Build context: repository root.
#   docker build -f docker/Dockerfile -t qbtools .
#
# The runtime image is `oven/bun:latest` (also used for the build stages, so the
# Bun that installs/builds is the Bun that serves). Pin the whole build for a
# reproducible release with:
#   docker build --build-arg BUN_IMAGE=oven/bun:1.4.4 -f docker/Dockerfile -t qbtools .

ARG BUN_IMAGE=oven/bun:latest

# ---------- deps: install every workspace dependency (cached on manifests only) ----------
FROM ${BUN_IMAGE} AS deps
WORKDIR /repo
COPY package.json bun.lock bunfig.toml ./
# Copy every workspace manifest (and nothing else) so `bun install` is cached
# until a dependency changes. `COPY --parents` needs a newer Dockerfile frontend
# than the 1.7 pinned above, so the list is explicit: keep it in sync with the
# `workspaces` field in package.json (apps/* + packages/*).
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/registry/package.json packages/registry/
COPY packages/engines/package.json packages/engines/
COPY packages/content/package.json packages/content/
COPY packages/db/package.json packages/db/
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

# ---------- build: bundle the app (server bundle is fully self-contained) ----------
FROM deps AS build
# Public, build-time values (inlined into the browser bundle).
ARG VITE_SITE_URL=http://localhost:8310
ARG VITE_CONTACT_EMAIL=
ARG VITE_ADSENSE_CLIENT=
ARG VITE_ADSENSE_SLOT_TOP=
ARG VITE_ADSENSE_SLOT_BOTTOM=
ARG VITE_ANALYTICS_SRC=
ARG VITE_ANALYTICS_DOMAIN=
ARG VITE_ANALYTICS_WEBSITE_ID=
ENV VITE_SITE_URL=$VITE_SITE_URL \
    VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL \
    VITE_ADSENSE_CLIENT=$VITE_ADSENSE_CLIENT \
    VITE_ADSENSE_SLOT_TOP=$VITE_ADSENSE_SLOT_TOP \
    VITE_ADSENSE_SLOT_BOTTOM=$VITE_ADSENSE_SLOT_BOTTOM \
    VITE_ANALYTICS_SRC=$VITE_ANALYTICS_SRC \
    VITE_ANALYTICS_DOMAIN=$VITE_ANALYTICS_DOMAIN \
    VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID \
    TURBO_TELEMETRY_DISABLED=1
COPY . .
# `prepare-wasm` resolves the runtime packages from node_modules (resvg, ffmpeg,
# tesseract, …) and copies them into public/wasm, so this step proves the
# external libraries installed in the deps stage are present.
RUN bun test && bun run build

# ---------- runtime: just Bun + the built app ----------
FROM ${BUN_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8310 \
    DATABASE_PATH=/data/qbtools.db \
    BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
RUN mkdir -p /data && chown bun:bun /data
COPY --from=build --chown=bun:bun /repo/apps/web/dist ./dist
COPY --from=build --chown=bun:bun /repo/apps/web/server.ts ./server.ts
COPY --from=build --chown=bun:bun /repo/packages/db/src/backup.ts ./scripts/backup.ts
USER bun
VOLUME ["/data"]
EXPOSE 8310
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["bun", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 8310) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["bun", "server.ts"]
