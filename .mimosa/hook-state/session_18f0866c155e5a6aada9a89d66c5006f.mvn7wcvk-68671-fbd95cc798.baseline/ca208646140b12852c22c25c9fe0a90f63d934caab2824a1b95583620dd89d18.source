import { expect, test } from "@playwright/test";

const DISCIPLINES = [
	"Image tools",
	"PDF tools",
	"Text tools",
	"Calculators",
	"Generators",
	"Media tools",
	"Security & Encryption",
	"Developer tools",
] as const;

test("categories section exposes each discipline as one card link", async ({ page }) => {
	await page.goto("/");
	const section = page.locator("#categories");
	await expect(section.getByRole("heading", { level: 2 })).toContainText(
		"disciplines, one toolbox",
	);

	await expect(section.locator("ul > li")).toHaveCount(DISCIPLINES.length);
	for (const name of DISCIPLINES) {
		await expect(section.getByRole("link", { name })).toHaveAttribute(
			"href",
			/\/categories\/[a-z]+$/,
		);
	}
	await expect(section.getByRole("link", { name: "Image tools" })).toHaveAttribute(
		"href",
		"/categories/image",
	);
});

test("category card and start-here CTA navigate", async ({ page }) => {
	await page.goto("/");
	const section = page.locator("#categories");

	await section.getByRole("link", { name: "PDF tools" }).click();
	await expect(page).toHaveURL(/\/categories\/pdf$/);

	await page.goBack();
	await section.scrollIntoViewIfNeeded();
	await section.getByRole("link", { name: /Browse all tools/ }).click();
	await expect(page).toHaveURL(/\/tools$/);
});

test("categories section fits a mobile viewport without horizontal overflow", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");
	await page.locator("#categories").scrollIntoViewIfNeeded();
	await expect(
		page.locator("#categories").getByRole("link", { name: "Image tools" }),
	).toBeVisible();
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});
