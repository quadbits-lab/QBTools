import { expect, test } from "@playwright/test";

const HERO_TITLE = /Free tools that just work/;

test("hero content stays usable above the decorative WebGL layer", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));

	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(HERO_TITLE);
	await expect(page.locator("[data-hologram-root]")).toHaveAttribute("aria-hidden", "true");

	const input = page.locator('input[type="search"]').first();
	await expect(input).toBeVisible();
	const box = await input.boundingBox();
	if (!box) throw new Error("The hero search input has no layout box.");
	const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName ?? null, {
		x: box.x + box.width / 2,
		y: box.y + box.height / 2,
	});
	expect(hit).toBe("INPUT");

	await page.mouse.wheel(0, 280);
	await page.waitForTimeout(350);
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
	expect(errors).toEqual([]);
});

test("hero search suggestions stay visible past the hero boundary", async ({ page }) => {
	await page.goto("/");
	const input = page.locator('input[type="search"]').first();
	const list = page.locator('[role="listbox"]').first();

	// Retry until hydration has attached the combobox handlers; typing before
	// that leaves the server-rendered input inert on slower engines.
	await expect(async () => {
		await input.click();
		await input.fill("");
		await input.pressSequentially("pdf", { delay: 20 });
		await expect(list).toBeVisible({ timeout: 1500 });
	}).toPass({ timeout: 20_000 });

	const listBox = await list.boundingBox();
	const heroBox = await page.locator("main section").first().boundingBox();
	if (!listBox || !heroBox) throw new Error("Missing hero or suggestion layout box.");
	expect(listBox.y + listBox.height).toBeGreaterThan(heroBox.y + heroBox.height);
});

test("hero keeps the static artwork when WebGL is unavailable", async ({ page }) => {
	await page.addInitScript(() => {
		const canvasProto = HTMLCanvasElement.prototype as unknown as Record<string, unknown>;
		const original = canvasProto.getContext as (...args: unknown[]) => unknown;
		canvasProto.getContext = function (this: unknown, id: unknown, ...args: unknown[]) {
			if (typeof id === "string" && id.startsWith("webgl")) return null;
			return original.call(this, id, ...args);
		};
	});
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));

	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await page.waitForTimeout(900);
	await expect(page.locator("[data-hologram-root]")).not.toHaveAttribute(
		"data-hologram-active",
		"true",
	);
	await expect(page.locator(".hero-holo-fallback")).toBeVisible();
	expect(errors).toEqual([]);
});

test.describe("reduced motion", () => {
	test.use({ reducedMotion: "reduce" });

	test("hero never starts the WebGL scene", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));

		await page.goto("/");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await page.waitForTimeout(900);
		await expect(page.locator("[data-hologram-root]")).not.toHaveAttribute(
			"data-hologram-active",
			"true",
		);
		expect(errors).toEqual([]);
	});
});

test("WebGL scene activates where headless WebGL is available", async ({ page, browserName }) => {
	test.skip(browserName !== "chromium", "headless WebGL is only guaranteed in test Chromium.");

	await page.goto("/");
	await expect(page.locator("[data-hologram-root]")).toHaveAttribute(
		"data-hologram-active",
		"true",
		{ timeout: 15_000 },
	);
	const buffer = await page.locator("canvas.hero-holo-canvas").evaluate((canvas) => {
		const element = canvas as HTMLCanvasElement;
		return { width: element.width, height: element.height };
	});
	expect(buffer.width).toBeGreaterThan(1);
	expect(buffer.height).toBeGreaterThan(1);
});
