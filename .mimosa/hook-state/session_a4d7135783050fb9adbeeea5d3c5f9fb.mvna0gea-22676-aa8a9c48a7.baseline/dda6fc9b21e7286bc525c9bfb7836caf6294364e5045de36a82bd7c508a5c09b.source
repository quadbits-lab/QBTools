/**
 * Regression coverage for the production-only worker crash that froze the
 * graphic tools: the Vite worker bundle used to eagerly evaluate `upng-js`
 * (UMD), whose fallback reads `window.pako`. Inside a Worker that throws
 * `ReferenceError: window is not defined`, so every `graphic-render` reply was
 * an error and the tools showed an endless spinner.
 *
 * A second production-only failure is guarded here too: the worker re-encode
 * path used to hand a plain object to `OffscreenCanvasRenderingContext2D`
 * `.putImageData`, so favicon WebP icons and OG JPG/WebP exports failed with
 * "parameter 1 is not of type 'ImageData'" while previews looked healthy.
 *
 * Each tool only counts as healthy once the worker returns a real rendered
 * image (a `blob:` preview with a non-zero natural size, no worker error
 * reply) and the exercised export produces a real download. Run against a
 * production build (QBTOOLS_TEST_URL) to reproduce the regressions this guards.
 */
import { readFileSync, statSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

/** Key used to publish the worker instrumentation into the page context. */
const PROBE_KEY = "__qbWorkerProbe";

const GRAPHIC_TOOLS = [
	{ slug: "og-banner-maker", name: "OG banner maker" },
	{ slug: "favicon-generator", name: "favicon generator" },
	{ slug: "app-icon-generator", name: "app icon generator" },
] as const;

/** Count preview images that the worker has actually decoded to a bitmap. */
function decodedBlobImages(page: Page): Promise<number> {
	return page.evaluate(
		() =>
			Array.from(document.querySelectorAll("img")).filter((img) => {
				const src = img.getAttribute("src") ?? "";
				return src.startsWith("blob:") && img.complete && img.naturalWidth > 0;
			}).length,
	);
}

/**
 * Wrap `window.Worker` so every instance reports `error` events and error
 * replies (`{id, error}`) before the app creates its processing worker.
 */
async function instrumentWorkers(page: Page) {
	await page.addInitScript((key: string) => {
		const probe = {
			created: [] as string[],
			errors: [] as string[],
			errorReplies: [] as string[],
		};
		(window as unknown as Record<string, typeof probe>)[key] = probe;
		const NativeWorker = window.Worker;
		class ProbedWorker extends NativeWorker {
			constructor(url: string | URL, options?: WorkerOptions) {
				super(url, options);
				probe.created.push(String(url));
				this.addEventListener("error", (event) => {
					const message = (event as ErrorEvent).message;
					probe.errors.push(message ? String(message) : "worker error event");
				});
				this.addEventListener("message", (event) => {
					const data = (event as MessageEvent).data as Record<string, unknown> | null;
					if (!data || typeof data !== "object" || !("id" in data)) return;
					if (data.error != null) probe.errorReplies.push(String(data.error));
				});
			}
		}
		window.Worker = ProbedWorker as unknown as typeof Worker;
	}, PROBE_KEY);
}

interface WorkerProbe {
	created: string[];
	errors: string[];
	errorReplies: string[];
}

function readWorkerProbe(page: Page): Promise<WorkerProbe> {
	return page.evaluate((key) => (window as unknown as Record<string, WorkerProbe>)[key], PROBE_KEY);
}

/** Load a graphic tool and wait until the worker preview landed. */
async function openGraphicTool(page: Page, slug: string) {
	await instrumentWorkers(page);
	await page.goto(`/tools/${slug}`);
	await expect
		.poll(() => decodedBlobImages(page), {
			message: `${slug} never rendered a decodable worker preview`,
			timeout: 45_000,
		})
		.toBeGreaterThan(0);
	// The fatal production regression surfaced as body/panel copy.
	await expect(page.getByText("window is not defined")).toHaveCount(0);
	// Once a preview is on screen the loading state must have cleared.
	await expect.poll(() => page.locator(".animate-spin").count()).toBe(0);
}

async function expectNoWorkerErrors(page: Page) {
	const probe = await readWorkerProbe(page);
	expect(probe.created.length, "the tool never created a processing worker").toBeGreaterThan(0);
	expect(probe.errors).toEqual([]);
	expect(probe.errorReplies).toEqual([]);
}

/** Click something that triggers a browser download and return its saved file. */
async function saveDownload(page: Page, click: () => Promise<void>) {
	const [download] = await Promise.all([
		page.waitForEvent("download", { timeout: 180_000 }),
		click(),
	]);
	const path = await download.path();
	if (!path) throw new Error("Browser download produced no local file.");
	return {
		name: download.suggestedFilename(),
		path,
		bytes: statSync(path).size,
		head: readFileSync(path).subarray(0, 24),
	};
}

function pngSize(head: Buffer): { width: number; height: number } {
	expect(head.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
	return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}

for (const tool of GRAPHIC_TOOLS) {
	test(`${tool.name} renders a worker preview with no worker error reply`, async ({ page }) => {
		await openGraphicTool(page, tool.slug);
		await expectNoWorkerErrors(page);
	});
}

test("og banner maker exports a real PNG download", async ({ page }) => {
	await openGraphicTool(page, "og-banner-maker");
	await page.getByRole("tab", { name: "Export" }).click();
	await page.getByRole("button", { name: /Export image/ }).click();
	const downloadButton = page.getByRole("button", { name: "Download", exact: true });
	await expect(downloadButton).toBeVisible({ timeout: 120_000 });
	const file = await saveDownload(page, () => downloadButton.click());
	expect(file.name).toMatch(/\.png$/i);
	expect(file.bytes).toBeGreaterThan(0);
	const size = pngSize(file.head);
	expect(size.width).toBeGreaterThan(0);
	expect(size.height).toBeGreaterThan(0);
	await expectNoWorkerErrors(page);
});

test("favicon generator exports a ZIP with the default WebP icons enabled", async ({ page }) => {
	await openGraphicTool(page, "favicon-generator");
	// Defaults keep "Also emit WebP browser icons" checked — the re-encode path
	// that used to throw on OffscreenCanvas.putImageData.
	await page.getByRole("button", { name: /Generate favicon package/ }).click();
	const zipButton = page.getByRole("button", { name: "Download ZIP" });
	await expect(zipButton).toBeVisible({ timeout: 180_000 });
	const file = await saveDownload(page, () => zipButton.click());
	expect(file.name).toMatch(/\.zip$/i);
	expect(file.bytes).toBeGreaterThan(0);
	expect(file.head.subarray(0, 2).toString("latin1")).toBe("PK");
	await expectNoWorkerErrors(page);
});

test("app icon generator exports an icon kit ZIP", async ({ page }) => {
	await openGraphicTool(page, "app-icon-generator");
	await page.getByRole("tab", { name: "Export" }).click();
	await page.getByRole("button", { name: /Generate icon kit/ }).click();
	const zipButton = page.getByRole("button", { name: "Download ZIP" });
	await expect(zipButton).toBeVisible({ timeout: 300_000 });
	const file = await saveDownload(page, () => zipButton.click());
	expect(file.name).toMatch(/\.zip$/i);
	expect(file.bytes).toBeGreaterThan(0);
	expect(file.head.subarray(0, 2).toString("latin1")).toBe("PK");
	await expectNoWorkerErrors(page);
});
