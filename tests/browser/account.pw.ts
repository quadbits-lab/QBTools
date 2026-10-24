import { readFileSync } from "node:fs";
import { type BrowserContext, expect, test } from "@playwright/test";

const filename = process.env.QBTOOLS_AUTH_FIXTURE;
const fixture = filename
	? (JSON.parse(readFileSync(filename, "utf8")) as {
			baseURL: string;
			alice: { cookie: string; id: string };
			bob: { cookie: string; id: string };
		})
	: null;
test.skip(!fixture, "Run against disposable RustFS and signed account fixtures.");
async function signIn(context: BrowserContext, who: "alice" | "bob" = "alice") {
	if (!fixture) throw new Error("No fixture");
	await context.addCookies([
		{
			name: "better-auth.session_token",
			value: fixture[who].cookie,
			url: fixture.baseURL,
			httpOnly: true,
			sameSite: "Lax",
		},
	]);
}
test("anonymous dashboard redirects and suggestion form is gone", async ({ page }) => {
	await page.goto("/dashboard/media");
	await expect(page).toHaveURL(/\/login/);
	await expect(
		page.getByRole("button", { name: "Sign in with GitHub", exact: true }),
	).toBeVisible();
	await page.goto("/contact?tab=suggest");
	await expect(page.getByRole("heading", { name: "Contact us", exact: true })).toBeVisible();
	await expect(page.getByText(/suggest a tool/i)).toHaveCount(0);
});
test("dashboard, favorites and history persist across navigation", async ({ page, context }) => {
	await signIn(context);
	await page.goto("/dashboard");
	await expect(page.getByRole("heading", { name: "Welcome back, Alice Test." })).toBeVisible();
	await context.request.post("/api/account/favorites", {
		headers: { Origin: fixture?.baseURL ?? "" },
		data: { slug: "word-counter", saved: false },
	});
	await page.goto("/tools/word-counter");
	await page.getByRole("button", { name: "Save tool", exact: true }).click();
	await page.goto("/dashboard/favorites");
	await expect(page.getByText("Word Counter", { exact: true }).first()).toBeVisible();
	await page.goto("/dashboard");
	await expect(page.getByRole("heading", { name: "Recently used" })).toBeVisible();
	await page.goto("/dashboard/settings");
	await expect(page.getByRole("heading", { name: "Active sessions" })).toBeVisible();
});
test("upload, rename, byte ranges, cross-user isolation and delete", async ({
	page,
	context,
	browser,
}) => {
	await signIn(context);
	await page.goto("/dashboard/media");
	const name = `browser-${test.info().project.name}-${Date.now()}.txt`;
	await expect(page.getByLabel("Upload files", { exact: true })).toBeEnabled();
	await page
		.getByLabel("Upload files", { exact: true })
		.setInputFiles({ name, mimeType: "text/plain", buffer: Buffer.from("hello browser") });
	const card = page.locator("article").filter({ hasText: name });
	await expect(card).toBeVisible();
	const link = card.getByRole("link", { name: "Download", exact: true });
	const href = await link.getAttribute("href");
	if (!href) throw new Error("No download");
	const content = await context.request.get(href, { headers: { Range: "bytes=6-12" } });
	expect(content.status()).toBe(206);
	expect(await content.text()).toBe("browser");
	expect(content.headers()["cache-control"]).toContain("no-store");
	const other = await browser.newContext();
	await signIn(other, "bob");
	expect((await other.request.get(new URL(href, fixture?.baseURL).href)).status()).toBe(404);
	await other.close();
	page.once("dialog", (d) => d.accept(`renamed-${name}`));
	await card.getByRole("button", { name: "Rename", exact: true }).click();
	const renamed = page.locator("article").filter({ hasText: `renamed-${name}` });
	await expect(renamed).toBeVisible();
	page.once("dialog", (d) => d.accept());
	await renamed.getByRole("button", { name: `Delete renamed-${name}`, exact: true }).click();
	await expect(renamed).toHaveCount(0);
});
test("generated QR can save to media and return as a tool input", async ({ page, context }) => {
	await signIn(context);
	await page.goto("/tools/qr-code-generator");
	await page.getByRole("button", { name: "Save to Media", exact: true }).first().click();
	await expect(page.getByText("Saved to Media", { exact: true }).first()).toBeVisible();
	await page.goto("/tools/resize-image");
	await page.getByRole("button", { name: "Choose from Media", exact: true }).click();
	const card = page
		.getByRole("dialog")
		.locator("article")
		.filter({ hasText: "qr-code.png" })
		.first();
	await expect(card).toBeVisible();
	await card.getByRole("button", { name: "Use this file" }).click();
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(page.getByText("1024×1024px", { exact: true })).toBeVisible();
});
test("custom file inputs also offer stored media", async ({ page, context }) => {
	await signIn(context);
	await page.goto("/tools/thumbnail-maker");
	await expect(page.getByRole("button", { name: "Choose from Media", exact: true })).toHaveCount(2);
	await page.goto("/tools/invoice-generator");
	await expect(page.getByRole("button", { name: "Choose from Media", exact: true })).toBeVisible();
});
test("switching accounts does not leak favorites", async ({ page, context }) => {
	const origin = { Origin: fixture?.baseURL ?? "" };
	await signIn(context, "bob");
	await context.request.post("/api/account/favorites", {
		headers: origin,
		data: { slug: "word-counter", saved: false },
	});
	await context.clearCookies();
	await signIn(context);
	await context.request.post("/api/account/favorites", {
		headers: origin,
		data: { slug: "word-counter", saved: true },
	});
	await page.goto("/dashboard/favorites");
	await expect(page.getByText("Word Counter", { exact: true }).first()).toBeVisible();
	await context.clearCookies();
	await signIn(context, "bob");
	await page.goto("/dashboard/favorites");
	await expect(page.getByText("Word Counter", { exact: true })).toHaveCount(0);
});
test("API rejects anonymous writes, foreign origins, oversize and unsafe names", async ({
	context,
}) => {
	const origin = fixture?.baseURL ?? "";
	expect(
		(
			await context.request.post("/api/media/uploads", { headers: { Origin: origin }, data: {} })
		).status(),
	).toBe(401);
	await signIn(context);
	expect(
		(
			await context.request.post("/api/media/uploads", {
				headers: { Origin: "https://evil.test" },
				data: {},
			})
		).status(),
	).toBe(403);
	for (const [name, bytes] of [
		["file.txt", 100000001],
		["../file.txt", 4],
	] as const) {
		const result = await context.request.post("/api/media/uploads", {
			headers: { Origin: origin },
			data: { requestKey: crypto.randomUUID(), name, mime: "text/plain", bytes },
		});
		expect(result.ok()).toBe(false);
	}
});
test("mobile dashboard and reduced-motion navigation remain usable", async ({ page, context }) => {
	await signIn(context);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/dashboard/media");
	await expect(page.getByRole("heading", { name: "Your workspace" })).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
		true,
	);
	await page.getByRole("link", { name: "Favorites", exact: true }).click();
	await expect(page.getByRole("heading", { name: "Favorite tools" })).toBeVisible();
});
