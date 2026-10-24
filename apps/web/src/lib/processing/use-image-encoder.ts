import { encodeCanvas, type ImageFormat } from "@qbtools/engines/image";
import type { EncodingMode, OptimizedFormat } from "@qbtools/engines/image-codecs";
import { checkAbort, checkImageSize, type ProcessingOptions } from "@qbtools/engines/processing";
import { useEffect, useState } from "react";
import { ProcessingWorker } from "./worker-client";
export const OUTPUT_EXT = { jpeg: "jpg", png: "png", webp: "webp", avif: "avif" } as const;
export function useImageEncoder() {
	const [worker] = useState(() => new ProcessingWorker());
	useEffect(() => () => worker.dispose(), [worker]);
	return async (
		canvas: HTMLCanvasElement,
		format: OptimizedFormat,
		quality: number,
		mode: EncodingMode,
		options: ProcessingOptions,
	) => {
		checkAbort(options.signal);
		if (mode === "fast" && format !== "avif") {
			options.onProgress?.({ stage: "processing", fraction: null, label: "Encoding image…" });
			const blob = await encodeCanvas(canvas, format as ImageFormat, quality);
			checkAbort(options.signal);
			return blob;
		}
		checkImageSize(canvas.width, canvas.height);
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas is unavailable.");
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		return worker.run<Blob>("image", { data, format, quality }, options, [
			data.data.buffer as ArrayBuffer,
		]);
	};
}
