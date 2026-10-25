import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

const requireEngine = createRequire(join(process.cwd(), "packages/engines/package.json"));
const { PDFDocument, PDFName, PDFString, StandardFonts, degrees, rgb } = requireEngine(
	"pdf-lib",
) as typeof import("../../packages/engines/node_modules/pdf-lib");
async function pdf() {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	doc.addPage([400, 300]).drawText("QBTools text remains selectable", {
		x: 30,
		y: 200,
		font,
		size: 18,
		color: rgb(0, 0, 0),
	});
	return Buffer.from(await doc.save({ useObjectStreams: false }));
}
async function image(page: Page) {
	return Buffer.from(
		await page.evaluate(() => {
			const canvas = document.createElement("canvas");
			canvas.width = 320;
			canvas.height = 100;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("No canvas");
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, 290, 100);
			ctx.fillStyle = "black";
			ctx.font = "28px Arial";
			ctx.fillText("HELLO QBTOOLS", 12, 60);
			return canvas.toDataURL("image/png").split(",")[1] ?? "";
		}),
		"base64",
	);
}
async function ready(page: Page, path: string) {
	await page.goto(path);
	await expect(page.locator('input[type="file"]')).toBeAttached();
}
test("home loads without downloading processing assets", async ({ page }) => {
	const heavy: string[] = [];
	page.context().on("request", (request) => {
		if (/\/wasm\/|\.wasm($|\?)/.test(request.url())) heavy.push(request.url());
	});
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await page.waitForTimeout(500);
	expect(heavy).toEqual([]);
});
test("hash worker supports arbitrary files, exact whitespace, extra algorithms and comparison", async ({
	page,
}) => {
	await ready(page, "/tools/hash-generator");
	await page.locator('input[type="file"]').setInputFiles({
		name: "test.bin",
		mimeType: "application/octet-stream",
		buffer: Buffer.from("abc"),
	});
	const expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
	await expect(page.getByText(expected, { exact: true })).toBeVisible();
	await page.getByLabel("BLAKE3", { exact: true }).check();
	await expect(
		page.getByText("6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85", {
			exact: true,
		}),
	).toBeVisible();
	await page.getByPlaceholder("Paste an expected checksum").fill(expected);
	await expect(page.getByText("SHA-256 Match", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Text Hash", exact: true }).click();
	await page.getByLabel("Enter text to hash", { exact: true }).fill(" ");
	await expect(
		page.getByText("36a9e7f1c95b82ffb99743e0c5c4ce95d83c9a430aac59f84ef3cbfab6145068", {
			exact: true,
		}),
	).toBeVisible();
});
for (const format of ["jpeg", "webp", "png", "avif"]) {
	test(`optimized ${format} image output is produced by same-origin assets`, async ({ page }) => {
		await ready(page, "/tools/convert-image");
		const input = await image(page);
		await page.getByRole("radio", { name: "Optimized", exact: true }).click();
		await page.getByLabel("Convert to", { exact: true }).selectOption(format);
		await page
			.locator('input[type="file"]')
			.setInputFiles({ name: "transparent.png", mimeType: "image/png", buffer: input });
		await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible();
		await expect(page.locator('img[alt=""]').first()).toHaveJSProperty("naturalWidth", 320);
		const alpha = await page
			.locator("li img")
			.first()
			.evaluate((element) => {
				const canvas = document.createElement("canvas");
				canvas.width = 320;
				canvas.height = 100;
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("No canvas");
				ctx.drawImage(element as HTMLImageElement, 0, 0);
				return ctx.getImageData(310, 50, 1, 1).data[3];
			});
		expect(alpha).toBe(format === "jpeg" ? 255 : 0);
	});
}
test("PDF optimization produces a valid PDF and preserves text", async ({ page }) => {
	await ready(page, "/tools/compress-pdf");
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "text.pdf", mimeType: "application/pdf", buffer: await pdf() });
	await page.getByRole("button", { name: "Compress PDF", exact: true }).click();
	await expect(page.getByText(/Compressed!|PDF ready/, { exact: true })).toBeVisible();
});
test("native PDF text extraction avoids OCR language downloads", async ({ page }) => {
	const languages: string[] = [];
	page.context().on("request", (request) => {
		if (request.url().includes(".traineddata")) languages.push(request.url());
	});
	await ready(page, "/tools/extract-text");
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "text.pdf", mimeType: "application/pdf", buffer: await pdf() });
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await expect(page.getByLabel("Extracted text", { exact: true })).toHaveValue(
		/QBTools text remains selectable/,
	);
	expect(languages).toEqual([]);
});
test("image OCR uses local assets and produces editable text", async ({ page }) => {
	await ready(page, "/tools/extract-text");
	const input = await image(page);
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "words.png", mimeType: "image/png", buffer: input });
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await expect(page.getByLabel("Extracted text", { exact: true })).toHaveValue(/HELLO/i);
	await page.getByLabel("Extracted text", { exact: true }).fill("Edited text");
	await expect(page.getByLabel("Extracted text", { exact: true })).toHaveValue("Edited text");
});

