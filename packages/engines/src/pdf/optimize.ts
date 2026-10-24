import { PDFDocument } from "pdf-lib";
import { LIMITS, type ProcessingOptions, progress } from "../processing";
import { getQpdf, runQpdf } from "./qpdf";
export interface OptimizedPdf {
	blob: Blob;
	decreased: boolean;
	warnings: string[];
}
/** Must run in a dedicated worker: qpdf.callMain is synchronous. */
export async function optimizePdf(
	file: File,
	options: ProcessingOptions = {},
): Promise<OptimizedPdf> {
	if (file.size > LIMITS.pdfBytes)
		throw new Error("Preserve text mode supports PDFs up to 100 MiB.");
	progress(options, "Loading PDF optimizer…", null, "loading");
	let original: PDFDocument;
	try {
		original = await PDFDocument.load(await file.arrayBuffer());
	} catch (e) {
		throw new Error(
			String(e).toLowerCase().includes("encrypt")
				? "This PDF is password-protected. Save an unlocked copy first."
				: "This PDF couldn't be opened. It may be damaged.",
		);
	}
	const qpdf = await getQpdf();
	progress(options, "Optimizing PDF structure…");
	let mounted = false;
	try {
		qpdf.FS.mount(qpdf.WORKERFS, { blobs: [{ name: "source.pdf", data: file }] }, "/input");
		mounted = true;
		const args = [
			"/input/source.pdf",
			"--object-streams=generate",
			"--compress-streams=y",
			"--recompress-flate",
			"--compression-level=9",
			"/output.pdf",
		];
		const code = runQpdf(qpdf, args);
		if (code !== 0 && code !== 3)
			throw new Error("This PDF couldn't be optimized. Try an unlocked, undamaged copy.");
		const bytes = qpdf.FS.readFile("/output.pdf").slice();
		const validated = await PDFDocument.load(bytes);
		if (
			validated.getPageCount() !== original.getPageCount() ||
			validated.getPages().some((page, i) => {
				const before = original.getPage(i);
				return before.getWidth() !== page.getWidth() || before.getHeight() !== page.getHeight();
			})
		)
			throw new Error("The optimized PDF failed validation. Keep your original.");
		progress(options, "PDF ready", 1);
		return {
			blob:
				bytes.length < file.size
					? new Blob([bytes as BlobPart], { type: "application/pdf" })
					: file,
			decreased: bytes.length < file.size,
			warnings:
				code === 3
					? [
							"The PDF engine repaired or warned about document structure. Check the downloaded result.",
						]
					: [],
		};
	} finally {
		if (mounted) qpdf.FS.unmount("/input");
		try {
			qpdf.FS.unlink("/output.pdf");
		} catch {
			/* No output on failure. */
		}
	}
}
