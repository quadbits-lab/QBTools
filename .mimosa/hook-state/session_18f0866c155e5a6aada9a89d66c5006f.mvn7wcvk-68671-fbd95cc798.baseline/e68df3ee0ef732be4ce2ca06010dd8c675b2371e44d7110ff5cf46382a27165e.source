/** Canvas-independent PNG encoder for raw RGBA masks (monochrome, round icons). */

import UPNG from "upng-js";
import { checkAbort, type ProcessingOptions } from "../processing";

/** Encode raw RGBA pixels as PNG. Deterministic, no canvas or WASM required. */
export function encodeRawPng(
	pixels: Uint8Array | Uint8ClampedArray,
	width: number,
	height: number,
	options: { processing?: ProcessingOptions } = {},
): Blob {
	const copy = pixels.buffer.slice(
		pixels.byteOffset,
		pixels.byteOffset + pixels.byteLength,
	) as ArrayBuffer;
	const buffer = UPNG.encode([copy], width, height, 0);
	const view = new Uint8Array(buffer);
	if (view[0] !== 0x89 || view[1] !== 0x50)
		throw new Error("The PNG encoder produced invalid output.");
	checkAbort(options.processing?.signal);
	return new Blob([view as BlobPart], { type: "image/png" });
}
