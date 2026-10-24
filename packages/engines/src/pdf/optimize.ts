import { PDFDocument } from "pdf-lib";
import { assetBase } from "../assets";
import { LIMITS, type ProcessingOptions, progress } from "../processing";
export interface OptimizedPdf {
	blob: Blob;
	decreased: boolean;
	warnings: string[];
}
interface Qpdf {
	callMain(args: string[]): number;
	WORKERFS: unknown;
	FS: {
		mkdir(path: string): void;
		mount(type: unknown, options: { blobs: { name: string; data: Blob }[] }, path: string): void;
		unmount(path: string): void;
		readFile(path: string): Uint8Array;
		unlink(path: string): void;
	};
}
let engine: Promise<Qpdf> | null = null;
async function loadEngine(): Promise<Qpdf> {
	const { default: createModule } = await import("@neslinesli93/qpdf-wasm");
	const create = createModule as unknown as (options: {
		locateFile: () => string;
		noInitialRun: boolean;
		print: () => void;
		printErr: () => void;
	}) => Promise<Qpdf>;
	const module = await create({
		locateFile: () => `${base}/qpdf.wasm`,
		noInitialRun: true,
		print: () => {},
		printErr: () => {},
	});
	module.FS.mkdir("/input");
	return module;
}
let base = "";
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
	base = await assetBase("qpdf");
	engine ??= loadEngine().catch((e) => {
		engine = null;
		throw e;
	});
	const qpdf = await engine;
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
		let code: number;
		try {
			code = qpdf.callMain(args);
		} catch (e) {
			const status = (e as { status?: number }).status;
			if (status === undefined) throw e;
			code = status;
		}
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