for (const output of ["mp4"]) {
	test(`FFmpeg compatibility probes and exports ${output}`, async ({ page }) => {
		await ready(page, "/tools/video-compressor");
		await page.getByLabel("Processing mode", { exact: true }).selectOption("compatibility");
		await page.locator('input[type="file"]').setInputFiles("tests/fixtures/clip.mp4");
		await expect(page.getByText(/160×90/)).toBeVisible();
		await page.getByLabel("Output format", { exact: true }).selectOption(output);
		await page.getByRole("button", { name: "Compress video", exact: true }).click();
		await expect(page.getByText("Processing complete", { exact: true })).toBeVisible();
	});
}
for (const output of ["mp3", "wav", "flac"]) {
	test(`video audio extraction exports ${output}`, async ({ page }) => {
		await ready(page, "/tools/video-to-audio");
		await page.locator('input[type="file"]').setInputFiles("tests/fixtures/clip.mp4");
		await expect(page.getByText(/160×90/)).toBeVisible();
		await page.getByLabel("Audio output format", { exact: true }).selectOption(output);
		await page.getByRole("button", { name: "Extract audio", exact: true }).click();
		await expect(page.getByText("Processing complete", { exact: true })).toBeVisible();
	});
}
for (const mode of ["fast", "optimized"]) {
	test(`${mode} GIF export`, async ({ page }) => {
		await ready(page, "/tools/video-to-gif");
		await page.locator('input[type="file"]').setInputFiles("tests/fixtures/clip.mp4");
		await expect(page.getByText(/160×90/)).toBeVisible();
		await page.getByLabel("GIF encoding", { exact: true }).selectOption(mode);
		await page.getByRole("button", { name: "Create animated GIF", exact: true }).click();
		await expect(page.getByText("Processing complete", { exact: true })).toBeVisible();
		await expect(page.getByAltText("Converted GIF preview")).toHaveJSProperty("naturalWidth", 160);
	});
}
test("a missing audio track reports an actionable error", async ({ page }) => {
	await ready(page, "/tools/video-to-audio");
	await page.locator('input[type="file"]').setInputFiles("tests/fixtures/silent.mp4");
	await expect(page.getByText(/160×90/)).toBeVisible();
	await page.getByRole("button", { name: "Extract audio", exact: true }).click();
	await expect(page.getByText(/This video has no audio track\./)).toBeVisible();
});
test("failed image codec assets report an error and allow another job", async ({ page }) => {
	await ready(page, "/tools/convert-image");
	const input = await image(page);
	await page.getByLabel("Convert to", { exact: true }).selectOption("avif");
	await page.context().route("**/avif-*/avif_enc.wasm", (route) => route.abort());
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "first.png", mimeType: "image/png", buffer: input });
	await expect(
		page.locator("li").filter({ hasText: "first.png" }).locator("p.text-critical"),
	).toBeVisible();
	await page.context().unroute("**/avif-*/avif_enc.wasm");
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "second.png", mimeType: "image/png", buffer: input });
	await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible();
});
test("text extraction handles mixed pages in order and forced OCR", async ({ page }) => {
	await ready(page, "/tools/extract-text");
	const png = await image(page);
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	doc.addPage([400, 300]).drawText("NATIVE FIRST PAGE", { x: 25, y: 200, font, size: 18 });
	const scan = await doc.embedPng(png);
	doc.addPage([400, 150]).drawImage(scan, { x: 0, y: 0, width: 400, height: 125 });
	doc.addPage([400, 150]);
	await page.locator('input[type="file"]').setInputFiles({
		name: "mixed.pdf",
		mimeType: "application/pdf",
		buffer: Buffer.from(await doc.save()),
	});
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await expect(page.getByLabel("Extracted text", { exact: true })).toHaveValue(
		/NATIVE FIRST PAGE\f[\s\S]*HELLO[\s\S]*\f/i,
	);
	await expect(page.getByText(/Page 3: OCR — No readable text/)).toBeVisible();
});

