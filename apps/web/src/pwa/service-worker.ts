/**
 * QBTools service worker.
 *
 * Built to `apps/web/public/sw.js` by `scripts/build-sw.ts` and served from the
 * origin root, so it controls the whole site. The cache policy lives in
 * `rules.ts` and is unit tested there.
 *
 * The worker never caches `/api/*`, `/_serverFn/*`, `/dashboard`, `/login` or
 * `/admin` — those carry sessions, media and account data.
 */

import {
	cacheNames,
	isCacheableResponse,
	isCacheableWasmResponse,
	isOwnedCacheName,
	OFFLINE_FALLBACK_URL,
	PAGE_MAX_ENTRIES,
	PRECACHE_URLS,
	strategyFor,
	trimCache,
	WASM_MAX_ENTRIES,
} from "./rules";

/** Injected by the build script: a hash of the worker sources. */
declare const __SW_BUILD_ID__: string;

const BUILD_ID = typeof __SW_BUILD_ID__ === "string" ? __SW_BUILD_ID__ : "dev";
const CACHES = cacheNames(BUILD_ID);

/** Minimal worker types — the app's tsconfig only ships the DOM lib. */
interface ExtendableEventLike extends Event {
	waitUntil(promise: Promise<unknown>): void;
}

interface FetchEventLike extends ExtendableEventLike {
	request: Request;
	respondWith(response: Response | Promise<Response>): void;
}

interface MessageEventLike extends ExtendableEventLike {
	data?: unknown;
}

interface ServiceWorkerGlobalScopeLike {
	addEventListener(
		type: "install" | "activate",
		listener: (event: ExtendableEventLike) => void,
	): void;
	addEventListener(type: "fetch", listener: (event: FetchEventLike) => void): void;
	addEventListener(type: "message", listener: (event: MessageEventLike) => void): void;
	skipWaiting(): Promise<void>;
	clients: { claim(): Promise<void> };
}

const scope = globalThis as unknown as ServiceWorkerGlobalScopeLike;

scope.addEventListener("install", (event) => {
	event.waitUntil(install());
});

scope.addEventListener("activate", (event) => {
	event.waitUntil(activate());
});

scope.addEventListener("fetch", (event) => {
	const strategy = strategyFor(pathnameOf(event.request), event.request.mode);
	if (strategy === "bypass" || strategy === "passthrough") return;
	event.respondWith(handle(event, strategy));
});

scope.addEventListener("message", (event) => {
	if ((event.data as { type?: string } | undefined)?.type === "SKIP_WAITING") {
		void scope.skipWaiting();
	}
});

function pathnameOf(request: Request): string {
	return new URL(request.url).pathname;
}

async function install(): Promise<void> {
	const cache = await caches.open(CACHES.precache);
	await Promise.all(
		PRECACHE_URLS.map(async (url) => {
			try {
				const response = await fetch(url, { cache: "reload" });
				if (isCacheableResponse(response)) await cache.put(url, response);
			} catch {
				// A missing shell file must not block the install.
			}
		}),
	);
}

async function activate(): Promise<void> {
	const names = await caches.keys();
	const current = new Set(Object.values(CACHES));
	await Promise.all(
		names
			.filter((name) => isOwnedCacheName(name) && !current.has(name))
			.map((name) => caches.delete(name)),
	);
	await scope.clients.claim();
}

async function handle(event: FetchEventLike, strategy: string): Promise<Response> {
	switch (strategy) {
		case "navigate":
			return handleNavigation(event.request);
		case "asset":
			return cacheFirst(event.request, CACHES.assets);
		case "wasm":
			return cacheFirst(event.request, CACHES.wasm, true);
		case "static":
			return staleWhileRevalidate(event.request, CACHES.precache);
		default:
			return fetch(event.request);
	}
}

/** Network-first so a page is always fresh when online, cached when it is not. */
async function handleNavigation(request: Request): Promise<Response> {
	const cache = await caches.open(CACHES.pages);
	try {
		const response = await fetch(request);
		if (isCacheableResponse(response)) {
			await cache.put(request, response.clone());
			await trimCache(cache, PAGE_MAX_ENTRIES);
		}
		return response;
	} catch {
		const cached = await cache.match(request);
		if (cached) return cached;
		const fallback = await caches.match(OFFLINE_FALLBACK_URL, { cacheName: CACHES.precache });
		if (fallback) return fallback;
		return new Response("You are offline.", {
			status: 503,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}
}

/** Cache-first for immutable build output and for the lazily loaded engines. */
async function cacheFirst(request: Request, cacheName: string, isWasm = false): Promise<Response> {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (!response.ok) return response;
	if (isWasm) {
		const header = response.headers.get("content-length");
		const length = header === null ? null : Number(header);
		const size = length === null || Number.isNaN(length) ? null : length;
		if (
			!isCacheableWasmResponse({
				status: response.status,
				type: response.type,
				contentLength: size,
			})
		) {
			return response;
		}
	} else if (!isCacheableResponse(response)) {
		return response;
	}
	await cache.put(request, response.clone());
	if (isWasm) await trimCache(cache, WASM_MAX_ENTRIES);
	return response;
}

/** Serve the cached copy immediately, refresh it in the background. */
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	const network = fetch(request)
		.then(async (response) => {
			if (isCacheableResponse(response)) await cache.put(request, response.clone());
			return response;
		})
		.catch(() => undefined);
	if (cached) return cached;
	const response = await network;
	if (response) return response;
	return new Response("", { status: 504, statusText: "Gateway Timeout" });
}
