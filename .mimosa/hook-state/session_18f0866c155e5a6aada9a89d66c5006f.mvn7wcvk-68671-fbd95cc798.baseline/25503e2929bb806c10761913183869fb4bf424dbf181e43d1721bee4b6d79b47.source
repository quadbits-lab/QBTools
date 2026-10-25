import { PDFDocument, StandardFonts } from "pdf-lib";
import type { OcrSession } from "../ocr";
import { checkAbort, LIMITS, type ProcessingOptions, progress } from "../processing";
import { loadPdf } from "./render";
import { addTextLayer } from "./text-layer";

export interface SearchablePdf {
	blob: Blob;
	pageCount: number;
	/** Pages that had no text and were recognised. */
	ocrPages: number;
	/** Pages that already had real text and were copied as they were. */
	keptPages: number;
	/** Words written to the hidden layer. */
	words: number;
}
export interface SearchablePdfOptions extends ProcessingOptions {
	session: OcrSession;
	/** Recognise every page, even those that already have text. */
	forceOcr?: boolean;
}
/** About 200 dpi, with the long edge capped so phones don't run out of memory. */
const OCR_SCALE = 200 / 72;
const MAX_EDGE = 2800;
/**
 * Keep every page exactly as it is and add a hidden, selectable text layer from OCR.
 * English only: the hidden layer uses a built-in Latin font. Browser only.
 */
export async function makeSearchablePdf(
	file: File,
	options: SearchablePdfOptions,
): Promise<SearchablePdf> {
	if (file.size > LIMITS.ocrBytes) throw new Error("This tool supports PDFs up to 50 MiB.");
	progress(options, "Reading PDF…", null, "loading");
	const task = await loadPdf(file);
	let doc: Awaited<typeof task.promise>;
	try {
		doc = await task.promise;
	} catch (error) {
		if ((error as { name?: string })?.name === "PasswordException")
			throw new Error("This PDF is password-protected. Unlock it with the Protect PDF tool first.");
		throw new Error("This PDF couldn't be opened. It may be damaged.");
	}
	const abort = () => {
		void task.destroy();
	};
	options.signal?.addEventListener("abort", abort, { once: true });
	try {
		if (doc.numPages > LIMITS.ocrPages) throw new Error("This tool supports PDFs up to 50 pages.");
		const source = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
		const out = await PDFDocument.create();
		const font = await out.embedFont(StandardFonts.Helvetica);
		let ocrPages = 0;
		let keptPages = 0;
		let words = 0;
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas isn't available in this browser.");
		for (let index = 0; index < doc.numPages; index++) {
			checkAbort(options.signal);
			const [copy] = await out.copyPages(source, [index]);
			if (!copy) continue;
			out.addPage(copy);
			const page = await doc.getPage(index + 1);
			try {
				if (!options.forceOcr) {
					const content = await page.getTextContent();
					if (content.items.some((item) => "str" in item && item.str.trim())) {
						keptPages++;
						continue;
					}
				}
				const base = page.getViewport({ scale: 1 });
				const scale = Math.min(OCR_SCALE, MAX_EDGE / Math.max(base.width, base.height));
				const viewport = page.getViewport({ scale });
				canvas.width = Math.ceil(viewport.width);
				canvas.height = Math.ceil(viewport.height);
				ctx.fillStyle = "#fff";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				await page.render({ canvas, canvasContext: ctx, viewport }).promise;
				const layout = await options.session.recognizeLayout(canvas, "eng", {
					...options,
					onProgress: (p) =>
						options.onProgress?.({
							...p,
							label: `Page ${index + 1}/${doc.numPages}: ${p.label}`,
							fraction:
								p.stage === "processing" && p.fraction !== null
									? (index + p.fraction) / doc.numPages
									: null,
						}),
				});
				// Points per recognised pixel, as the reader sees the page.
				words += addTextLayer(copy, font, layout.words, base.width / canvas.width);
				ocrPages++;
			} finally {
				page.cleanup();
			}
		}
		checkAbort(options.signal);
		canvas.width = canvas.height = 0;
		out.setProducer("QBTools");
		progress(options, "PDF ready", 1);
		return {
			blob: new Blob([(await out.save()) as BlobPart], { type: "application/pdf" }),
			pageCount: doc.numPages,
			ocrPages,
			keptPages,
			words,
		};
	} finally {
		options.signal?.removeEventListener("abort", abort);
		await task.destroy();
	}
}
