import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const requireEngine = createRequire(join(process.cwd(), "packages/engines/package.json"));
const { PDFDocument, StandardFonts } = requireEngine(
	"pdf-lib",
) as typeof import("../../packages/engines/node_modules/pdf-lib");

async function pdf(pages: string[]) {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	for (const text of pages)
		doc.addPage([300, 400]).drawText(text, { x: 20, y: 200, font, size: 24 });
	return Buffer.from(await doc.save());
}
async function ready(page: Page, path: string) {
	await page.goto(path);
	await expect(page.locator('input[type="file"]').first()).toBeAttached();
}
async function upload(page: Page, name: string, mimeType: string, buffer: Buffer) {
	await page.locator('input[type="file"]').first().setInputFiles({ name, mimeType, buffer });
}
async function download(page: Page) {
	const [saved] = await Promise.all([
		page.waitForEvent("download"),
		page
			.getByRole("button", { name: /^Download/ })
			.first()
			.click(),
	]);
	return readFile(await saved.path());
}
/** Extracted text of one page, read with pdf.js the way a viewer would. */
async function pageText(bytes: Buffer, index: number) {
	const lib = await import(
		pathToFileURL(requireEngine.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href
	);
	const task = lib.getDocument({ data: new Uint8Array(bytes) });
	const doc = await task.promise;
	const content = await (await doc.getPage(index + 1)).getTextContent();
	await task.destroy();
	return content.items
		.map((item: { str?: string }) => item.str ?? "")
		.join(" ")
		.trim();
}
test("protect then unlock a PDF, rejecting a wrong password", async ({ page }) => {
	await ready(page, "/tools/protect-pdf");
	await upload(page, "plain.pdf", "application/pdf", await pdf(["Hello"]));
	await page.getByLabel("New password").fill("correct horse 9");
	await page.getByLabel("Confirm password").fill("correct horse 9");
	await page.getByRole("button", { name: "Protect PDF", exact: true }).click();
	await expect(page.getByText("Your PDF is protected")).toBeVisible();
	const protectedBytes = await download(page);
	expect(protectedBytes.toString("latin1")).toContain("/Encrypt");

	await ready(page, "/tools/protect-pdf");
	await upload(page, "locked.pdf", "application/pdf", protectedBytes);
	await page.getByRole("radio", { name: "Unlock" }).click();
	await page.getByLabel("Current password").fill("wrong");
	await page.getByRole("button", { name: "Unlock PDF", exact: true }).click();
	await expect(page.getByText("That password is incorrect.")).toBeVisible();
	await page.getByLabel("Current password").fill("correct horse 9");
	await page.getByRole("button", { name: "Unlock PDF", exact: true }).click();
	await expect(page.getByText("Your PDF is unlocked")).toBeVisible();
	const unlocked = await download(page);
	expect(unlocked.toString("latin1")).not.toContain("/Encrypt");
	expect((await PDFDocument.load(unlocked)).getPageCount()).toBe(1);
});
test("unlocking an unprotected PDF explains why nothing happened", async ({ page }) => {
	await ready(page, "/tools/protect-pdf");
	await upload(page, "plain.pdf", "application/pdf", await pdf(["Hello"]));
	await page.getByRole("radio", { name: "Unlock" }).click();
	await page.getByLabel("Current password").fill("anything");
	await page.getByRole("button", { name: "Unlock PDF", exact: true }).click();
	await expect(page.getByText("This PDF isn't password-protected.")).toBeVisible();
});
test("watermark stamps only the chosen pages", async ({ page }) => {
	await ready(page, "/tools/watermark-pdf");
	await upload(page, "two.pdf", "application/pdf", await pdf(["One", "Two"]));
	await page.getByLabel("Watermark text").fill("DRAFT COPY");
	await page.getByLabel("Pages (leave empty for all)").fill("1");
	await page.getByRole("button", { name: "Add watermark", exact: true }).click();
	await expect(page.getByText("Stamped 1 of 2 pages")).toBeVisible();
	const doc = await PDFDocument.load(await download(page));
	expect(doc.getPageCount()).toBe(2);
});
test("redaction removes text from marked pages and keeps the others", async ({ page }) => {
	await ready(page, "/tools/redact-pdf");
	await upload(page, "secret.pdf", "application/pdf", await pdf(["SECRET-4242", "keep me"]));
	const surface = page.getByTestId("redact-page-1");
	await expect(surface).toBeVisible();
	await surface.scrollIntoViewIfNeeded();
	const box = await surface.boundingBox();
	if (!box) throw new Error("No page preview");
	await page.mouse.move(box.x + box.width * 0.05, box.y + box.height * 0.4);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.6, { steps: 6 });
	await page.mouse.up();
	await expect(page.getByRole("button", { name: /Remove redaction on page 1/ })).toBeVisible();
	await page.getByRole("button", { name: /^Redact 1 page$/ }).click();
	await expect(page.getByText("Redacted 1 of 2 pages")).toBeVisible();
	const redacted = await download(page);
	expect((await PDFDocument.load(redacted)).getPageCount()).toBe(2);
	expect(await pageText(redacted, 0)).toBe("");
	expect(await pageText(redacted, 1)).toBe("keep me");
	expect(redacted.toString("latin1")).not.toContain("SECRET");
});
test("a scanned PDF becomes searchable with on-device OCR", async ({ page }) => {
	test.setTimeout(120_000);
	await ready(page, "/tools/ocr-pdf");
	const png = Buffer.from(
		await page.evaluate(() => {
			const canvas = document.createElement("canvas");
			canvas.width = 1240;
			canvas.height = 500;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("No canvas");
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "#000";
			ctx.font = "bold 64px Arial";
			ctx.fillText("Invoice Number 20481", 80, 160);
			ctx.font = "48px Arial";
			ctx.fillText("Thank you for your business", 80, 300);
			return canvas.toDataURL("image/png").split(",")[1] ?? "";
		}),
		"base64",
	);
	const doc = await PDFDocument.create();
	const image = await doc.embedPng(png);
	doc.addPage([620, 250]).drawImage(image, { x: 0, y: 0, width: 620, height: 250 });
	await upload(page, "scan.pdf", "application/pdf", Buffer.from(await doc.save()));
	await page.getByRole("button", { name: "Make searchable", exact: true }).click();
	await expect(page.getByText("Your PDF is searchable")).toBeVisible({ timeout: 90_000 });
	await expect(page.getByText(/1 page read with OCR \((\d+) words\)/)).toBeVisible();
	const words = Number(
		/\((\d+) words\)/.exec((await page.getByText(/read with OCR/).textContent()) ?? "")?.[1],
	);
	expect(words).toBeGreaterThanOrEqual(6);
	expect((await PDFDocument.load(await download(page))).getPageCount()).toBe(1);
});
test("a created barcode scans back to the same text", async ({ page }) => {
	await ready(page, "/tools/barcode-scanner");
	await page.getByRole("radio", { name: "Create" }).click();
	await page.getByLabel("Barcode type").selectOption("Code128");
	await page.getByLabel("Text or number to encode").fill("QB-2026-ABC");
	await page.getByRole("button", { name: "Create barcode", exact: true }).click();
	await expect(page.getByRole("img", { name: /for QB-2026-ABC/ })).toBeVisible();
	const [saved] = await Promise.all([
		page.waitForEvent("download"),
		page.getByRole("button", { name: "Download PNG" }).click(),
	]);
	const png = await readFile(await saved.path());
	await page.getByRole("radio", { name: "Scan" }).click();
	await upload(page, "code.png", "image/png", png);
	await expect(page.getByText("QB-2026-ABC", { exact: true })).toBeVisible();
	await expect(page.getByText("CODE128")).toBeVisible();
});
test("barcode creation reports invalid input instead of a broken image", async ({ page }) => {
	await ready(page, "/tools/barcode-scanner");
	await page.getByRole("radio", { name: "Create" }).click();
	await page.getByLabel("Barcode type").selectOption("EAN13");
	await page.getByLabel("Text or number to encode").fill("not digits");
	await page.getByRole("button", { name: "Create barcode", exact: true }).click();
	await expect(page.getByText(/can't be encoded as this barcode type/)).toBeVisible();
});
test("code formatter formats, minifies and explains syntax errors", async ({ page }) => {
	await page.goto("/tools/code-formatter");
	await page.getByLabel("Language").selectOption("javascript");
	await page.getByLabel("Your code").fill("const a={b:1,c:[1,2]};function f(x){return x+1}");
	await page.getByRole("button", { name: "Format", exact: true }).click();
	await expect(page.getByLabel("Result")).toHaveValue(
		"const a = { b: 1, c: [1, 2] };\nfunction f(x) {\n  return x + 1;\n}\n",
	);
	await page.getByLabel("Your code").fill("const = ;");
	await page.getByRole("button", { name: "Format", exact: true }).click();
	await expect(page.getByText(/This code couldn't be parsed/)).toBeVisible();
	await page.getByLabel("Language").selectOption("json");
	await page.getByLabel("Your code").fill('{\n "a": 1,\n "b": [1, 2]\n}');
	await page.getByRole("button", { name: "Minify JSON" }).click();
	await expect(page.getByLabel("Result")).toHaveValue('{"a":1,"b":[1,2]}');
});
test("compression benchmark verifies every method", async ({ page }) => {
	test.setTimeout(90_000);
	await ready(page, "/tools/compression-benchmark");
	const text = "QBTools makes private, on-device file tools. ".repeat(8000);
	await upload(page, "sample.txt", "text/plain", Buffer.from(text));
	await page.getByRole("button", { name: "Run benchmark", exact: true }).click();
	await expect(page.getByText(/Every result was decompressed/)).toBeVisible({ timeout: 60_000 });
	await expect(page.locator("tbody tr")).toHaveCount(8);
	await expect(page.getByRole("cell", { name: "Yes" })).toHaveCount(8);
	await expect(page.getByRole("cell", { name: "Mismatch" })).toHaveCount(0);
});
test("the new tools are listed under their categories", async ({ page }) => {
	await page.goto("/categories/developer");
	await expect(page.getByRole("link", { name: /Code Formatter/ }).first()).toBeVisible();
	await expect(page.getByRole("link", { name: /Compression Benchmark/ }).first()).toBeVisible();
	await page.goto("/categories/pdf");
	for (const name of ["Protect PDF", "Watermark PDF", "Redact PDF", "Searchable PDF"])
		await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
});
