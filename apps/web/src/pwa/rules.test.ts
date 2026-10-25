import { describe, expect, test } from "bun:test";
import {
	BYPASS_PREFIXES,
	cacheNames,
	isBypassed,
	isCacheableResponse,
	isCacheableWasmResponse,
	isHashedAsset,
	isOwnedCacheName,
	isPrecachedPath,
	isWasmAsset,
	OFFLINE_FALLBACK_URL,
	PRECACHE_URLS,
	strategyFor,
	trimCache,
	WASM_MAX_ENTRY_BYTES,
} from "./rules";

describe("service worker cache policy", () => {
	test("bypasses every private or server-bound path", () => {
		for (const path of [
			"/api/auth/session",
			"/api/media/avatar.png",
			"/api/account/profile",
			"/_serverFn/sessionFn",
			"/dashboard",
			"/dashboard/favorites",
			"/login",
			"/admin",
		]) {
			expect(isBypassed(path)).toBe(true);
		}
	});

	test("bypass prefixes are matched exactly or as a path segment", () => {
		// A tool may legitimately be called "admin-tools" or "login-helper".
		expect(isBypassed("/administrator")).toBe(false);
		expect(isBypassed("/logins")).toBe(false);
		expect(isBypassed("/apiary")).toBe(false);
		expect(isBypassed("/dashboardish")).toBe(false);
	});

	test("public pages are not bypassed", () => {
		for (const path of ["/", "/tools", "/tools/compress-image", "/categories/image", "/about"]) {
			expect(isBypassed(path)).toBe(false);
		}
	});

	test("recognises hashed build output and wasm engines", () => {
		expect(isHashedAsset("/assets/index-BhK2x1.js")).toBe(true);
		expect(isHashedAsset("/assets/style.css")).toBe(true);
		expect(isHashedAsset("/tools")).toBe(false);
		expect(isWasmAsset("/wasm/resvg-2.6.2/resvg_bg.wasm")).toBe(true);
		expect(isWasmAsset("/wasm")).toBe(false);
	});

	test("navigations are network-first except on private paths", () => {
		expect(strategyFor("/tools/compress-image", "navigate")).toBe("navigate");
		expect(strategyFor("/dashboard", "navigate")).toBe("bypass");
		expect(strategyFor("/api/media", "navigate")).toBe("bypass");
	});

	test("sub-resources use the strategy that matches their path", () => {
		expect(strategyFor("/assets/index-BhK2x1.js", "no-cors")).toBe("asset");
		expect(strategyFor("/wasm/pdfjs-6.4.299/pdf.mjs", "no-cors")).toBe("wasm");
		expect(strategyFor("/manifest.webmanifest", "no-cors")).toBe("static");
		expect(strategyFor("/offline.html", "no-cors")).toBe("static");
	});

	test("unknown paths are passed through untouched", () => {
		expect(strategyFor("/src/main.tsx", "no-cors")).toBe("passthrough");
		expect(strategyFor("/@vite/client", "no-cors")).toBe("passthrough");
		expect(strategyFor("/node_modules/.vite/deps/react.js", "no-cors")).toBe("passthrough");
	});

	test("only successful same-origin responses are stored", () => {
		expect(isCacheableResponse({ status: 200, type: "basic" })).toBe(true);
		expect(isCacheableResponse({ status: 404, type: "basic" })).toBe(false);
		expect(isCacheableResponse({ status: 500, type: "basic" })).toBe(false);
		expect(isCacheableResponse({ status: 200, type: "opaque" })).toBe(false);
	});

	test("oversized wasm responses are skipped", () => {
		const small = { status: 200, type: "basic", contentLength: 1024 };
		const large = { status: 200, type: "basic", contentLength: WASM_MAX_ENTRY_BYTES + 1 };
		expect(isCacheableWasmResponse(small)).toBe(true);
		expect(isCacheableWasmResponse(large)).toBe(false);
		// Unknown length is kept: the browser applies its own quota.
		expect(isCacheableWasmResponse({ status: 200, type: "basic", contentLength: null })).toBe(true);
		expect(isCacheableWasmResponse({ status: 404, type: "basic", contentLength: 10 })).toBe(false);
	});

	test("cache names are scoped to one build generation", () => {
		const names = cacheNames("abc123");
		expect(names.precache).toBe("qbtools-precache-abc123");
		expect(names.assets).toBe("qbtools-assets-abc123");
		expect(names.pages).toBe("qbtools-pages-abc123");
		expect(names.wasm).toBe("qbtools-wasm-abc123");
		expect(cacheNames("abc123")).not.toEqual(cacheNames("def456"));
	});

	test("only worker-owned caches are purged on activate", () => {
		expect(isOwnedCacheName("qbtools-assets-abc123")).toBe(true);
		expect(isOwnedCacheName("workbox-precache")).toBe(false);
		expect(isOwnedCacheName("qbtools-other-app")).toBe(true);
	});

	test("precache list covers the installable shell", () => {
		expect(PRECACHE_URLS).toContain(OFFLINE_FALLBACK_URL);
		expect(PRECACHE_URLS).toContain("/manifest.webmanifest");
		for (const url of PRECACHE_URLS) {
			expect(isPrecachedPath(url)).toBe(true);
			expect(isBypassed(url)).toBe(false);
		}
	});

	test("bypass prefixes stay in sync with the documented list", () => {
		expect(BYPASS_PREFIXES).toContain("/api/");
		expect(BYPASS_PREFIXES).toContain("/_serverFn/");
		expect(BYPASS_PREFIXES).toContain("/dashboard");
		expect(BYPASS_PREFIXES).toContain("/login");
	});

	test("trimCache removes the oldest entries beyond the limit", async () => {
		const store = new Map<string, string>();
		const cache = {
			keys: async () => [...store.keys()].map((url) => ({ url }) as Request),
			delete: async (request: Request) => {
				store.delete(request.url);
				return true;
			},
		} as unknown as Cache;
		for (const name of ["a", "b", "c"]) store.set(name, name);

		const removed = await trimCache(cache, 2);
		expect(removed).toBe(1);
		expect([...store.keys()]).toEqual(["b", "c"]);

		expect(await trimCache(cache, 5)).toBe(0);
		expect(store.size).toBe(2);
	});
});
