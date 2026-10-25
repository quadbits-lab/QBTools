/**
 * Cache policy for the QBTools service worker.
 *
 * Every rule here is pure so it can be unit tested without a browser. The worker
 * (service-worker.ts) and the client (lib/pwa.ts) both read from this module so
 * the two can never drift apart.
 */

/** Path prefixes that must never be cached: sessions, media and account data. */
export const BYPASS_PREFIXES = [
	"/api/",
	"/_serverFn/",
	"/dashboard",
	"/login",
	"/admin",
	"/_server",
] as const;

/** Content-hashed build output — immutable, safe to cache forever. */
export const HASHED_ASSET_PREFIX = "/assets/";

/** Build-time WASM engines (PDF.js, FFmpeg, Tesseract, resvg). Large but lazy. */
export const WASM_PREFIX = "/wasm/";

/** Standalone page served when a navigation fails and nothing is cached. */
export const OFFLINE_FALLBACK_URL = "/offline.html";

/** Small, stable files installed with the worker so the shell survives offline. */
export const PRECACHE_URLS = [
	OFFLINE_FALLBACK_URL,
	"/manifest.webmanifest",
	"/favicon.svg",
	"/favicon-96x96.png",
	"/apple-touch-icon.png",
	"/web-app-manifest-192x192.png",
	"/icons/maskable-192.png",
	"/icons/maskable-512.png",
] as const;

/** Largest single WASM response worth keeping (bytes). */
export const WASM_MAX_ENTRY_BYTES = 4 * 1024 * 1024;

/** Maximum number of WASM responses kept per cache generation. */
export const WASM_MAX_ENTRIES = 24;

/** Maximum number of cached HTML pages kept per cache generation. */
export const PAGE_MAX_ENTRIES = 60;

export type CacheStrategy = "bypass" | "navigate" | "asset" | "wasm" | "static" | "passthrough";

/** True for paths that carry private or server-bound data. */
export function isBypassed(pathname: string): boolean {
	return BYPASS_PREFIXES.some((prefix) =>
		prefix.endsWith("/")
			? pathname.startsWith(prefix)
			: pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

/**
 * True when a request URL belongs to the site's own origin.
 *
 * Another origin is never ours to cache, not even a top-level navigation to a
 * site that links here.
 */
export function isOwnOrigin(url: string, origin: string): boolean {
	try {
		return new URL(url).origin === origin;
	} catch {
		return false;
	}
}

/** True for Vite's content-hashed build output. */
export function isHashedAsset(pathname: string): boolean {
	return pathname.startsWith(HASHED_ASSET_PREFIX);
}

/** True for the lazily loaded WASM engines. */
export function isWasmAsset(pathname: string): boolean {
	return pathname.startsWith(WASM_PREFIX);
}

/**
 * Pick the caching strategy for a same-origin GET request.
 *
 * `mode` is the request mode: navigations are HTML page loads, everything else
 * is a sub-resource. Unknown paths are passed through untouched so the worker
 * never intercepts something it does not understand (Vite dev modules, for one).
 */
export function strategyFor(pathname: string, mode: string): CacheStrategy {
	if (isBypassed(pathname)) return "bypass";
	if (mode === "navigate") return "navigate";
	if (isHashedAsset(pathname)) return "asset";
	if (isWasmAsset(pathname)) return "wasm";
	if (isPrecachedPath(pathname)) return "static";
	return "passthrough";
}

/** True for the small static files that make up the installable shell. */
export function isPrecachedPath(pathname: string): boolean {
	return PRECACHE_URLS.some((url) => url === pathname);
}

/** True when a response is safe to store: same-origin, successful, not opaque. */
export function isCacheableResponse(response: { status: number; type: string }): boolean {
	return response.status === 200 && response.type !== "opaque";
}

/** True when a WASM response is small enough to be worth keeping. */
export function isCacheableWasmResponse(
	response: { status: number; type: string; contentLength: number | null },
	maxBytes: number = WASM_MAX_ENTRY_BYTES,
): boolean {
	if (!isCacheableResponse(response)) return false;
	if (response.contentLength === null) return true;
	return response.contentLength <= maxBytes;
}

/** Cache names for one worker generation. The build id changes on every deploy. */
export function cacheNames(buildId: string): {
	precache: string;
	assets: string;
	pages: string;
	wasm: string;
} {
	return {
		precache: `qbtools-precache-${buildId}`,
		assets: `qbtools-assets-${buildId}`,
		pages: `qbtools-pages-${buildId}`,
		wasm: `qbtools-wasm-${buildId}`,
	};
}

/** Every cache name the worker owns, for cleanup of stale generations. */
export function ownedCacheNames(buildId: string): string[] {
	return Object.values(cacheNames(buildId));
}

/** True when a cache name belongs to the worker (and may be deleted on activate). */
export function isOwnedCacheName(name: string): boolean {
	return name.startsWith("qbtools-");
}

/**
 * Drop the oldest entries of a cache until it holds at most `max` entries.
 *
 * Caches are insertion ordered, so the first keys are the least recently
 * written. Returns the number of entries removed.
 */
export async function trimCache(cache: Cache, max: number): Promise<number> {
	const keys = await cache.keys();
	if (keys.length <= max) return 0;
	const excess = keys.length - max;
	for (const key of keys.slice(0, excess)) {
		await cache.delete(key);
	}
	return excess;
}
