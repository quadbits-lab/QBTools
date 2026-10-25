import { expect, test } from "@playwright/test";

/**
 * The worker is not registered on the dev server unless it is asked for, so
 * the tests opt in through the same flag the app reads.
 */
const OPT_IN = "qbtools.sw";

/**
 * Playwright can only fail the network requests a service worker makes in
 * Chromium; in Firefox and WebKit the worker still reaches the server, so the
 * offline behaviour cannot be simulated there.
 */
const OFFLINE_SIMULATION = "Only Chromium can fail the network requests of a service worker.";

test("serves a complete web app manifest", async ({ request }) => {
	const response = await request.get("/manifest.webmanifest");
	expect(response.ok()).toBe(true);
	const manifest = await response.json();
	expect(manifest.name).toContain("QBTools");
	expect(manifest.short_name).toBe("QBTools");
	expect(manifest.display).toBe("standalone");
	expect(manifest.start_url).toBe("/");
	expect(manifest.scope).toBe("/");
	expect(manifest.theme_color).toBe("#1f1f1f");
	expect(manifest.background_color).toBe("#111111");
	const icons = manifest.icons as { sizes: string; purpose: string }[];
	expect(icons.some((icon) => icon.sizes === "192x192" && icon.purpose.includes("any"))).toBe(true);
	expect(icons.some((icon) => icon.sizes === "512x512" && icon.purpose.includes("maskable"))).toBe(
		true,
	);
	expect(manifest.shortcuts.length).toBeGreaterThan(0);
});

test("serves the worker script and the offline page", async ({ request }) => {
	const worker = await request.get("/sw.js");
	expect(worker.ok()).toBe(true);
	expect(worker.headers()["content-type"]).toContain("javascript");
	const offline = await request.get("/offline.html");
	expect(offline.ok()).toBe(true);
	expect(await offline.text()).toContain("offline");
});

test("registers the service worker and serves the offline page when the network drops", async ({
	browser,
	browserName,
}) => {
	const context = await browser.newContext({ serviceWorkers: "allow" });
	await context.addInitScript((key) => {
		try {
			localStorage.setItem(key, "1");
		} catch {
			/* Storage blocked: the worker will not register. */
		}
	}, OPT_IN);
	const page = await context.newPage();

	await page.goto("/");
	await expect(page.getByRole("banner")).toBeVisible();

	await page.waitForFunction(async () => {
		const registration = await navigator.serviceWorker.getRegistration();
		return Boolean(registration);
	});
	// A reload puts the page under the worker's control.
	await page.reload();
	await expect
		.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
		.toBe(true);

	test.skip(browserName !== "chromium", OFFLINE_SIMULATION);
	await context.setOffline(true);
	await context.route("**/*", (route) => route.abort("internetdisconnected"));
	await page.goto("/tools/never-visited-offline");
	await expect(page.getByRole("heading", { name: /offline/i })).toBeVisible();
	await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
	await context.setOffline(false);

	await context.close();
});

test("offers an install button once the browser allows an install", async ({ page }) => {
	await page.goto("/");
	// Headless browsers never raise the real event, so stand in for it.
	await page.evaluate(() => {
		const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
			prompt: () => Promise<void>;
			userChoice: Promise<{ outcome: string }>;
		};
		event.prompt = () => Promise.resolve();
		event.userChoice = Promise.resolve({ outcome: "accepted" });
		window.dispatchEvent(event);
	});
	await expect(page.getByRole("button", { name: /install qbtools/i })).toBeVisible();
});

test("keeps a visited tool working offline", async ({ browser, browserName }) => {
	const context = await browser.newContext({ serviceWorkers: "allow" });
	const page = await context.newPage();
	await page.goto("/");

	// The worker only registers itself in a production build; the dev server
	// serves unbundled modules that the worker deliberately does not cache.
	const production = await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
		return Boolean(await navigator.serviceWorker.getRegistration());
	});
	test.skip(!production, "Needs a production build: the dev server is not cacheable.");
	test.skip(browserName !== "chromium", OFFLINE_SIMULATION);

	await page.goto("/tools/compress-image");
	await expect
		.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
		.toBe(true);
	// Reload so the visit is cached and the page is served by the worker.
	await page.reload();
	await expect(page.getByRole("heading", { name: /compress/i }).first()).toBeVisible();

	await context.setOffline(true);
	await context.route("**/*", (route) => route.abort("internetdisconnected"));
	await page.reload();
	await expect(page.getByRole("heading", { name: /compress/i }).first()).toBeVisible();
	await context.setOffline(false);

	await context.close();
});
