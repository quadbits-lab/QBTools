import { PDFDocument } from "pdf-lib";
import { checkAbort, LIMITS, type ProcessingOptions, progress } from "../processing";
import { boxToPixels, groupBoxesByPage, type RedactionBox } from "./redact-boxes";
import { loadPdf } from "./render";

export interface RedactedPdf {
	blob: Blob;
	redactedPages: number;
	pageCount: number;
}
/** Render scale for redacted pages: about 144 dpi, with the long edge capped for phones. */
const SCALE = 2;
const MAX_EDGE = 3200;
/**
 * Redacted pages are re-rendered with the boxes burned into the pixels and rebuilt as
 * images, so the covered text no longer exists in the file. Other pages are copied untouched.
 * Bookmarks and document properties are not carried over. Browser only.
 */
export async function redactPdf(
	file: File,
	boxes: RedactionBox[],
	options: ProcessingOptions = {},
): Promise<RedactedPdf> {
	if (file.size > LIMITS.pdfBytes) throw new Error("This tool supports PDFs up to 100 MiB.");
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
		if (doc.numPages > LIMITS.redactPages)
			throw new Error(`Redaction supports up to ${LIMITS.redactPages} pages. Split the PDF first.`);
		const byPage = groupBoxesByPage(boxes, doc.numPages);
		const source = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
		const out = await PDFDocument.create();
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas isn't available in this browser.");
		let done = 0;
		for (let index = 0; index < doc.numPages; index++) {
			checkAbort(options.signal);
			const pageBoxes = byPage.get(index);
			if (!pageBoxes) {
				const [copy] = await out.copyPages(source, [index]);
				if (copy) out.addPage(copy);
				continue;
			}
			const page = await doc.getPage(index + 1);
			const base = page.getViewport({ scale: 1 });
			const scale = Math.min(SCALE, MAX_EDGE / Math.max(base.width, base.height));
			const viewport = page.getViewport({ scale });
			canvas.width = Math.ceil(viewport.width);
			canvas.height = Math.ceil(viewport.height);
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			await page.render({ canvas, canvasContext: ctx, viewport }).promise;
			ctx.fillStyle = "#000";
			for (const box of pageBoxes) {
				const r = boxToPixels(box, canvas.width, canvas.height);
				ctx.fillRect(r.x, r.y, r.width, r.height);
			}
			const jpeg = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, "image/jpeg", 0.88),
			);
			if (!jpeg) throw new Error("Couldn't render a redacted page.");
			const image = await out.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
			const outPage = out.addPage([base.width, base.height]);
			outPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });
			page.cleanup();
			done++;
			progress(options, `Redacting page ${index + 1} of ${doc.numPages}`, done / byPage.size);
		}
		checkAbort(options.signal);
		out.setProducer("QBTools");
		return {
			blob: new Blob([(await out.save()) as BlobPart], { type: "application/pdf" }),
			redactedPages: byPage.size,
			pageCount: doc.numPages,
		};
	} finally {
		options.signal?.removeEventListener("abort", abort);
		await task.destroy();
	}
}
