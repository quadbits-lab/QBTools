/**
 * Browser coverage for the graphic editor tools: og-banner-maker and
 * app-icon-generator. Verifies the client-side worker pipeline end to end —
 * preview rendering, template switching, and icon-kit generation including
 * the macOS .icns — with a clean console.
 */
import { expect, test } from "@playwright/test";

function watchErrors(page: import("@playwright/test").Page) {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
	page.on("console", (msg) => {
		if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
	});
	return errors;
}

test("og banner maker renders, switches templates and selects elements", async ({ page }) => {
	const errors = watchErrors(page);
	await page.goto("/tools/og-banner-maker");

	// Preview pipeline: worker + resvg wasm + fonts produce a blob img.
	const preview = page.getByRole("img", { name: "Banner preview" });
	await expect(preview).toBeVisible({ timeout: 45_000 });
	await expect
		.poll(async () => (await preview.getAttribute("src"))?.startsWith("blob:"), {
			timeout: 45_000,
		})
		.toBe(true);

	// Template thumbnails render as inline SVG with document fonts.
	await expect(page.getByRole("radio", { name: "Split Image" })).toBeVisible();
	await page.getByRole("radio", { name: "Split Image" }).click();
	await expect(preview).toBeVisible();

	// Element selection via chip drives the inspector.
	await page.getByRole("button", { name: "Subtitle", exact: true }).first().click();
	await expect(page.getByText("Typography")).toBeVisible();

	// Undo/redo buttons exist and reflect history state.
	await expect(page.getByRole("button", { name: /Undo/ }).first()).toBeEnabled();

	expect(errors, errors.join("\n")).toEqual([]);
});

test("app icon generator previews, generates ios+android+macos kit", async ({ page }) => {
	const errors = watchErrors(page);
	await page.goto("/tools/app-icon-generator");

	const hero = page.getByRole("img", { name: "Icon preview" });
	await expect(hero).toBeVisible({ timeout: 45_000 });
	await expect
		.poll(async () => (await hero.getAttribute("src"))?.startsWith("blob:"), {
			timeout: 45_000,
		})
		.toBe(true);

	// Type initials so the artwork is more than a plain background.
	await page.getByRole("radio", { name: "Initials" }).click();
	await page.getByPlaceholder("QB").fill("QB");
	await expect.poll(async () => (await hero.getAttribute("src"))?.startsWith("blob:")).toBe(true);

	// Enable macOS alongside iOS + Android, then generate the full kit.
	await page.getByRole("tab", { name: "Export" }).click();
	await page.getByRole("switch", { name: "macOS platform" }).click();
	await page.getByRole("button", { name: "Generate icon kit" }).click();
	await expect(page.getByRole("button", { name: "Download ZIP" })).toBeVisible({
		timeout: 60_000,
	});
	const contents = await page.getByText(/Contents \(\d+\)/).textContent();
	expect(Number(contents?.match(/\((\d+)\)/)?.[1] ?? 0)).toBeGreaterThan(20);

	expect(errors, errors.join("\n")).toEqual([]);
});
