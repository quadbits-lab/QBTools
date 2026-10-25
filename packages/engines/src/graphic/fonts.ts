/** Font buffers for resvg and shared text-metric helpers used for layout and warnings. */
import type { TextFont } from "./types";

export type FontKey =
	| "inter-400"
	| "inter-700"
	| "anton-400"
	| "dmmono-400"
	| "dmmono-500"
	| "bebas-400"
	| "space-grotesk-400"
	| "space-grotesk-700"
	| "playfair-400"
	| "playfair-700"
	| "caveat-400"
	| "caveat-700";

export const FONT_FAMILY: Record<FontKey, string> = {
	"inter-400": "Inter",
	"inter-700": "Inter",
	"anton-400": "Anton",
	"dmmono-400": "DM Mono",
	"dmmono-500": "DM Mono",
	"bebas-400": "Bebas Neue",
	"space-grotesk-400": "Space Grotesk",
	"space-grotesk-700": "Space Grotesk",
	"playfair-400": "Playfair Display",
	"playfair-700": "Playfair Display",
	"caveat-400": "Caveat",
	"caveat-700": "Caveat",
};

/** Families offered by text controls; loaded buffers cover every entry. */
export const TEXT_FONTS: TextFont[] = [
	"Inter",
	"Space Grotesk",
	"Anton",
	"Bebas Neue",
	"Playfair Display",
	"DM Mono",
	"Caveat",
];

export interface GraphicAssets {
	/** Same-origin URLs for all font buffers, keyed by FontKey (woff2). */
	fontUrls?: Partial<Record<FontKey, string>>;
	/** Same-origin URL of the resvg wasm module. */
	wasmUrl?: string;
	/** WOFF (v1) URLs used only for text→path conversion via opentype.js. */
	pathFontUrls?: Partial<Record<FontKey, string>>;
}

type FontRecord = { family: string; weight: number };
export const FONT_RECORD: Record<FontKey, FontRecord> = {
	"inter-400": { family: "Inter", weight: 400 },
	"inter-700": { family: "Inter", weight: 700 },
	"anton-400": { family: "Anton", weight: 400 },
	"dmmono-400": { family: "DM Mono", weight: 400 },
	"dmmono-500": { family: "DM Mono", weight: 500 },
	"bebas-400": { family: "Bebas Neue", weight: 400 },
	"space-grotesk-400": { family: "Space Grotesk", weight: 400 },
	"space-grotesk-700": { family: "Space Grotesk", weight: 700 },
	"playfair-400": { family: "Playfair Display", weight: 400 },
	"playfair-700": { family: "Playfair Display", weight: 700 },
	"caveat-400": { family: "Caveat", weight: 400 },
	"caveat-700": { family: "Caveat", weight: 700 },
};

/** Resolve the buffer key for a family at a weight (nearest supported step). */
export function fontFamilyKey(family: string, weight: number): FontKey {
	switch (family) {
		case "Anton":
			return "anton-400";
		case "DM Mono":
			return weight >= 500 ? "dmmono-500" : "dmmono-400";
		case "Bebas Neue":
			return "bebas-400";
		case "Space Grotesk":
			return weight >= 600 ? "space-grotesk-700" : "space-grotesk-400";
		case "Playfair Display":
			return weight >= 600 ? "playfair-700" : "playfair-400";
		case "Caveat":
			return weight >= 600 ? "caveat-700" : "caveat-400";
		default:
			return weight >= 600 ? "inter-700" : "inter-400";
	}
}

const cache = new Map<FontKey, Uint8Array>();

/** Fetch and cache a font buffer. */
export async function loadFontBuffer(
	key: FontKey,
	assets?: { fontUrls?: Partial<Record<FontKey, string>> },
): Promise<Uint8Array> {
	const cached = cache.get(key);
	if (cached) return cached;
	const url = assets?.fontUrls?.[key];
	if (!url) throw new Error("Font assets are unavailable for this tool.");
	const buffer = new Uint8Array(await (await fetch(url)).arrayBuffer());
	cache.set(key, buffer);
	return buffer;
}

/** Buffers for one or more families used in the SVG below. */
export async function gatherFontBuffers(
	families: Iterable<{ family: string; weight?: number }>,
	assets?: { fontUrls?: Partial<Record<FontKey, string>> },
): Promise<Uint8Array[]> {
	const wanted = new Set<FontKey>();
	for (const { family, weight = 400 } of families) wanted.add(fontFamilyKey(family, weight));
	return Promise.all([...wanted].map((key) => loadFontBuffer(key, assets)));
}

/**
 * Approximate average per-em advance width used for wrapping and overflow
 * hints. The same constants power engine layout and widget-side measurement.
 */
const AVERAGE_EM: Record<string, number> = {
	Inter: 0.535,
	Anton: 0.43,
	"DM Mono": 0.6,
	"Bebas Neue": 0.38,
	"Space Grotesk": 0.55,
	"Playfair Display": 0.52,
	Caveat: 0.42,
};
/** Extra per-em width for bold weights. */
const BOLD_EM: Record<string, number> = {
	Inter: 0.03,
	Anton: 0,
	"DM Mono": 0,
	"Bebas Neue": 0,
	"Space Grotesk": 0.03,
	"Playfair Display": 0.03,
	Caveat: 0.02,
};

export function measureTextEmWidth(family: string, weight: number): number {
	return (AVERAGE_EM[family] ?? 0.54) + (weight >= 600 ? (BOLD_EM[family] ?? 0.02) : 0);
}

export function measureTextWidth(text: string, family: string, weight: number, size: number) {
	return text.length * measureTextEmWidth(family, weight) * size;
}
