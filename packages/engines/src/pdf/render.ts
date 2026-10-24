import { PDFDocument } from "pdf-lib";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { assetBase } from "../assets";
import { checkAbort, type ProcessingOptions } from "../processing";

/** Lazily load pdf.js with its worker (browser only). */
export async function pdfjs() {
	const lib = await import("pdfjs-dist");
	lib.GlobalWorkerOptions.workerSrc = workerUrl;
	return lib;
}

export async function loadPdf(file: File) {
	const lib = await pdfjs();
	const base = await assetBase("pdfjs");
	return lib.getDocument({
		data: new Uint8Array(await file.arrayBuffer()),
		wasmUrl: `${base}/wasm/`,
		cMapUrl: `${base}/cmaps/`,
		cMapPacked: true,
		standardFontDataUrl: `${base}/standard_fonts/`,
	});
}

export const COMPRESSION_LEVELS = {
	light: { scale: 1.6, quality: 0.75, label: "Light", hint: "Best quality, smaller savings" },
	recommended: {
		scale: 1.25,
		quality: 0.6,
		label: "Recommended",
		hint: "Good quality, good savings",
	},
	strong: { scale: 1, quality: 0.42, label: "Strong", hint: "Smallest file, lower quality" },
} as const;
export type CompressionLevel = keyof typeof COMPRESSION_LEVELS;

/**
 * Re-render every page to an optimized JPEG and rebuild the PDF at the
 * original page size. Big wins for scans; text becomes non-selectable.
 */
export async function compressPdf(
	file: File,
	level: CompressionLevel,
	onProgress?: (done: number, total: number) => void,
	options: ProcessingOptions = {},
): Promise<Blob> {
	const { scale, quality } = COMPRESSION_LEVELS[level];
	const task = await loadPdf(file);
	let doc: Awaited<typeof task.promise>;
	try {
		doc = await task.promise;
	} catch (error) {
		if ((error as { name?: string })?.name === "PasswordException") {
			throw new Error(
				"This PDF is password-protected. Open it with the password and save an unlocked copy first.",
			);
		}
		throw new Error("This PDF couldn't be opened. It may be damaged.");
	}
	const abort = () => {
		void task.destroy();
	};
	options.signal?.addEventListener("abort", abort, { once: true });
	try {
		checkAbort(options.signal);
		const out = await PDFDocument.create();
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas isn't available in this browser.");

		for (let i = 1; i <= doc.numPages; i++) {
			checkAbort(options.signal);
			const page = await doc.getPage(i);
			const base = page.getViewport({ scale: 1 });
			// Cap very large pages so phones don't run out of memory.
			const s = Math.min(scale, 2400 / Math.max(base.width, base.height));
			const viewport = page.getViewport({ scale: s });
			canvas.width = Math.ceil(viewport.width);
			canvas.height = Math.ceil(viewport.height);
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			await page.render({ canvas, canvasContext: ctx, viewport }).promise;
			const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
			if (!blob) throw new Error("Couldn't compress a page.");
			const image = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
			const outPage = out.addPage([base.width, base.height]);
			outPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });
			page.cleanup();
			onProgress?.(i, doc.numPages);
		}
		checkAbort(options.signal);
		out.setProducer("QBTools");
		return new Blob([(await out.save()) as BlobPart], { type: "application/pdf" });
	} finally {
		options.signal?.removeEventListener("abort", abort);
		await task.destroy();
	}
}

/** Small thumbnail of page 1 for previews. */
export async function renderThumbnail(file: File, maxSize = 240): Promise<string | null> {
	try {
		const task = await loadPdf(file);
		const doc = await task.promise;
		const page = await doc.getPage(1);
		const base = page.getViewport({ scale: 1 });
		const viewport = page.getViewport({ scale: maxSize / Math.max(base.width, base.height) });
		const canvas = document.createElement("canvas");
		canvas.width = Math.ceil(viewport.width);
		canvas.height = Math.ceil(viewport.height);
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		await page.render({ canvas, canvasContext: ctx, viewport }).promise;
		await task.destroy();
		return canvas.toDataURL("image/jpeg", 0.7);
	} catch {
		return null;
	}
}
