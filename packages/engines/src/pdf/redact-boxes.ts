import { LIMITS } from "../processing";

/** A rectangle as fractions (0–1) of the page as the reader sees it, origin top-left. */
export interface RedactionBox {
	/** Zero-based page index. */
	page: number;
	x: number;
	y: number;
	width: number;
	height: number;
}
/** Smallest accepted box edge, as a fraction of the page. Smaller drags are accidental clicks. */
export const MIN_BOX = 0.005;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Clip a box to its page; null when nothing usable is left. */
export function normalizeBox(box: RedactionBox): RedactionBox | null {
	const values = [box.x, box.y, box.width, box.height];
	if (values.some((value) => !Number.isFinite(value))) return null;
	const x = clamp(box.width < 0 ? box.x + box.width : box.x);
	const y = clamp(box.height < 0 ? box.y + box.height : box.y);
	const right = clamp(Math.max(box.x, box.x + box.width));
	const bottom = clamp(Math.max(box.y, box.y + box.height));
	const width = right - x;
	const height = bottom - y;
	if (width < MIN_BOX || height < MIN_BOX) return null;
	return { page: box.page, x, y, width, height };
}
/** Validate against the document and group by page. Throws friendly errors. */
export function groupBoxesByPage(boxes: RedactionBox[], pageCount: number) {
	if (boxes.length === 0) throw new Error("Draw at least one redaction box.");
	if (boxes.length > LIMITS.redactBoxes)
		throw new Error(`Use ${LIMITS.redactBoxes} redaction boxes or fewer.`);
	const byPage = new Map<number, RedactionBox[]>();
	for (const box of boxes) {
		if (!Number.isInteger(box.page) || box.page < 0 || box.page >= pageCount)
			throw new Error("A redaction box points at a page that doesn't exist.");
		const clean = normalizeBox(box);
		if (!clean) continue;
		byPage.set(box.page, [...(byPage.get(box.page) ?? []), clean]);
	}
	if (byPage.size === 0) throw new Error("Draw at least one redaction box.");
	return byPage;
}
/** Pixel rectangle on a rendered page, grown a little so anti-aliased glyph edges are covered. */
export function boxToPixels(box: RedactionBox, width: number, height: number, pad = 2) {
	const x = Math.max(0, Math.floor(box.x * width) - pad);
	const y = Math.max(0, Math.floor(box.y * height) - pad);
	const right = Math.min(width, Math.ceil((box.x + box.width) * width) + pad);
	const bottom = Math.min(height, Math.ceil((box.y + box.height) * height) + pad);
	return { x, y, width: right - x, height: bottom - y };
}
