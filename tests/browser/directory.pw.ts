import { expect, type Page, test } from "@playwright/test";

const DIRECTORY = "#tools-directory";
const WORKSPACE = "#workspace";

/**
 * Seed one recent tool so the workspace shelf is client-rendered, then wait for
 * it: that is a reliable "React has hydrated" signal on a cold dev server.
 */
async function openDirectory(page: Page) {
	await page.addInitScript(() => {
		localStorage.setItem("qbtools.recent", JSON.stringify(["resize-image"]));
	});
	await page.goto("/");
	await expect(page.locator(WORKSPACE)).toBeVisible({ timeout: 30_000 });
	await page.locator(DIRECTORY).evaluate((el) => {
		window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80);
	});
	await page.waitForTimeout(200);
}

test("directory filters, resets, and expands", async ({ page }) => {
	await openDirectory(page);
	const section = page.locator(DIRECTORY);
	const results = section.locator("p[aria-live]");

	await expect(section.getByRole("link")).toHaveCount(12);
	await expect(results).toContainText("Showing 12 of 41 tools");

	// Retry until hydration has attached the filter handlers.
	await expect(async () => {
		await section.getByRole("button", { name: /^Image/ }).click();
		await expect(results).toContainText("Showing 7 of 41 tools");
	}).toPass({ timeout: 15_000 });

	await expect(section.getByRole("link")).toHaveCount(7);

	await section.getByRole("button", { name: /Reset filters/ }).click();
	await expect(results).toContainText("Showing 12 of 41 tools");
	await expect(section.getByRole("link")).toHaveCount(12);

	await section.getByRole("button", { name: /Show all 41 tools/ }).click();
	await expect(results).toContainText("Showing 41 of 41 tools");
	await expect(section.getByRole("link")).toHaveCount(41);
});

test("directory search shows an empty state and clears", async ({ page }) => {
	await openDirectory(page);
	const section = page.locator(DIRECTORY);
	const search = section.locator('input[type="search"]');

	await expect(async () => {
		await search.fill("zzzzz");
		await expect(section.getByText("No matching tools")).toBeVisible({ timeout: 1500 });
	}).toPass({ timeout: 15_000 });

	await section.getByRole("button", { name: "Clear filters" }).click();
	await expect(search).toHaveValue("");
	await expect(section.getByText("No matching tools")).toHaveCount(0);
	await expect(section.locator("p[aria-live]")).toContainText("Showing 12 of 41 tools");
});

test("the favorite action stays separate from opening a tool", async ({ page }) => {
	await openDirectory(page);
	const section = page.locator(DIRECTORY);
	const card = section.locator("article").first();
	const favorite = card.getByRole("button");

	await expect(async () => {
		if ((await favorite.getAttribute("aria-pressed")) !== "true") {
			await favorite.click();
		}
		await expect(favorite).toHaveAttribute("aria-pressed", "true");
	}).toPass({ timeout: 15_000 });

	await expect(page).toHaveURL(/\/$/);
	await expect(favorite).toHaveAttribute("aria-label", /Remove .* from favorites/);

	await card.getByRole("link").click();
	await expect(page).toHaveURL(/\/tools\/compress-image$/);
});

test.describe("workspace shelf", () => {
	test("tabs filter the shelf and clearing history updates it", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("qbtools.recent", JSON.stringify(["resize-image", "compress-image"]));
			localStorage.setItem("qbtools.favorites", JSON.stringify(["compress-image", "merge-pdf"]));
		});
		await page.goto("/");

		const shelf = page.locator(WORKSPACE);
		await expect(shelf).toBeVisible();
		await expect(shelf.getByRole("link")).toHaveCount(3);

		await shelf.getByRole("radio", { name: /Saved/ }).click();
		await expect(shelf.getByRole("link")).toHaveCount(2);

		await shelf.getByRole("radio", { name: /Recent/ }).click();
		await expect(shelf.getByRole("link")).toHaveCount(2);

		await shelf.getByRole("radio", { name: /^All/ }).click();
		await expect(shelf.getByRole("link")).toHaveCount(3);

		await shelf.getByRole("button", { name: "Clear recent history" }).click();
		await expect(shelf.getByRole("link")).toHaveCount(2);
		await expect(shelf.getByRole("radio", { name: /Recent 0/ })).toBeVisible();
	});

	test("the empty saved tab explains how to add a tool", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("qbtools.recent", JSON.stringify(["resize-image"]));
			localStorage.setItem("qbtools.favorites", JSON.stringify([]));
		});
		await page.goto("/");

		const shelf = page.locator(WORKSPACE);
		await expect(shelf).toBeVisible();
		await shelf.getByRole("radio", { name: /Saved/ }).click();
		await expect(shelf.getByText("No saved tools yet. Star a tool to pin it here.")).toBeVisible();
	});
});
