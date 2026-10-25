import { assetBase } from "../assets";
import { decodeImage } from "../image";
import { checkImageSize, type ProcessingOptions, progress } from "../processing";

export interface BarcodeHit {
	text: string;
	/** ZXing format name, such as "QRCode" or "EAN13". */
	format: string;
	/** Corners in pixels of the scanned image. */
	position: { x: number; y: number }[];
}
export const WRITE_FORMATS = [
	{ value: "QRCode", label: "QR Code", hint: "Any text or link" },
	{ value: "Code128", label: "Code 128", hint: "Letters, numbers and symbols" },
	{ value: "EAN13", label: "EAN-13", hint: "12 or 13 digits (retail)" },
	{ value: "EAN8", label: "EAN-8", hint: "7 or 8 digits (small retail)" },
	{ value: "UPCA", label: "UPC-A", hint: "11 or 12 digits (US retail)" },
	{ value: "Code39", label: "Code 39", hint: "Capital letters, digits and - . $ / + % space" },
	{ value: "ITF", label: "ITF (Interleaved 2 of 5)", hint: "An even number of digits" },
	{ value: "DataMatrix", label: "Data Matrix", hint: "Compact 2D code" },
	{ value: "PDF417", label: "PDF417", hint: "Large 2D code for documents" },
	{ value: "Aztec", label: "Aztec", hint: "2D code used on tickets" },
] as const;
export type WriteFormat = (typeof WRITE_FORMATS)[number]["value"];
export const MAX_TEXT_LENGTH = 2000;
export interface BarcodeImage {
	png: Blob;
	svg: string;
}
/** Tests supply the wasm bytes directly instead of fetching them from /wasm/. */
let binaries: { reader?: ArrayBuffer; writer?: ArrayBuffer } = {};
export function useWasmBinaries(next: { reader?: ArrayBuffer; writer?: ArrayBuffer }) {
	binaries = next;
	readerModule = null;
	writerModule = null;
}
let readerModule: Promise<typeof import("zxing-wasm/reader")> | null = null;
let writerModule: Promise<typeof import("zxing-wasm/writer")> | null = null;
async function overrides(kind: "reader" | "writer") {
	const binary = binaries[kind];
	if (binary) return { wasmBinary: binary };
	const base = await assetBase("zxing");
	return {
		locateFile: (path: string, prefix: string) =>
			path.endsWith(".wasm") ? `${base}/${kind}/${path}` : prefix + path,
	};
}
function loadReader() {
	readerModule ??= (async () => {
		const lib = await import("zxing-wasm/reader");
		lib.prepareZXingModule({ overrides: await overrides("reader") });
		return lib;
	})().catch((error) => {
		readerModule = null;
		throw error;
	});
	return readerModule;
}
function loadWriter() {
	writerModule ??= (async () => {
		const lib = await import("zxing-wasm/writer");
		lib.prepareZXingModule({ overrides: await overrides("writer") });
		return lib;
	})().catch((error) => {
		writerModule = null;
		throw error;
	});
	return writerModule;
}
const toHits = (results: { isValid: boolean; text: string; format: string; position: unknown }[]) =>
	results
		.filter((result) => result.isValid && result.text)
		.map((result) => {
			const p = result.position as Record<string, { x: number; y: number }>;
			return {
				text: result.text,
				format: result.format,
				position: [p.topLeft, p.topRight, p.bottomRight, p.bottomLeft].filter(
					(point): point is { x: number; y: number } => Boolean(point),
				),
			};
		});
/** Read every barcode in an image file. Browser only. */
export async function readBarcodesFromFile(
	file: File,
	options: ProcessingOptions = {},
): Promise<BarcodeHit[]> {
	progress(options, "Loading barcode reader…", null, "loading");
	const [lib, bitmap] = await Promise.all([loadReader(), decodeImage(file)]);
	const canvas = document.createElement("canvas");
	try {
		checkImageSize(bitmap.width, bitmap.height);
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) throw new Error("Canvas isn't available in this browser.");
		ctx.drawImage(bitmap, 0, 0);
		progress(options, "Looking for barcodes…");
		return toHits(
			await lib.readBarcodes(ctx.getImageData(0, 0, canvas.width, canvas.height), {
				tryHarder: true,
				tryRotate: true,
				tryInvert: true,
				maxNumberOfSymbols: 20,
			}),
		);
	} finally {
		bitmap.close();
		canvas.width = canvas.height = 0;
	}
}
/** Read barcodes from a camera frame. Fast settings, no downscale of results. */
export async function readBarcodesFromFrame(frame: ImageData): Promise<BarcodeHit[]> {
	const lib = await loadReader();
	return toHits(await lib.readBarcodes(frame, { tryHarder: false, maxNumberOfSymbols: 5 }));
}
export interface WriteSettings {
	format: WriteFormat;
	/** Pixels per barcode module in the PNG, 1–16. */
	scale?: number;
	/** Print the human-readable text under linear barcodes. */
	showText?: boolean;
}
export async function writeBarcodeImage(
	text: string,
	settings: WriteSettings,
): Promise<BarcodeImage> {
	const value = text.trim();
	if (!value) throw new Error("Type the text or number to encode.");
	if (value.length > MAX_TEXT_LENGTH)
		throw new Error(`Use ${MAX_TEXT_LENGTH} characters or fewer.`);
	const lib = await loadWriter();
	const result = await lib.writeBarcode(value, {
		format: settings.format,
		scale: Math.min(16, Math.max(1, Math.round(settings.scale ?? 4))),
		withHRT: settings.showText ?? true,
		withQuietZones: true,
	});
	if (result.error || !result.image)
		throw new Error(
			`That text can't be encoded as this barcode type. ${result.error ?? ""}`.trim(),
		);
	return { png: result.image, svg: result.svg };
}
