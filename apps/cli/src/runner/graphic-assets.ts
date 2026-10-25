/**
 * Graphic assets for headless rendering: font files resolved from the CLI's
 * own @fontsource dependencies (mirrors graphic.test.ts, which points at
 * apps/web's copies). resvg's wasm self-resolves headlessly via initResvg.
 */

import type { GraphicAssets } from "@qbtools/engines/graphic";

function fontUrl(provider: "@fontsource" | (string & {}), name: string, file: string): string {
	const spec = `${provider}/${name}/files/${file}`;
	const path = Bun.resolveSync(spec, import.meta.dir);
	return `file://${path}`;
}

const FONTS: Array<[string, string, string]> = [
	["inter-400", "inter", "inter-latin-400-normal.woff2"],
	["inter-700", "inter", "inter-latin-700-normal.woff2"],
	["anton-400", "anton", "anton-latin-400-normal.woff2"],
	["dmmono-400", "dm-mono", "dm-mono-latin-400-normal.woff2"],
	["dmmono-500", "dm-mono", "dm-mono-latin-500-normal.woff2"],
	["bebas-400", "bebas-neue", "bebas-neue-latin-400-normal.woff2"],
	["caveat-400", "caveat", "caveat-latin-400-normal.woff2"],
	["caveat-700", "caveat", "caveat-latin-700-normal.woff2"],
	["playfair-400", "playfair-display", "playfair-display-latin-400-normal.woff2"],
	["playfair-700", "playfair-display", "playfair-display-latin-700-normal.woff2"],
	["space-grotesk-400", "space-grotesk", "space-grotesk-latin-400-normal.woff2"],
	["space-grotesk-700", "space-grotesk", "space-grotesk-latin-700-normal.woff2"],
];

export const CLI_GRAPHIC_ASSETS: GraphicAssets = {
	fontUrls: Object.fromEntries(
		FONTS.map(([key, name, file]) => [key, fontUrl("@fontsource", name, file)]),
	),
	// opentype.js glyph paths need WOFF v1 (inter-700)
	pathFontUrls: {
		"inter-700": fontUrl("@fontsource", "inter", "inter-latin-700-normal.woff"),
	},
	// resvg's own headless branch hands fetch() a bare fs path, which Bun
	// rejects; an explicit file:// wasmUrl takes the working fetch branch.
	wasmUrl: `file://${Bun.resolveSync("@resvg/resvg-wasm/index_bg.wasm", import.meta.dir)}`,
};