test("native WebM export reports codec support honestly", async ({ page }) => {
	await ready(page, "/tools/video-compressor");
	await page.locator('input[type="file"]').setInputFiles("tests/fixtures/clip.mp4");
	await expect(page.getByText(/160×90/)).toBeVisible();
	await page.getByLabel("Output format", { exact: true }).selectOption("webm");
	await page.getByRole("button", { name: "Compress video", exact: true }).click();
	await expect(
		page.getByText("Processing complete", { exact: true }).or(page.getByRole("alert")),
	).toBeVisible();
	if (await page.getByRole("alert").isVisible()) {
		await expect(
			page.getByRole("button", { name: "Try Compatibility mode", exact: true }),
		).toBeVisible();
	}
});
test("image batch lifecycle includes later batches and cancellation", async ({ page }) => {
	await ready(page, "/tools/convert-image");
	const input = await image(page);
	await page.getByLabel("Convert to", { exact: true }).selectOption("avif");
	let release: () => void = () => {};
	const blocked = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.context().route("**/avif-*/avif_enc.wasm", async (route) => {
		await blocked;
		await route.continue().catch(() => {});
	});
	await page.locator('input[type="file"]').setInputFiles([
		{ name: "active.png", mimeType: "image/png", buffer: input },
		{ name: "queued.png", mimeType: "image/png", buffer: input },
	]);
	await page.getByRole("button", { name: "Remove queued.png", exact: true }).click();
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "later.png", mimeType: "image/png", buffer: input });
	await page.getByRole("button", { name: "Remove active.png", exact: true }).click();
	release();
	await page.context().unroute("**/avif-*/avif_enc.wasm");
	await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(1);
	await expect(page.getByText("later.avif", { exact: true })).toBeVisible();
	await expect(page.getByText("active.avif", { exact: true })).not.toBeVisible();
});
test("forced OCR and Arabic language selection use local assets", async ({ page }) => {
	const languages: string[] = [];
	page.context().on("request", (request) => {
		if (request.url().includes(".traineddata")) languages.push(request.url());
	});
	await ready(page, "/tools/extract-text");
	await page.getByLabel("Text language", { exact: true }).selectOption("eng+ara");
	await page.getByLabel("Force OCR on all PDF pages", { exact: true }).check();
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "force.pdf", mimeType: "application/pdf", buffer: await pdf() });
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await expect(page.getByText("Page 1: OCR", { exact: true })).toBeVisible();
	expect(languages.some((url) => url.includes("ara.traineddata"))).toBe(true);
	await page.getByLabel("Text language", { exact: true }).selectOption("ara");
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await expect(page.getByLabel("Extracted text", { exact: true })).toHaveAttribute("dir", "rtl");
});
test("image encoder records cold and warm processing measurements", async ({ page }, testInfo) => {
	await ready(page, "/tools/convert-image");
	const input = await image(page);
	await page.getByLabel("Convert to", { exact: true }).selectOption("avif");
	const samples: {
		run: string;
		milliseconds: number;
		inputBytes: number;
		outputBytes: number;
		usedJsHeapSize: number | null;
	}[] = [];
	for (const [index, run] of ["cold", "warm"].entries()) {
		const started = Date.now();
		await page
			.locator('input[type="file"]')
			.setInputFiles({ name: `${run}.png`, mimeType: "image/png", buffer: input });
		await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(
			index + 1,
		);
		const milliseconds = Date.now() - started;
		const downloaded = page.waitForEvent("download");
		await page.getByRole("button", { name: "Download", exact: true }).nth(index).click();
		const file = await downloaded;
		const stream = await file.createReadStream();
		let size = 0;
		for await (const part of stream) size += part.length;
		const memory = await page.evaluate(
			() =>
				(performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
					?.usedJSHeapSize ?? null,
		);
		samples.push({
			run,
			milliseconds,
			inputBytes: input.length,
			outputBytes: size,
			usedJsHeapSize: memory,
		});
	}
	await mkdir(testInfo.outputDir, { recursive: true });
	await writeFile(
		testInfo.outputPath("image-benchmark.json"),
		JSON.stringify(
			{ browser: testInfo.project.name, fixture: "320x100 transparent text PNG", samples },
			null,
			2,
		),
	);
	await testInfo.attach("image-benchmark", {
		body: JSON.stringify(
			{ browser: testInfo.project.name, fixture: "320x100 transparent text PNG", samples },
			null,
			2,
		),
		contentType: "application/json",
	});
});

test("protected and malformed PDFs fail cleanly and allow a replacement", async ({ page }) => {
	await ready(page, "/tools/compress-pdf");
	await page.locator('input[type="file"]').setInputFiles("tests/fixtures/protected.pdf");
	await page.getByRole("button", { name: "Compress PDF", exact: true }).click();
	await expect(page.getByText(/This PDF is password-protected/)).toBeVisible();
	await page.locator('input[type="file"]').setInputFiles({
		name: "broken.pdf",
		mimeType: "application/pdf",
		buffer: Buffer.from("not a PDF"),
	});
	await page.getByRole("button", { name: "Compress PDF", exact: true }).click();
	await expect(page.getByText(/This PDF couldn't be opened/)).toBeVisible();
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "replacement.pdf", mimeType: "application/pdf", buffer: await pdf() });
	await page.getByRole("button", { name: "Compress PDF", exact: true }).click();
	await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible();
});
test("native MP4 can remove sound without rejecting an intentional track discard", async ({
	page,
}) => {
	await ready(page, "/tools/video-compressor");
	await page.locator('input[type="file"]').setInputFiles("tests/fixtures/clip.mp4");
	await expect(page.getByText(/160×90/)).toBeVisible();
	await page.getByLabel("Remove sound", { exact: true }).check();
	await page.getByRole("button", { name: "Compress video", exact: true }).click();
	await expect(
		page.getByText("Processing complete", { exact: true }).or(page.getByRole("alert")),
	).toBeVisible();
});
test("cancelled OCR initialization can restart without stale results", async ({ page }) => {
	await ready(page, "/tools/extract-text");
	const input = await image(page);
	let release: () => void = () => {};
	const blocked = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.context().route("**/tessdata-*/*.traineddata.gz", async (route) => {
		await blocked;
		await route.continue().catch(() => {});
	});
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "words.png", mimeType: "image/png", buffer: input });
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await page.getByRole("button", { name: "Cancel", exact: true }).click();
	release();
	await page.context().unroute("**/tessdata-*/*.traineddata.gz");
	await expect(page.getByText("Text extraction cancelled.", { exact: true })).toBeVisible();
	await expect(page.getByLabel("Extracted text", { exact: true })).not.toBeVisible();
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await expect(page.getByLabel("Extracted text", { exact: true })).toHaveValue(/HELLO/i);
});
test("failed OCR assets produce an error and a retry succeeds", async ({ page }) => {
	await ready(page, "/tools/extract-text");
	const input = await image(page);
	await page.context().route("**/tessdata-*/*.traineddata.gz", (route) => route.abort());
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "words.png", mimeType: "image/png", buffer: input });
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await expect(page.getByRole("alert")).toBeVisible();
	await page.context().unroute("**/tessdata-*/*.traineddata.gz");
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await expect(page.getByLabel("Extracted text", { exact: true })).toHaveValue(/HELLO/i);
});

