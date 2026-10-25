/** Same-origin, build-pinned asset URLs for the graphic editors (resvg + fonts). */
// prettier-ignore
import antonWoff1 from "@fontsource/anton/files/anton-latin-400-normal.woff?url";
// prettier-ignore
import antonWoff2 from "@fontsource/anton/files/anton-latin-400-normal.woff2?url";
// prettier-ignore
import bebasWoff2 from "@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2?url";
// prettier-ignore
import caveat400Woff2 from "@fontsource/caveat/files/caveat-latin-400-normal.woff2?url";
// prettier-ignore
import caveat700Woff2 from "@fontsource/caveat/files/caveat-latin-700-normal.woff2?url";
// prettier-ignore
import dmMono400Woff2 from "@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2?url";
// prettier-ignore
import dmMono500Woff2 from "@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2?url";
// prettier-ignore
import inter400Woff1 from "@fontsource/inter/files/inter-latin-400-normal.woff?url";
// prettier-ignore
import inter400Woff2 from "@fontsource/inter/files/inter-latin-400-normal.woff2?url";
// prettier-ignore
import inter700Woff1 from "@fontsource/inter/files/inter-latin-700-normal.woff?url";
// prettier-ignore
import inter700Woff2 from "@fontsource/inter/files/inter-latin-700-normal.woff2?url";
// prettier-ignore
import playfair400Woff2 from "@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2?url";
// prettier-ignore
import playfair700Woff2 from "@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2?url";
// prettier-ignore
import spaceGrotesk400Woff2 from "@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff2?url";
// prettier-ignore
import spaceGrotesk700Woff2 from "@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2?url";
import { assetBase } from "@qbtools/engines/assets";
import type { GraphicAssets } from "@qbtools/engines/graphic";

let cache: Promise<GraphicAssets> | null = null;

/**
 * Resolve once per session; every worker job receives these URLs. The resvg
 * wasm ships through the versioned same-origin /wasm manifest; fonts are
 * build-hashed assets bundled from the fontsource packages.
 */
export async function graphicAssets(): Promise<GraphicAssets> {
	if (cache) return cache;
	cache = (async () => {
		const wasmBase = await assetBase("resvg");
		return {
			wasmUrl: `${wasmBase}/index_bg.wasm`,
			fontUrls: {
				"anton-400": antonWoff2,
				"bebas-400": bebasWoff2,
				"caveat-400": caveat400Woff2,
				"caveat-700": caveat700Woff2,
				"dmmono-400": dmMono400Woff2,
				"dmmono-500": dmMono500Woff2,
				"inter-400": inter400Woff2,
				"inter-700": inter700Woff2,
				"playfair-400": playfair400Woff2,
				"playfair-700": playfair700Woff2,
				"space-grotesk-400": spaceGrotesk400Woff2,
				"space-grotesk-700": spaceGrotesk700Woff2,
			},
			pathFontUrls: {
				"anton-400": antonWoff1,
				"dmmono-400": dmMono400Woff2,
				"dmmono-500": dmMono500Woff2,
				"inter-400": inter400Woff1,
				"inter-700": inter700Woff1,
			},
		} satisfies GraphicAssets;
	})().catch((error) => {
		cache = null;
		throw error;
	});
	return cache;
}
