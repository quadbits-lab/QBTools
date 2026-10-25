/** SVG rasterization through @resvg/resvg-wasm with pinned same-origin assets. */

import type { OptimizedFormat } from "../image/codecs";
import { checkAbort, type ProcessingOptions, progress } from "../processing";
import type { GraphicAssets } from "./fonts";
import { gatherFontBuffers } from "./fonts";

type ResvgModule = typeof import("@resvg/resvg-wasm");

let resvgPromise: Promise<ResvgModule> | null = null;
let wasmUrlUsed = "";

/** Initialize the resvg engine once per context (worker, window or test). */
export async function initResvg(assets?: GraphicAssets): Promise<ResvgModule> {
	const url = assets?.wasmUrl ?? "";
	if (!resvgPromise || wasmUrlUsed !== url) {
		resvgPromise = (async () => {
			if (!url && typeof document === "undefined" && typeof location === "undefined") {
				// Tests may pass a file path; a bundled worker always provides wasmUrl.
				const mod = await import("@resvg/resvg-wasm");
				const path = new URL(
					"@resvg/resvg-wasm/index_bg.wasm",
					import.meta.url,
				) as unknown as string;
				void path;
				await mod.initWasm(
					mod.initWasm.length ? ((await defaultWasm()) as never) : (undefined as never),
				);
				return mod;
			}
			const mod = await import("@resvg/resvg-wasm");
			await mod.initWasm(fetch(url));
			return mod;
		})().catch((error) => {
			resvgPromise = null;
			throw error;
		});
		wasmUrlUsed = url;
	}
	return resvgPromise;
}

async function defaultWasm(): Promise<string> {
	try {
		// Bun tests: resolve the installed wasm next to the package entry.
		return Bun.resolveSync("@resvg/resvg-wasm/index_bg.wasm", import.meta.dir);
	} catch {
		throw new Error("The SVG engine could not be initialized.");
	}
}

export interface SvgRenderRequest {
	svg: string;
	/** Target render size in CSS pixels (resvg fitTo). */
	width: number;
	height: number;
	format?: "png" | "jpeg" | "webp";
	quality?: number;
	/** Additional PNG optimization via OxiPNG. */
	optimize?: boolean;
	/** Return the rendered RGBA pixels along with the blob (monochrome masks). */
	pixels?: boolean;
	/** Font families with weights the SVG may reference. */
	families?: Array<{ family: string; weight?: number }>;
}

const MAX_EDGE = 8192;

/** Rasterize an SVG at exact dimensions and encode a Blob. */
export async function renderSvg(
	request: SvgRenderRequest,
	options: ProcessingOptions & { assets?: GraphicAssets } = {},
): Promise<{ blob: Blob; width: number; height: number; pixels?: Uint8ClampedArray }> {
	checkAbort(options.signal);
	if (request.width < 1 || request.height < 1) throw new Error("The canvas size is invalid.");
	if (Math.max(request.width, request.height) > MAX_EDGE)
		throw new Error("The longest edge cannot exceed 8192 pixels.");
	progress(options, "Rendering design…", null, "processing");
	const resvg = await initResvg(options.assets);
	checkAbort(options.signal);
	const buffers = await gatherFontBuffers(request.families ?? [], options.assets);
	const instance = new resvg.Resvg(request.svg, {
		fitTo: { mode: "width", value: request.width },
		font: { loadSystemFonts: false, fontBuffers: buffers },
	});
	try {
		const rendered = instance.render();
		let bytes: Uint8Array;
		let pixels: Uint8ClampedArray | undefined;
		const format = request.format ?? "png";
		if (format === "png" && !request.optimize) {
			if (request.pixels) pixels = new Uint8ClampedArray(rendered.pixels);
			bytes = rendered.asPng();
		} else {
			// Re-encode through the shared codecs (canvas-independent, works in workers).
			pixels = new Uint8ClampedArray(rendered.pixels);
			const { encodeImage } = await import("../image/codecs");
			const blob = await encodeImage(
				{ data: pixels, width: rendered.width, height: rendered.height } as ImageData,
				{
					...(options as {
						signal?: AbortSignal;
						onProgress?: (p: import("../processing").ProcessingProgress) => void;
					}),
					format: format as OptimizedFormat,
					quality: request.quality ?? 0.9,
					mode: request.optimize ? "optimized" : "fast",
				},
			);
			checkAbort(options.signal);
			return { blob, width: rendered.width, height: rendered.height, pixels };
		}
		checkAbort(options.signal);
		const blob = new Blob([bytes as BlobPart], { type: `image/${format}` });
		return { blob, width: rendered.width, height: rendered.height, pixels };
	} finally {
		instance.free();
	}
}

// Re-exports keep worker code importing from a single module.
export { FONT_RECORD, fontFamilyKey, gatherFontBuffers, loadFontBuffer } from "./fonts";