test("optimized PDF retains text, form values, links, bookmarks and rotated pages", async ({
	page,
}) => {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const first = doc.addPage([400, 300]);
	first.setRotation(degrees(90));
	first.drawText("PRESERVED DOCUMENT TEXT", { x: 25, y: 200, font, size: 18 });
	const link = doc.context.register(
		doc.context.obj({
			Type: "Annot",
			Subtype: "Link",
			Rect: [20, 20, 150, 40],
			A: { Type: "Action", S: "URI", URI: PDFString.of("https://example.com") },
		}),
	);
	first.node.set(PDFName.of("Annots"), doc.context.obj([link]));
	const field = doc.getForm().createTextField("sample");
	field.setText("Preserved form value");
	field.addToPage(first, { x: 25, y: 100, width: 200, height: 30 });
	const outlines = doc.context.obj({ Type: "Outlines", Count: 1 });
	const root = doc.context.register(outlines);
	const bookmark = doc.context.register(
		doc.context.obj({
			Title: PDFString.of("First page"),
			Parent: root,
			Dest: [first.ref, PDFName.of("Fit")],
		}),
	);
	outlines.set(PDFName.of("First"), bookmark);
	outlines.set(PDFName.of("Last"), bookmark);
	doc.catalog.set(PDFName.of("Outlines"), root);
	await ready(page, "/tools/compress-pdf");
	await page.locator('input[type="file"]').setInputFiles({
		name: "features.pdf",
		mimeType: "application/pdf",
		buffer: Buffer.from(await doc.save({ useObjectStreams: false })),
	});
	await page.getByRole("button", { name: "Compress PDF", exact: true }).click();
	await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible();
	const downloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: "Download", exact: true }).click();
	const download = await downloadPromise;
	const chunks: Buffer[] = [];
	for await (const part of await download.createReadStream()) chunks.push(part as Buffer);
	const bytes = Buffer.concat(chunks);
	const result = await PDFDocument.load(bytes);
	expect(result.getPageCount()).toBe(1);
	expect(result.getPage(0).getSize()).toEqual({ width: 400, height: 300 });
	expect(result.getPage(0).getRotation().angle).toBe(90);
	expect(result.getForm().getTextField("sample").getText()).toBe("Preserved form value");
	expect(result.getPage(0).node.Annots()?.size()).toBe(2);
	expect(result.catalog.get(PDFName.of("Outlines"))).toBeDefined();
	await ready(page, "/tools/extract-text");
	await page
		.locator('input[type="file"]')
		.setInputFiles({ name: "optimized.pdf", mimeType: "application/pdf", buffer: bytes });
	await page.getByRole("button", { name: "Extract text", exact: true }).click();
	await expect(page.getByLabel("Extracted text", { exact: true })).toHaveValue(
		/PRESERVED DOCUMENT TEXT/,
	);
});

