/// <reference lib="webworker" />

import type { DigestAlgorithm } from "@qbtools/engines/hash";
import type { OptimizedFormat } from "@qbtools/engines/image-codecs";
import type { ProcessingOptions } from "@qbtools/engines/processing";

let ocr: import("@qbtools/engines/ocr").OcrSession | null = null;
let gif: import("@qbtools/engines/gif").GifSession | null = null;
self.onmessage = async ({
	data,
}: MessageEvent<{ id: number; operation: string; payload: unknown }>) => {
	const { id, operation, payload } = data;
	const options: ProcessingOptions = {
		onProgress: (progress) => self.postMessage({ id, progress }),
	};
	try {
		let result: unknown;
		if (operation === "hash") {
			const { input, algorithms } = payload as {
				input: File | string;
				algorithms: DigestAlgorithm[];
			};
			const { computeHashes } = await import("@qbtools/engines/hash");
			result = await computeHashes(input, algorithms, options);
		} else if (operation === "image") {
			const image = payload as { data: ImageData; format: OptimizedFormat; quality: number };
			const { encodeImage } = await import("@qbtools/engines/image-codecs");
			result = await encodeImage(image.data, {
				...options,
				format: image.format,
				quality: image.quality,
			});
		} else if (operation === "ocr") {
			const { OcrSession } = await import("@qbtools/engines/ocr");
			ocr ??= new OcrSession();
			const request = payload as {
				image: Blob;
				language: import("@qbtools/engines/ocr").OcrLanguage;
			};
			result = await ocr.recognize(request.image, request.language, options);
		} else if (operation.startsWith("gif-")) {
			const { GifSession } = await import("@qbtools/engines/gif");
			if (operation === "gif-start") {
				gif = new GifSession();
				result = true;
			} else if (operation === "gif-frame" && gif) {
				gif.addFrame(payload as import("@qbtools/engines/gif").GifFrame);
				result = true;
			} else if (operation === "gif-finish" && gif) {
				result = gif.finish();
				gif = null;
			} else throw new Error("GIF encoding session expired.");
		} else if (operation === "pdf") {
			const { optimizePdf } = await import("@qbtools/engines/pdf-optimize");
			result = await optimizePdf(payload as File, options);
		} else throw new Error("Unknown processing operation.");
		self.postMessage({ id, result });
	} catch (e) {
		self.postMessage({ id, error: e instanceof Error ? e.message : "Processing failed." });
	}
};
