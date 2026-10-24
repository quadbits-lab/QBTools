/** Convert initials/text artwork into glyph path markup (vector, self-contained). */
import { checkAbort, type ProcessingOptions } from "../processing";
import type { FontKey, GraphicAssets } from "./fonts";

// opentype.js is plain JS and parses WOFF v1 buffers.
let ot: typeof import("opentype.js") | null = null;
async function getOpentype() {
	ot ??= (await import("opentype.js")).default;
	return ot;
}

interface CachedFont {
	key: string;
	font: import("opentype.js").Font;
}
const fontCache = new Map<string, Promise<CachedFont>>();

function fontKeyFor(family: string, weight: number): FontKey {
	if (family === "Anton") return "anton-400";
	if (family === "DM Mono") return weight >= 500 ? "dmmono-500" : "dmmono-400";
	return weight >= 600 ? "inter-700" : "inter-400";
}

async function loadFont(key: FontKey, assets?: GraphicAssets): Promise<import("opentype.js").Font> {
	const cached = fontCache.get(key);
	if (cached) return (await cached).font;
	const url = assets?.pathFontUrls?.[key];
	if (!url) throw new Error("Text conversion assets are unavailable.");
	const promise = (async () => {
		const buffer = await (await fetch(url)).arrayBuffer();
		const lib = await getOpentype();
		return { key, font: lib.parse(buffer) };
	})().catch((error) => {
		fontCache.delete(key);
		throw new Error("The font for text conversion could not be loaded.");
	});
	fontCache.set(key, promise);
	return (await promise).font;
}

export interface TextPathResult {
	/** SVG markup sized to the glyphs, ready to nest or embed. */
	svg: string;
	width: number;
	height: number;
}

/** Render short text (favicons: initials) as outline paths using real font metrics. */
export async function textToPathSvg(
	text: string,
	options: {
		family: string;
		weight: number;
		size: number;
		color: string;
		letterSpacing?: number;
	},
	assets?: GraphicAssets,
	processing?: ProcessingOptions,
): Promise<TextPathResult> {
	checkAbort(processing?.signal);
	const key = fontKeyFor(options.family, options.weight);
	const font = await loadFont(key, assets);
	const size = options.size;
	const tracking = options.letterSpacing ?? 0;
	const glyphs = [...text];
	let x = 0;
	const paths: string[] = [];
	for (const ch of glyphs) {
		const glyph = font.charToGlyph(ch);
		if (!glyph) continue;
		const path = glyph.getPath(x, 0, size);
		const d = path.toPathData(2);
		if (d) paths.push(`<path d="${d}" fill="${options.color}"/>`);
		x += (glyph.advanceWidth ?? font.unitsPerEm) * (size / font.unitsPerEm) + tracking;
	}
	const width = Math.max(1, Math.round(text.length ? x - tracking : size));
	const height = size;
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
		paths.join("") +
		`</svg>`;
	return { svg, width, height };
}
