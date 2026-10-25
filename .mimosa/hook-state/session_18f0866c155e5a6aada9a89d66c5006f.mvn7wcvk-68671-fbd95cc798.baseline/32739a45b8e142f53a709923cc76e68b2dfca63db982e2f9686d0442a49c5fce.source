import { assetBase } from "../assets";
import { checkAbort, checkImageSize, type ProcessingOptions, progress } from "../processing";
export type OptimizedFormat = "jpeg" | "png" | "webp" | "avif";
export type EncodingMode = "fast" | "optimized";
export interface ImageEncodeOptions extends ProcessingOptions {
	format: OptimizedFormat;
	quality?: number;
	mode?: EncodingMode;
}
const ready = new Map<string, Promise<void>>();
async function initialize(key: string, load: () => Promise<void>) {
	if (!ready.has(key))
		ready.set(
			key,
			load().catch((e) => {
				ready.delete(key);
				throw e;
			}),
		);
	await ready.get(key);
}
/** Called inside the tool-owned worker. Only single-threaded encoders are imported. */
export async function encodeImage(data: ImageData, options: ImageEncodeOptions): Promise<Blob> {
	checkAbort(options.signal);
	if (options.mode === "fast" && options.format !== "avif") {
		progress(options, "Encoding image…");
		let blob: Blob;
		if (typeof OffscreenCanvas !== "undefined") {
			const canvas = new OffscreenCanvas(data.width, data.height);
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Canvas is unavailable.");
			ctx.putImageData(data, 0, 0);
			blob = await canvas.convertToBlob({
				type: `image/${options.format}`,
				quality: options.quality ?? 0.9,
			});
		} else if (typeof document !== "undefined") {
			const canvas = document.createElement("canvas");
			canvas.width = data.width;
			canvas.height = data.height;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Canvas is unavailable.");
			ctx.putImageData(data, 0, 0);
			const { encodeCanvas } = await import("./index");
			blob = await encodeCanvas(canvas, options.format, options.quality);
		} else throw new Error("Native image encoding needs canvas support.");
		checkAbort(options.signal);
		if (blob.type !== `image/${options.format}`)
			throw new Error(
				`Native ${options.format.toUpperCase()} encoding is unavailable. Try Optimized mode.`,
			);
		return blob;
	}
	checkImageSize(data.width, data.height);
	progress(options, "Loading image encoder…", null, "loading");
	const q = Math.round(Math.min(1, Math.max(0, options.quality ?? 0.9)) * 100);
	let bytes: ArrayBuffer | Uint8Array;
	if (options.format === "jpeg") {
		const { default: encode, init } = await import("@jsquash/jpeg/encode.js");
		await initialize("jpeg", async () => {
			const base = await assetBase("jpeg");
			await init({ locateFile: (name: string) => `${base}/${name}` });
		});
		progress(options, "Encoding JPEG…");
		bytes = await encode(data, { quality: q });
	} else if (options.format === "webp") {
		const { default: encode, init } = await import("@jsquash/webp/encode.js");
		await initialize("webp", async () => {
			const base = await assetBase("webp");
			await init({ locateFile: (name: string) => `${base}/${name}` });
		});
		progress(options, "Encoding WebP…");
		bytes = await encode(data, { quality: q });
	} else if (options.format === "avif") {
		const { default: create } = await import("@jsquash/avif/codec/enc/avif_enc.js");
		const { defaultOptions } = await import("@jsquash/avif/meta.js");
		avifModule ??= assetBase("avif")
			.then((base) => create({ locateFile: (name: string) => `${base}/${name}` }))
			.catch((e) => {
				avifModule = null;
				throw e;
			});
		const module = await avifModule;
		progress(options, "Encoding AVIF…");
		const encoded = module.encode(new Uint8Array(data.data.buffer), data.width, data.height, {
			...defaultOptions,
			quality: q,
		});
		if (!encoded) throw new Error("AVIF encoding failed.");
		bytes = encoded.slice();
	} else {
		const { default: init, optimise_raw } = await import(
			"@jsquash/oxipng/codec/pkg/squoosh_oxipng.js"
		);
		await initialize("png", async () => {
			await init(`${await assetBase("png")}/squoosh_oxipng_bg.wasm`);
		});
		progress(options, "Optimizing PNG…");
		bytes = optimise_raw(data.data, data.width, data.height, 2, false, false).slice();
	}
	checkAbort(options.signal);
	const blob = new Blob([bytes as BlobPart], { type: `image/${options.format}` });
	if (!blob.size) throw new Error("The image encoder produced an empty file.");
	return blob;
}
let avifModule: Promise<import("@jsquash/avif/codec/enc/avif_enc.js").AVIFModule> | null = null;
