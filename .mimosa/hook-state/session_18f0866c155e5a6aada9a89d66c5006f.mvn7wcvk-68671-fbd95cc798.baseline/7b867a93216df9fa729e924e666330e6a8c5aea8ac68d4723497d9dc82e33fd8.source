import {
	degrees,
	type PDFFont,
	type PDFPage,
	popGraphicsState,
	pushGraphicsState,
	rgb,
	setTextRenderingMode,
	TextRenderingMode,
} from "pdf-lib";
import type { OcrWord } from "../ocr/layout";

export type PageRotation = 0 | 90 | 180 | 270;
/**
 * Map a point measured on the page as the reader sees it (points, origin top-left) to the
 * page's own coordinate space. W and H are the unrotated page width and height.
 */
export function visualToPage(rotation: PageRotation, W: number, H: number, vx: number, vy: number) {
	switch (rotation) {
		case 90:
			return { x: vy, y: vx };
		case 180:
			return { x: W - vx, y: vy };
		case 270:
			return { x: W - vy, y: H - vx };
		default:
			return { x: vx, y: H - vy };
	}
}
export const normalizeRotation = (angle: number): PageRotation => {
	const value = (((Math.round(angle / 90) * 90) % 360) + 360) % 360;
	return value === 90 || value === 180 || value === 270 ? value : 0;
};
/** Characters Helvetica (WinAnsi) can draw; anything else is dropped from the hidden layer. */
export function drawable(text: string, font: PDFFont) {
	const supported = new Set(font.getCharacterSet());
	return Array.from(text)
		.filter((char) => supported.has(char.codePointAt(0) ?? -1))
		.join("");
}
/** Font size that makes the word as wide as its box, without growing taller than the box. */
export function fitFontSize(font: PDFFont, text: string, boxWidth: number, boxHeight: number) {
	const unit = font.widthOfTextAtSize(text, 1);
	if (unit <= 0) return 0;
	return Math.min(Math.max(boxWidth / unit, 1), Math.max(boxHeight * 1.6, 2));
}
/**
 * Draw recognised words invisibly over a page so it can be searched and selected.
 * `scale` converts recognised-image pixels to points as the reader sees the page.
 */
export function addTextLayer(page: PDFPage, font: PDFFont, words: OcrWord[], scale: number) {
	const box = page.getMediaBox();
	const rotation = normalizeRotation(page.getRotation().angle);
	let drawn = 0;
	page.pushOperators(pushGraphicsState(), setTextRenderingMode(TextRenderingMode.Invisible));
	for (const word of words) {
		const text = drawable(word.text, font);
		if (!text) continue;
		const width = (word.x1 - word.x0) * scale;
		const height = (word.y1 - word.y0) * scale;
		const size = fitFontSize(font, text, width, height);
		if (size <= 0) continue;
		const baseline = visualToPage(
			rotation,
			box.width,
			box.height,
			word.x0 * scale,
			word.y1 * scale - height * 0.15,
		);
		page.drawText(text, {
			x: box.x + baseline.x,
			y: box.y + baseline.y,
			size,
			font,
			color: rgb(0, 0, 0),
			rotate: degrees(rotation),
		});
		drawn++;
	}
	page.pushOperators(popGraphicsState());
	return drawn;
}