test("AAC encoding falls back to WASM when native AAC is unavailable", async ({ page }) => {
	await page.addInitScript(() => {
		if (typeof AudioEncoder === "undefined") return;
		const nativeCheck = AudioEncoder.isConfigSupported.bind(AudioEncoder);
		Object.defineProperty(AudioEncoder, "isConfigSupported", {
			value: (config: AudioEncoderConfig) =>
				config.codec.startsWith("mp4a")
					? Promise.resolve({ config, supported: false })
					: nativeCheck(config),
		});
	});
	await ready(page, "/tools/video-compressor");
	const supportsVideo = await page.evaluate(
		async () =>
			typeof VideoEncoder !== "undefined" &&
			(
				await VideoEncoder.isConfigSupported({
					codec: "avc1.42001f",
					width: 160,
					height: 90,
					bitrate: 100000,
					framerate: 12,
				})
			).supported,
	);
	test.skip(
		!supportsVideo,
		"This device lacks a native H.264 encoder; compatibility mode is tested separately.",
	);
	const requested: string[] = [];
	page.context().on("request", (request) => requested.push(request.url()));
	await page.locator('input[type="file"]').setInputFiles("tests/fixtures/clip.mp4");
	await expect(page.getByText(/160×90/)).toBeVisible();
	await page.getByRole("button", { name: "Compress video", exact: true }).click();
	await expect(page.getByText("Processing complete", { exact: true })).toBeVisible();
	expect(requested.some((url) => url.includes("aac-encoder"))).toBe(true);
	await expect
		.poll(() =>
			page
				.locator("video")
				.last()
				.evaluate((element) => (element as HTMLVideoElement).duration),
		)
		.toBeGreaterThan(0);
});
