/** Same-origin, build-pinned asset URLs for the graphic editors (resvg + fonts). */
// prettier-ignore

// prettier-ignore
import antonWoff1 from "@fontsource/anton/files/anton-latin-400-normal.woff?url";
import antonWoff2 from "@fontsource/anton/files/anton-latin-400-normal.woff2?url";
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
import type { GraphicAssets } from "@qbtools/engines/graphic";
// prettier-ignore
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm?url";

let cache: GraphicAssets | null = null;

/** Resolve once per session; every worker job receives these URLs. */
export function graphicAssets(): GraphicAssets {
	return (cache ??= {
		wasmUrl: resvgWasm,
		fontUrls: {
			"anton-400": antonWoff2,
			"dmmono-400": dmMono400Woff2,
			"dmmono-500": dmMono500Woff2,
			"inter-400": inter400Woff2,
			"inter-700": inter700Woff2,
		},
		pathFontUrls: {
			"anton-400": antonWoff1,
			"dmmono-400": dmMono400Woff2,
			"dmmono-500": dmMono500Woff2,
			"inter-400": inter400Woff1,
			"inter-700": inter700Woff1,
		},
	});
}
