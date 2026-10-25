import { expect, test } from "bun:test";
import {
	decodePDFRawStream,
	degrees,
	PDFArray,
	PDFDocument,
	PDFRawStream,
	StandardFonts,
} from "pdf-lib";
import { flattenWords } from "../ocr/layout";
import { addTextLayer, drawable, fitFontSize, normalizeRotation, visualToPage } from "./text-layer";

test("flattening keeps reading order and drops empty or degenerate words", () => {
	const words = flattenWords([
		{
			paragraphs: [
				{
					lines: [
						{
							words: [
								{ text: " Hello ", confidence: 90, bbox: { x0: 1, y0: 2, x1: 30, y1: 12 } },
								{ text: "  ", confidence: 90, bbox: { x0: 31, y0: 2, x1: 40, y1: 12 } },
								{ text: "flat", confidence: 90, bbox: { x0: 5, y0: 5, x1: 5, y1: 9 } },
								{ text: "world", confidence: 80, bbox: { x0: 35, y0: 2, x1: 70, y1: 12 } },
							],
						},
					],
				},
			],
		},
	]);
	expect(words.map((w) => w.text)).toEqual(["Hello", "world"]);
	expect(flattenWords(null)).toEqual([]);
});
test("visual points map to page space for every rotation", () => {
	expect(visualToPage(0, 300, 400, 10, 20)).toEqual({ x: 10, y: 380 });
	expect(visualToPage(90, 300, 400, 10, 20)).toEqual({ x: 20, y: 10 });
	expect(visualToPage(180, 300, 400, 10, 20)).toEqual({ x: 290, y: 20 });
	expect(visualToPage(270, 300, 400, 10, 20)).toEqual({ x: 280, y: 390 });
	// The visual top-left shows a different page corner for each rotation.
	expect(visualToPage(90, 300, 400, 0, 0)).toEqual({ x: 0, y: 0 });
	expect(visualToPage(180, 300, 400, 0, 0)).toEqual({ x: 300, y: 0 });
	expect(visualToPage(270, 300, 400, 0, 0)).toEqual({ x: 300, y: 400 });
});
test("rotations are normalised to quarter turns", () => {
	expect([0, 90, 180, 270, 360, -90, 450].map(normalizeRotation)).toEqual([
		0, 90, 180, 270, 0, 270, 90,
	]);
});
test("fonts drop unsupported characters and fit words to their boxes", async () => {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	expect(drawable("café 你好", font)).toBe("café ");
	expect(drawable("你好", font)).toBe("");
	const size = fitFontSize(font, "Hello", 60, 20);
	expect(font.widthOfTextAtSize("Hello", size)).toBeCloseTo(60, 0);
	expect(fitFontSize(font, "i", 500, 10)).toBeLessThanOrEqual(16);
});
test("the text layer is written invisibly and survives a save", async () => {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const page = doc.addPage([300, 400]);
	page.setRotation(degrees(90));
	const drawn = addTextLayer(
		page,
		font,
		[
			{ text: "Invoice", x0: 10, y0: 10, x1: 80, y1: 30, confidence: 95 },
			{ text: "你好", x0: 90, y0: 10, x1: 130, y1: 30, confidence: 90 },
			{ text: "total", x0: 140, y0: 10, x1: 190, y1: 30, confidence: 90 },
		],
		1,
	);
	expect(drawn).toBe(2);
	const loaded = await PDFDocument.load(await doc.save());
	const contents = loaded.getPage(0).node.Contents();
	const refs = contents instanceof PDFArray ? contents.asArray() : [];
	const streams = refs
		.map((ref) => loaded.context.lookup(ref))
		.filter((object): object is PDFRawStream => object instanceof PDFRawStream);
	const source = streams
		.map((stream) => new TextDecoder().decode(decodePDFRawStream(stream).decode()))
		.join("\n");
	expect(source).toContain("3 Tr");
	expect(source.match(/Tj/g)).toHaveLength(2);
});
