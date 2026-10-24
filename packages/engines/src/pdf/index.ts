import { PDFDocument } from "pdf-lib";
import { parsePageRanges } from "./ranges";

export { parsePageRanges };

const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: "application/pdf" });

async function load(bytes: ArrayBuffer | Uint8Array, name = "This PDF") {
	try {
		return await PDFDocument.load(bytes, { updateMetadata: false });
	} catch (error) {
		if (String(error).toLowerCase().includes("encrypt")) {
			throw new Error(`${name} is password-protected. Open it with the password and save an unlocked copy first.`);
		}
		throw new Error(`${name} couldn't be opened. It may be damaged or not a real PDF.`);
	}
}

export async function pdfPageCount(file: File): Promise<number> {
	return (await load(await file.arrayBuffer(), file.name)).getPageCount();
}

export async function mergePdfs(files: File[], onProgress?: (done: number) => void): Promise<Blob> {
	const out = await PDFDocument.create();
	for (const [index, file] of files.entries()) {
		const doc = await load(await file.arrayBuffer(), file.name);
		const pages = await out.copyPages(doc, doc.getPageIndices());
		for (const page of pages) out.addPage(page);
		onProgress?.(index + 1);
	}
	out.setProducer("QBTools");
	return pdfBlob(await out.save());
}

/** One PDF with the chosen pages, or one PDF per page. */
export async function splitPdf(file: File, mode: { kind: "ranges"; ranges: string } | { kind: "every" }): Promise<{ name: string; blob: Blob }[]> {
	const src = await load(await file.arrayBuffer(), file.name);
	const base = file.name.replace(/\.pdf$/i, "");
	if (mode.kind === "ranges") {
		const indexes = parsePageRanges(mode.ranges, src.getPageCount());
		const out = await PDFDocument.create();
		for (const page of await out.copyPages(src, indexes)) out.addPage(page);
		return [{ name: `${base}-pages.pdf`, blob: pdfBlob(await out.save()) }];
	}
	const results: { name: string; blob: Blob }[] = [];
	for (const index of src.getPageIndices()) {
		const out = await PDFDocument.create();
		const [page] = await out.copyPages(src, [index]);
		if (page) out.addPage(page);
		results.push({ name: `${base}-page-${String(index + 1).padStart(3, "0")}.pdf`, blob: pdfBlob(await out.save()) });
	}
	return results;
}

export type PageSize = "a4" | "letter" | "fit";
const SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const;

/**
 * PNGs embed as-is. Everything else (JPEG, WebP, GIF…) is re-encoded through a
 * canvas, which also applies EXIF rotation that pdf-lib would ignore.
 */
async function toEmbeddable(file: File): Promise<{ bytes: Uint8Array; png: boolean; width: number; height: number }> {
	const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
	const png = file.type === "image/png";
	if (png) {
		return { bytes: new Uint8Array(await file.arrayBuffer()), png, width: bitmap.width, height: bitmap.height };
	}
	const canvas = document.createElement("canvas");
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas isn't available in this browser.");
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(bitmap, 0, 0);
	const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
	if (!blob) throw new Error(`${file.name} couldn't be converted.`);
	return { bytes: new Uint8Array(await blob.arrayBuffer()), png: false, width: bitmap.width, height: bitmap.height };
}

export async function imagesToPdf(
	files: File[],
	options: { pageSize: PageSize; orientation: "auto" | "portrait" | "landscape"; marginPt: number },
	onProgress?: (done: number) => void,
): Promise<Blob> {
	const doc = await PDFDocument.create();
	for (const [index, file] of files.entries()) {
		const img = await toEmbeddable(file);
		const embedded = img.png ? await doc.embedPng(img.bytes) : await doc.embedJpg(img.bytes);
		const landscapeImage = embedded.width > embedded.height;
		let [pw, ph] = options.pageSize === "fit" ? [embedded.width, embedded.height] : [...SIZES[options.pageSize]];
		const landscape = options.orientation === "landscape" || (options.orientation === "auto" && landscapeImage);
		if (options.pageSize !== "fit" && landscape) [pw, ph] = [ph, pw];
		const margin = options.pageSize === "fit" ? 0 : options.marginPt;
		const page = doc.addPage([pw, ph]);
		const scale = Math.min((pw - margin * 2) / embedded.width, (ph - margin * 2) / embedded.height, options.pageSize === "fit" ? 1 : Number.POSITIVE_INFINITY);
		const w = embedded.width * scale;
		const h = embedded.height * scale;
		page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
		onProgress?.(index + 1);
	}
	doc.setProducer("QBTools");
	return pdfBlob(await doc.save());
}
