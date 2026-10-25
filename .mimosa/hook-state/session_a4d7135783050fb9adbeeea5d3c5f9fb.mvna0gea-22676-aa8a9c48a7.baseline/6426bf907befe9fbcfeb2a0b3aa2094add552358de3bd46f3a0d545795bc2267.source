import { expect, test } from "bun:test";
import { degrees, PDFArray, PDFDocument } from "pdf-lib";
import { LIMITS } from "../processing";
import {
	DEFAULT_WATERMARK,
	originForCentre,
	parseHexColor,
	stampCentres,
	WATERMARK_LIMITS,
	watermarkPdf,
} from "./watermark";

async function samplePdf(pages = 3, rotate = 0) {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pages; i++) {
		const page = doc.addPage([300, 400]);
		page.drawText(`Page ${i + 1}`, { x: 20, y: 360 });
		if (rotate) page.setRotation(degrees(rotate));
	}
	return new File([(await doc.save()) as BlobPart], "sample.pdf", { type: "application/pdf" });
}
const streams = (doc: PDFDocument, index: number) => {
	const contents = doc.getPage(index).node.Contents();
	return contents instanceof PDFArray ? contents.size() : 1;
};
const tinyPng = () =>
	new File(
		[
			Uint8Array.from(
				atob(
					"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
				),
				(c) => c.charCodeAt(0),
			),
		],
		"mark.png",
		{ type: "image/png" },
	);
test("origin places a rotated box so its centre stays put", () => {
	const o = originForCentre(100, 100, 40, 10, 90);
	expect(o.x).toBeCloseTo(105);
	expect(o.y).toBeCloseTo(80);
	const flat = originForCentre(100, 100, 40, 10, 0);
	expect(flat.x).toBeCloseTo(80);
	expect(flat.y).toBeCloseTo(95);
});
test("layouts produce one stamp or a bounded grid", () => {
	expect(stampCentres("center", 300, 400, 100, 20)).toEqual([{ x: 150, y: 200 }]);
	const tile = stampCentres("tile", 600, 800, 120, 20);
	expect(tile.length).toBeGreaterThan(4);
	expect(stampCentres("tile", 5000, 5000, 5, 1).length).toBe(WATERMARK_LIMITS.tileCap);
});
test("hex colours are parsed strictly", () => {
	expect(parseHexColor("#ff0000")).toEqual({ r: 1, g: 0, b: 0 });
	expect(() => parseHexColor("red")).toThrow("colour");
});
test("stamps every page by default and only chosen pages with ranges", async () => {
	const file = await samplePdf();
	const before = await PDFDocument.load(await file.arrayBuffer());
	const all = await watermarkPdf(file, DEFAULT_WATERMARK);
	expect(all.stamped).toBe(3);
	const allDoc = await PDFDocument.load(await all.blob.arrayBuffer());
	expect(allDoc.getPageCount()).toBe(3);
	expect([0, 1, 2].every((i) => streams(allDoc, i) > streams(before, i))).toBe(true);
	const some = await watermarkPdf(file, { ...DEFAULT_WATERMARK, pages: "2" });
	const someDoc = await PDFDocument.load(await some.blob.arrayBuffer());
	expect([0, 1, 2].map((i) => streams(someDoc, i) > streams(before, i))).toEqual([
		false,
		true,
		false,
	]);
	expect(some.stamped).toBe(1);
});
test("rotated pages and tiling still produce a valid document", async () => {
	const result = await watermarkPdf(await samplePdf(2, 90), {
		...DEFAULT_WATERMARK,
		layout: "tile",
		size: 25,
	});
	expect((await PDFDocument.load(await result.blob.arrayBuffer())).getPageCount()).toBe(2);
});
test("image watermarks embed PNGs and reject other files", async () => {
	const file = await samplePdf(1);
	const ok = await watermarkPdf(file, { ...DEFAULT_WATERMARK, kind: "image", image: tinyPng() });
	expect(ok.stamped).toBe(1);
	await expect(
		watermarkPdf(file, {
			...DEFAULT_WATERMARK,
			kind: "image",
			image: new File(["not an image"], "x.png"),
		}),
	).rejects.toThrow("PNG or JPG");
});
test("input problems give friendly errors", async () => {
	const file = await samplePdf(1);
	await expect(watermarkPdf(file, { ...DEFAULT_WATERMARK, text: "  " })).rejects.toThrow(
		"Type the watermark text",
	);
	await expect(watermarkPdf(file, { ...DEFAULT_WATERMARK, text: "你好" })).rejects.toThrow(
		"Latin letters",
	);
	await expect(watermarkPdf(file, { ...DEFAULT_WATERMARK, pages: "9" })).rejects.toThrow(
		"outside that",
	);
	await expect(watermarkPdf(new File(["not a pdf"], "x.pdf"), DEFAULT_WATERMARK)).rejects.toThrow(
		"couldn't be opened",
	);
});
test("oversized files are rejected before reading", async () => {
	const file = new File([], "big.pdf");
	Object.defineProperty(file, "size", { value: LIMITS.pdfBytes + 1 });
	file.arrayBuffer = () => {
		throw new Error("Input should not be read");
	};
	await expect(watermarkPdf(file, DEFAULT_WATERMARK)).rejects.toThrow("100 MiB");
});
