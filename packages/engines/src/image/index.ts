import { isHeic } from "../files";

export type ImageFormat = "jpeg" | "png" | "webp";

export const FORMAT_EXT: Record<ImageFormat, string> = { jpeg: "jpg", png: "png", webp: "webp" };
export const FORMAT_MIME: Record<ImageFormat, string> = {
	jpeg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",
};

export function formatFromMime(mime: string): ImageFormat {
	if (mime.includes("png")) return "png";
	if (mime.includes("webp")) return "webp";
	return "jpeg";
}

/** Some browsers (older Safari) silently fall back to PNG for WebP encodes. */
let webpSupport: boolean | undefined;
export async function canEncodeWebp(): Promise<boolean> {
	if (webpSupport !== undefined) return webpSupport;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 1;
	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp"));
	webpSupport = blob?.type === "image/webp";
	return webpSupport;
}

/** Decode any supported image (incl. iPhone HEIC) with EXIF orientation applied. */
export async function decodeImage(file: Blob & { name?: string }): Promise<ImageBitmap> {
	let source: Blob = file;
	if (file instanceof File && isHeic(file)) {
		const { default: heic2any } = await import("heic2any");
		const converted = await heic2any({ blob: file, toType: "image/png" });
		source = Array.isArray(converted) ? (converted[0] as Blob) : converted;
	}
	try {
		return await createImageBitmap(source, { imageOrientation: "from-image" });
	} catch {
		throw new Error(
			"This image couldn't be opened. It may be damaged or in an unsupported format.",
		);
	}
}

export interface DrawOptions {
	width: number;
	height: number;
	fit?: "stretch" | "contain" | "cover";
	/** Fill color behind the image (needed for JPEG, which has no transparency). */
	background?: string;
}

/** Draw a bitmap into a new canvas at the target size with high-quality resampling. */
export async function drawToCanvas(
	bitmap: ImageBitmap,
	options: DrawOptions,
): Promise<HTMLCanvasElement> {
	const { width, height, fit = "stretch", background } = options;
	let sx = 0;
	let sy = 0;
	let sw = bitmap.width;
	let sh = bitmap.height;
	let dx = 0;
	let dy = 0;
	let dw = width;
	let dh = height;

	if (fit === "cover") {
		const scale = Math.max(width / sw, height / sh);
		const cropW = width / scale;
		const cropH = height / scale;
		sx = (sw - cropW) / 2;
		sy = (sh - cropH) / 2;
		sw = cropW;
		sh = cropH;
	} else if (fit === "contain") {
		const scale = Math.min(width / sw, height / sh);
		dw = Math.round(sw * scale);
		dh = Math.round(sh * scale);
		dx = Math.round((width - dw) / 2);
		dy = Math.round((height - dh) / 2);
	}

	// Crop first at full resolution, then resample with pica (Lanczos).
	const crop = document.createElement("canvas");
	crop.width = Math.max(1, Math.round(sw));
	crop.height = Math.max(1, Math.round(sh));
	crop.getContext("2d")?.drawImage(bitmap, sx, sy, sw, sh, 0, 0, crop.width, crop.height);

	const resized = document.createElement("canvas");
	resized.width = Math.max(1, dw);
	resized.height = Math.max(1, dh);
	if (resized.width === crop.width && resized.height === crop.height) {
		resized.getContext("2d")?.drawImage(crop, 0, 0);
	} else {
		const { default: Pica } = await import("pica");
		await Pica({ features: ["js", "wasm", "cib"] }).resize(crop, resized, { filter: "lanczos3" });
	}

	const out = document.createElement("canvas");
	out.width = Math.max(1, width);
	out.height = Math.max(1, height);
	const ctx = out.getContext("2d");
	if (!ctx) throw new Error("Canvas isn't available in this browser.");
	if (background) {
		ctx.fillStyle = background;
		ctx.fillRect(0, 0, out.width, out.height);
	}
	ctx.drawImage(resized, dx, dy);
	return out;
}

export function encodeCanvas(
	canvas: HTMLCanvasElement,
	format: ImageFormat,
	quality = 0.9,
): Promise<Blob> {
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error("Couldn't save the image."))),
			FORMAT_MIME[format],
			format === "png" ? undefined : quality,
		),
	);
}

export interface CompressResult {
	blob: Blob;
	quality: number;
	width: number;
	height: number;
	/** False when even the smallest settings couldn't reach the target. */
	reachedTarget: boolean;
}

/**
 * Find the highest quality whose output fits `targetBytes` (binary search),
 * shrinking dimensions when quality alone can't get there.
 */
export async function compressToTarget(
	bitmap: ImageBitmap,
	options: {
		targetBytes: number;
		format: Exclude<ImageFormat, "png">;
		allowResize: boolean;
		background?: string;
	},
): Promise<CompressResult> {
	const { targetBytes, format, allowResize, background = "#ffffff" } = options;
	let width = bitmap.width;
	let height = bitmap.height;

	for (let attempt = 0; attempt < 6; attempt++) {
		const canvas = await drawToCanvas(bitmap, {
			width,
			height,
			background: format === "jpeg" ? background : undefined,
		});
		let lo = 0.05;
		let hi = 0.95;
		let best: Blob | null = null;
		let bestQ = lo;
		for (let i = 0; i < 8; i++) {
			const q = (lo + hi) / 2;
			const blob = await encodeCanvas(canvas, format, q);
			if (blob.size <= targetBytes) {
				best = blob;
				bestQ = q;
				lo = q;
			} else {
				hi = q;
			}
		}
		if (!best) {
			const floor = await encodeCanvas(canvas, format, 0.05);
			if (floor.size <= targetBytes) {
				best = floor;
				bestQ = 0.05;
			} else if (!allowResize || Math.max(width, height) < 64) {
				return { blob: floor, quality: 0.05, width, height, reachedTarget: false };
			} else {
				// Size scales roughly with pixel count; aim a little under.
				const factor = Math.max(0.3, Math.sqrt(targetBytes / floor.size) * 0.9);
				width = Math.round(width * factor);
				height = Math.round(height * factor);
				continue;
			}
		}
		return { blob: best, quality: bestQ, width, height, reachedTarget: true };
	}
	const canvas = await drawToCanvas(bitmap, { width, height, background });
	const blob = await encodeCanvas(canvas, format, 0.05);
	return { blob, quality: 0.05, width, height, reachedTarget: blob.size <= targetBytes };
}

/** Shrink (never enlarge) to fit within maxW × maxH, keeping aspect ratio. */
export function scaleToFit(srcW: number, srcH: number, maxW?: number, maxH?: number) {
	const scale = Math.min(maxW ? maxW / srcW : 1, maxH ? maxH / srcH : 1, 1);
	return {
		width: Math.max(1, Math.round(srcW * scale)),
		height: Math.max(1, Math.round(srcH * scale)),
	};
}

/** Composite an RGBA cut-out over a solid color (or keep transparent). */
export function compositeOn(
	cutout: HTMLCanvasElement,
	background: string | null,
): HTMLCanvasElement {
	const out = document.createElement("canvas");
	out.width = cutout.width;
	out.height = cutout.height;
	const ctx = out.getContext("2d");
	if (!ctx) return cutout;
	if (background) {
		ctx.fillStyle = background;
		ctx.fillRect(0, 0, out.width, out.height);
	}
	ctx.drawImage(cutout, 0, 0);
	return out;
}
