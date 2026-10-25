import { degrees, PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import { checkAbort, LIMITS, type ProcessingOptions, progress } from "../processing";
import { parsePageRanges } from "./ranges";

export interface WatermarkSettings {
	kind: "text" | "image";
	text: string;
	image: File | null;
	layout: "center" | "tile";
	/** 0.05–1 */
	opacity: number;
	/** Degrees counter-clockwise as the reader sees the page, -90–90. */
	rotation: number;
	/** Watermark width as a percentage of the page width, 5–100. */
	size: number;
	/** #rrggbb, text only. */
	color: string;
	/** Page ranges like "1-3, 5". Empty stamps every page. */
	pages: string;
}
export const DEFAULT_WATERMARK: WatermarkSettings = {
	kind: "text",
	text: "CONFIDENTIAL",
	image: null,
	layout: "center",
	opacity: 0.25,
	rotation: 45,
	size: 70,
	color: "#b91c1c",
	pages: "",
};
export const WATERMARK_LIMITS = { textLength: 80, imageBytes: 10 * 1024 ** 2, tileCap: 300 };
export interface WatermarkedPdf {
	blob: Blob;
	stamped: number;
	pageCount: number;
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export function parseHexColor(hex: string) {
	const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!match?.[1]) throw new Error("Choose a colour like #b91c1c.");
	const value = Number.parseInt(match[1], 16);
	return { r: (value >> 16) / 255, g: ((value >> 8) & 255) / 255, b: (value & 255) / 255 };
}
/** Where the bottom-left corner of a w×h box lands when the box is centred on (cx, cy) and rotated. */
export function originForCentre(cx: number, cy: number, w: number, h: number, degreesCcw: number) {
	const t = (degreesCcw * Math.PI) / 180;
	const dx = (w / 2) * Math.cos(t) - (h / 2) * Math.sin(t);
	const dy = (w / 2) * Math.sin(t) + (h / 2) * Math.cos(t);
	return { x: cx - dx, y: cy - dy };
}
/** Centres for one stamp, or a staggered grid covering the page. */
export function stampCentres(
	layout: "center" | "tile",
	width: number,
	height: number,
	stampW: number,
	stampH: number,
) {
	if (layout === "center") return [{ x: width / 2, y: height / 2 }];
	const stepX = stampW * 1.5;
	const stepY = Math.max(stampH * 3, stampW * 0.6);
	const centres: { x: number; y: number }[] = [];
	for (let row = 0, y = stepY / 2; y < height + stepY; row++, y += stepY) {
		for (let x = (row % 2 ? stepX / 2 : 0) + stepX / 4; x < width + stepX; x += stepX) {
			if (centres.length >= WATERMARK_LIMITS.tileCap) return centres;
			centres.push({ x, y });
		}
	}
	return centres;
}
async function loadDocument(file: File) {
	try {
		return await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
	} catch (error) {
		throw new Error(
			String(error).toLowerCase().includes("encrypt")
				? "This PDF is password-protected. Unlock it with the Protect PDF tool first."
				: "This PDF couldn't be opened. It may be damaged.",
		);
	}
}
function textWidth(font: PDFFont, text: string, size: number) {
	try {
		return font.widthOfTextAtSize(text, size);
	} catch {
		throw new Error("Watermark text supports Latin letters, digits and common punctuation only.");
	}
}
function stampPage(
	page: PDFPage,
	settings: WatermarkSettings,
	draw:
		| { kind: "text"; font: PDFFont }
		| { kind: "image"; image: Awaited<ReturnType<typeof embed>> },
) {
	const box = page.getMediaBox();
	const pageRotation = page.getRotation().angle;
	// /Rotate turns the page clockwise for the reader, so compensate to keep the stamp upright.
	const angle = settings.rotation + pageRotation;
	const visualWidth = pageRotation % 180 === 0 ? box.width : box.height;
	const targetWidth = (visualWidth * settings.size) / 100;
	if (draw.kind === "text") {
		const unit = textWidth(draw.font, settings.text, 1);
		const fontSize = targetWidth / unit;
		const w = textWidth(draw.font, settings.text, fontSize);
		const h = draw.font.heightAtSize(fontSize, { descender: false });
		const { r, g, b } = parseHexColor(settings.color);
		for (const c of stampCentres(settings.layout, box.width, box.height, w, h)) {
			const origin = originForCentre(box.x + c.x, box.y + c.y, w, h, angle);
			page.drawText(settings.text, {
				x: origin.x,
				y: origin.y,
				size: fontSize,
				font: draw.font,
				color: rgb(r, g, b),
				opacity: settings.opacity,
				rotate: degrees(angle),
			});
		}
		return;
	}
	const w = targetWidth;
	const h = (draw.image.height / draw.image.width) * w;
	for (const c of stampCentres(settings.layout, box.width, box.height, w, h)) {
		const origin = originForCentre(box.x + c.x, box.y + c.y, w, h, angle);
		page.drawImage(draw.image, {
			x: origin.x,
			y: origin.y,
			width: w,
			height: h,
			opacity: settings.opacity,
			rotate: degrees(angle),
		});
	}
}
async function embed(doc: PDFDocument, file: File) {
	const bytes = new Uint8Array(await file.arrayBuffer());
	const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
	const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
	if (!isPng && !isJpg) throw new Error("Use a PNG or JPG image for the watermark.");
	return isPng ? doc.embedPng(bytes) : doc.embedJpg(bytes);
}
export async function watermarkPdf(
	file: File,
	input: WatermarkSettings,
	options: ProcessingOptions = {},
): Promise<WatermarkedPdf> {
	if (file.size > LIMITS.pdfBytes) throw new Error("This tool supports PDFs up to 100 MiB.");
	const settings = {
		...input,
		opacity: clamp(input.opacity, 0.05, 1),
		rotation: clamp(input.rotation, -90, 90),
		size: clamp(input.size, 5, 100),
		text: input.text.trim(),
	};
	if (settings.kind === "text") {
		if (!settings.text) throw new Error("Type the watermark text.");
		if (settings.text.length > WATERMARK_LIMITS.textLength)
			throw new Error(`Use ${WATERMARK_LIMITS.textLength} characters or fewer.`);
		parseHexColor(settings.color);
	} else {
		if (!settings.image) throw new Error("Choose a watermark image.");
		if (settings.image.size > WATERMARK_LIMITS.imageBytes)
			throw new Error("Use a watermark image under 10 MiB.");
	}
	progress(options, "Reading PDF…", null, "loading");
	const doc = await loadDocument(file);
	const indexes = settings.pages.trim()
		? parsePageRanges(settings.pages, doc.getPageCount())
		: doc.getPageIndices();
	const draw =
		settings.kind === "text"
			? { kind: "text" as const, font: await doc.embedFont(StandardFonts.HelveticaBold) }
			: { kind: "image" as const, image: await embed(doc, settings.image as File) };
	if (draw.kind === "text") textWidth(draw.font, settings.text, 1);
	const pages = doc.getPages();
	for (const [done, index] of indexes.entries()) {
		checkAbort(options.signal);
		const page = pages[index];
		if (page) stampPage(page, settings, draw);
		progress(
			options,
			`Stamping page ${done + 1} of ${indexes.length}`,
			(done + 1) / indexes.length,
		);
	}
	doc.setProducer("QBTools");
	const bytes = await doc.save();
	return {
		blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
		stamped: indexes.length,
		pageCount: pages.length,
	};
}
