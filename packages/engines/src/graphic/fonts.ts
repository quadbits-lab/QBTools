/** Font buffers for resvg and shared text-metric helpers used for layout and warnings. */

export type FontKey = "inter-400" | "inter-700" | "anton-400" | "dmmono-400" | "dmmono-500";
export const FONT_FAMILY: Record<FontKey, string> = {
	"inter-400": "Inter",
	"inter-700": "Inter",
	"anton-400": "Anton",
	"dmmono-400": "DM Mono",
	"dmmono-500": "DM Mono",
};

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
};

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
	for (const { family, weight = 400 } of families) {
		if (family === "Anton") wanted.add("anton-400");
		else if (family === "DM Mono") wanted.add(weight >= 500 ? "dmmono-500" : "dmmono-400");
		else if (family === "Inter") wanted.add(weight >= 600 ? "inter-700" : "inter-400");
	}
	return Promise.all([...wanted].map((key) => loadFontBuffer(key, assets)));
}

/**
 * Approximate average per-em advance width used for wrapping and overflow
 * hints. The same constants power engine layout and widget-side measurement.
 */
const AVERAGE_EM: Record<string, number> = { Inter: 0.535, Anton: 0.43, "DM Mono": 0.6 };
/** Extra per-em width for bold weights. */
const BOLD_EM: Record<string, number> = { Inter: 0.03, Anton: 0, "DM Mono": 0 };

export function measureTextEmWidth(family: string, weight: number): number {
	return (AVERAGE_EM[family] ?? 0.54) + (weight >= 600 ? (BOLD_EM[family] ?? 0.02) : 0);
}

export function measureTextWidth(text: string, family: string, weight: number, size: number) {
	return text.length * measureTextEmWidth(family, weight) * size;
}
