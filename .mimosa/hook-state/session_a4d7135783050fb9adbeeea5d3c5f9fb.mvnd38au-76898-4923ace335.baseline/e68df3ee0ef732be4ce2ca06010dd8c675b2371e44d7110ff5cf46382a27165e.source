/**
 * Canvas-independent PNG encoder for raw RGBA masks (monochrome, round icons).
 * Uses only Web platform APIs (CompressionStream) so it runs in a Worker, on the
 * page and in Bun tests — never `window`, `canvas` or WASM.
 */

import { checkAbort, type ProcessingOptions } from "../processing";

const SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** Filter type 0 (None) precedes every scanline. */
const FILTER_NONE = 0;
const BIT_DEPTH_8 = 8;
const COLOR_TYPE_RGBA = 6;
/** Refuse absurd allocations before building the scanline buffer. */
const MAX_PIXELS = 268_435_456;

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();

/** CRC-32 (PNG chunk checksum). */
function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < bytes.length; i++) {
		crc = (CRC_TABLE[(crc ^ (bytes[i] ?? 0)) & 0xff] ?? 0) ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

/** Serialize one PNG chunk: length, type, payload and CRC over type + payload. */
function pngChunk(type: string, data: Uint8Array): Uint8Array {
	const out = new Uint8Array(12 + data.length);
	const view = new DataView(out.buffer);
	view.setUint32(0, data.length);
	for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i) ?? 0;
	out.set(data, 8);
	const crcInput = out.subarray(4, 8 + data.length);
	view.setUint32(8 + data.length, crc32(crcInput));
	return out;
}

/** Prepend a filter byte to each row, as PNG requires. */
function scanlines(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number) {
	const stride = width * 4;
	const out = new Uint8Array((stride + 1) * height);
	for (let y = 0; y < height; y++) {
		const rowStart = y * (stride + 1);
		out[rowStart] = FILTER_NONE;
		out.set(pixels.subarray(y * stride, (y + 1) * stride), rowStart + 1);
	}
	return out;
}

/** Deflate (zlib wrapper) arbitrary bytes with the Web Compression Streams API. */
async function zlibDeflate(bytes: Uint8Array): Promise<Uint8Array> {
	if (typeof CompressionStream === "undefined") {
		throw new Error(
			"PNG export needs the Compression Streams API, which this browser does not support.",
		);
	}
	const compressed = new Blob([bytes as BlobPart])
		.stream()
		.pipeThrough(new CompressionStream("deflate"));
	return new Uint8Array(await new Response(compressed).arrayBuffer());
}

/** Encode raw RGBA8 pixels as PNG. Deterministic, no canvas or WASM required. */
export async function encodeRawPng(
	pixels: Uint8Array | Uint8ClampedArray,
	width: number,
	height: number,
	options: { processing?: ProcessingOptions } = {},
): Promise<Blob> {
	checkAbort(options.processing?.signal);
	if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
		throw new Error("PNG width and height must be positive whole numbers.");
	}
	if (width * height > MAX_PIXELS) {
		throw new Error("This image is too large to encode as a PNG.");
	}
	const expected = width * height * 4;
	if (pixels.length !== expected) {
		throw new Error(
			`Expected ${expected} RGBA bytes for a ${width}×${height} image, received ${pixels.length}.`,
		);
	}

	const ihdr = new Uint8Array(13);
	const header = new DataView(ihdr.buffer);
	header.setUint32(0, width);
	header.setUint32(4, height);
	ihdr[8] = BIT_DEPTH_8;
	ihdr[9] = COLOR_TYPE_RGBA;
	// ihdr[10..12] stay 0: deflate compression, adaptive filtering, no interlace.

	const idat = await zlibDeflate(scanlines(pixels, width, height));
	checkAbort(options.processing?.signal);

	const chunks = [
		SIGNATURE,
		pngChunk("IHDR", ihdr),
		pngChunk("IDAT", idat),
		pngChunk("IEND", new Uint8Array(0)),
	];
	const total = chunks.reduce((n, chunk) => n + chunk.length, 0);
	const png = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		png.set(chunk, offset);
		offset += chunk.length;
	}
	return new Blob([png as BlobPart], { type: "image/png" });
}
