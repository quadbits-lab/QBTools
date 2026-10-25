import { describe, expect, test } from "bun:test";
import { assetBase } from "./assets";
import { protectPdf } from "./pdf/protect";
import { writeBarcodeImage } from "./barcode";

describe("headless asset resolution", () => {
	test("returns file:// bases that exist on disk", async () => {
		for (const [key, file] of [
			["qpdf", "qpdf.wasm"],
			["zxing", "reader/zxing_reader.wasm"],
			["zstd", "zstd.wasm"],
			["brotli", "brotli_wasm.js"],
		] as const) {
			const base = await assetBase(key);
			expect(base.startsWith("file://")).toBeTrue();
			const response = await fetch(`${base}/${file}`);
			expect(response.ok).toBeTrue();
		}
	});

	test("unknown keys still fail", async () => {
		await expect(assetBase("definitely-not-a-key")).rejects.toThrow("Missing processing asset");
	});
});

describe("headless qpdf", () => {
	test("protects and unlocks a PDF round-trip", async () => {
		const { PDFDocument } = await import("pdf-lib");
		const doc = await PDFDocument.create();
		doc.addPage([200, 200]);
		const bytes = await doc.save();
		const source = new File([bytes as BlobPart], "source.pdf", { type: "application/pdf" });

		const locked = await protectPdf({ file: source, mode: "protect", password: "s3cret" });
		expect(locked.size).toBeGreaterThan(0);

		const unlocked = await protectPdf({
			file: new File([new Uint8Array(await locked.arrayBuffer())], "locked.pdf", {
				type: "application/pdf",
			}),
			mode: "unlock",
			password: "s3cret",
		});
		const reopened = await PDFDocument.load(await unlocked.arrayBuffer());
		expect(reopened.getPageCount()).toBe(1);
	});
});

describe("headless zxing", () => {
	test("writes a QR code via the default (assetBase) loader", async () => {
		const image = await writeBarcodeImage("https://qbtools.dev", {
			format: "QRCode",
			scale: 4,
		});
		expect(image.png.size).toBeGreaterThan(0);
		expect(image.svg).toContain("<svg");
	});
});
