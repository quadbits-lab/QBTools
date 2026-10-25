/** Shared processing contracts; no browser globals are evaluated on import. */
export type JobStatus = "queued" | "loading" | "processing" | "done" | "error" | "cancelled";
export interface ProcessingProgress {
	stage: "loading" | "processing";
	fraction: number | null;
	label: string;
}
export interface ProcessingOptions {
	signal?: AbortSignal;
	onProgress?: (progress: ProcessingProgress) => void;
}
export const LIMITS = {
	imagePixels: 24_000_000,
	ocrBytes: 50 * 1024 ** 2,
	ocrPages: 50,
	pdfBytes: 100 * 1024 ** 2,
	redactPages: 100,
	redactBoxes: 500,
	benchmarkBytes: 50 * 1024 ** 2,
	formatChars: 1_000_000,
	ffmpegBytes: 128 * 1024 ** 2,
	hashChunkBytes: 4 * 1024 ** 2,
} as const;
export function checkAbort(signal?: AbortSignal) {
	if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
}
export function checkImageSize(width: number, height: number) {
	if (width * height > LIMITS.imagePixels) {
		throw new Error("This image exceeds 24 megapixels. Resize it before optimized processing.");
	}
}
export function progress(
	options: ProcessingOptions,
	label: string,
	fraction: number | null = null,
	stage: ProcessingProgress["stage"] = "processing",
) {
	checkAbort(options.signal);
	options.onProgress?.({ stage, fraction, label });
}
