/**
 * Optional sharp integration: the three canvas-bound image tools
 * (compress/resize/convert) run on Node-native sharp instead of the browser
 * pipeline. sharp is an optionalDependency — `qbtools` degrades gracefully
 * when it isn't installed.
 */

import { type ProcessingProgress, UnavailableError } from "../runner/types";

/**
 * Structural sharp factory type — sharp's own exported types differ across
 * versions (callable module vs namespace with default), so we only rely on
 * the surface we use.
 */
export interface SharpInstance {
	resize(options: {
		width?: number;
		height?: number;
		fit?: "cover" | "contain" | "inside" | "fill";
		withoutEnlargement?: boolean;
	}): SharpInstance;
	flatten(options: { background: string }): SharpInstance;
	toFormat(
		format: "jpeg" | "png" | "webp" | "avif",
		options?: { quality?: number; effort?: number },
	): SharpInstance;
	toBuffer(options: { resolveWithObject: true }): Promise<{
		data: Buffer;
		info: { width: number; height: number };
	}>;
}

type SharpFactory = (input: Uint8Array) => SharpInstance;

let cached: SharpFactory | null | undefined;

export async function getSharp(): Promise<SharpFactory> {
	if (cached !== undefined) {
		if (!cached) throw unavailable();
		return cached;
	}
	try {
		const mod = (await import("sharp")) as unknown as {
			default?: unknown;
		} & Record<string, unknown>;
		// Bun's CJS interop may place the factory behind `.default`.
		const candidate = typeof mod.default === "function" ? mod.default : mod;
		if (typeof candidate !== "function") throw unavailable();
		const factory = candidate as unknown as SharpFactory;
		cached = factory;
		return factory;
	} catch {
		cached = null;
		throw unavailable();
	}
}

function unavailable(): UnavailableError {
	return new UnavailableError(
		"sharp",
		"This tool needs the optional sharp package. Install it with `npm i -g sharp` (or `bun add sharp`), then re-run.",
	);
}

export interface SharpFormatOptions {
	format: "jpeg" | "png" | "webp" | "avif";
	/** 1–100 for lossy formats. */
	quality?: number;
	/** Max long edge in pixels when resizing before encode. */
	maxEdge?: number;
	effort?: number;
}

export function progressFor(label: string): ProcessingProgress {
	return { stage: "processing", fraction: null, label };
}

/** Compress to a target-format JPEG/WebP/PNG/AVIF at the given quality. */
export async function compressImage(
	input: File,
	options: SharpFormatOptions & { quality: number },
): Promise<{ bytes: Uint8Array; mimeType: string; width: number; height: number }> {
	const sharp = await getSharp();
	let pipeline = sharp(new Uint8Array(await input.arrayBuffer()));
	if (options.maxEdge) {
		pipeline = pipeline.resize({
			width: options.maxEdge,
			height: options.maxEdge,
			fit: "inside",
			withoutEnlargement: true,
		});
	}
	const encoded = await pipeline
		.toFormat(options.format, {
			quality: options.format === "png" ? undefined : Math.min(100, Math.max(1, options.quality)),
			effort: options.effort,
		})
		.toBuffer({ resolveWithObject: true });
	return {
		bytes: new Uint8Array(encoded.data),
		mimeType: `image/${options.format}`,
		width: encoded.info.width,
		height: encoded.info.height,
	};
}

export async function resizeImage(
	input: File,
	options: {
		width?: number;
		height?: number;
		fit: "cover" | "contain" | "inside" | "fill";
		format: SharpFormatOptions["format"];
		quality?: number;
	},
): Promise<{ bytes: Uint8Array; mimeType: string; width: number; height: number }> {
	const sharp = await getSharp();
	const pipeline = sharp(new Uint8Array(await input.arrayBuffer())).resize({
		width: options.width && options.width > 0 ? options.width : undefined,
		height: options.height && options.height > 0 ? options.height : undefined,
		fit: options.fit,
		withoutEnlargement: false,
	});
	let final = pipeline;
	if (options.format === "jpeg") final = pipeline.flatten({ background: "#ffffff" });
	const encoded = await final
		.toFormat(options.format, {
			quality: options.format === "png" ? undefined : options.quality,
		})
		.toBuffer({ resolveWithObject: true });
	return {
		bytes: new Uint8Array(encoded.data),
		mimeType: `image/${options.format}`,
		width: encoded.info.width,
		height: encoded.info.height,
	};
}

export async function convertImage(
	input: File,
	format: SharpFormatOptions["format"],
	quality?: number,
): Promise<{ bytes: Uint8Array; mimeType: string; width: number; height: number }> {
	const sharp = await getSharp();
	let pipeline = sharp(new Uint8Array(await input.arrayBuffer()));
	if (format === "jpeg") pipeline = pipeline.flatten({ background: "#ffffff" });
	const encoded = await pipeline
		.toFormat(format, {
			quality: format === "png" ? undefined : quality,
		})
		.toBuffer({ resolveWithObject: true });
	return {
		bytes: new Uint8Array(encoded.data),
		mimeType: `image/${format}`,
		width: encoded.info.width,
		height: encoded.info.height,
	};
}

/** Sharp availability probe for doctor/TUI without triggering the error. */
export async function sharpAvailable(): Promise<boolean> {
	try {
		await getSharp();
		return true;
	} catch {
		return false;
	}
}
