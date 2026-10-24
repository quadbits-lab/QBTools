import type { Worker as OcrWorker } from "tesseract.js";
import { assetBase } from "../assets";
import { decodeImage } from "../image";
import {
	checkAbort,
	checkImageSize,
	LIMITS,
	type ProcessingOptions,
	progress,
} from "../processing";
export type OcrLanguage = "eng" | "ara" | "eng+ara";
export interface ExtractTextOptions extends ProcessingOptions {
	language?: OcrLanguage;
	forceOcr?: boolean;
	session?: OcrSession;
}
export interface ExtractedPage {
	page: number;
	text: string;
	method: "text" | "ocr";
	warning?: string;
}
export interface ExtractedText {
	pages: ExtractedPage[];
	text: string;
}
/** Owned by the tool; only language/model assets remain in memory between jobs. */
export class OcrSession {
	constructor(
		private executor?: {
			run<T>(operation: string, payload: unknown, options?: ProcessingOptions): Promise<T>;
			dispose(): void;
		},
	) {}
	private worker: OcrWorker | null = null;
	private language = "";
	private creating: Promise<OcrWorker> | null = null;
	private options: ProcessingOptions = {};
	private generation = 0;
	async recognize(
		image: HTMLCanvasElement | Blob,
		language: OcrLanguage,
		options: ProcessingOptions,
	): Promise<string> {
		checkAbort(options.signal);
		if (this.executor) {
			const blob =
				image instanceof Blob
					? image
					: await new Promise<Blob>((resolve, reject) =>
							image.toBlob(
								(value) => (value ? resolve(value) : reject(new Error("Couldn't read the image."))),
								"image/png",
							),
						);
			checkAbort(options.signal);
			return this.executor.run<string>("ocr", { image: blob, language }, options);
		}
		this.options = options;
		if (this.language !== language) this.dispose();
		this.language = language;
		this.options = options;
		const abort = () => this.dispose();
		options.signal?.addEventListener("abort", abort, { once: true });
		try {
			if (!this.worker) {
				progress(options, "Loading text recognition engine…", null, "loading");
				const current = this.generation;
				const { createWorker, OEM } = await import("tesseract.js");

				checkAbort(options.signal);
				let failed: (error: Error) => void = () => {};
				const initializationFailure = new Promise<OcrWorker>((_resolve, reject) => {
					failed = reject;
				});
				const creating = createWorker(language, OEM.LSTM_ONLY, {
					langPath: await assetBase("tessdata"),
					errorHandler: () =>
						failed(new Error("The OCR engine or language data could not load. Please retry.")),
					workerPath: `${await assetBase("tesseract")}/worker.min.js`,
					corePath: await assetBase("tesseract-core"),
					workerBlobURL: false,
					cacheMethod: "none",
					logger: (message) => {
						if (current !== this.generation || this.options.signal?.aborted) return;
						this.options.onProgress?.({
							stage: message.status === "recognizing text" ? "processing" : "loading",
							fraction: message.status === "recognizing text" ? message.progress : null,
							label:
								message.status === "recognizing text"
									? "Recognizing text…"
									: "Loading OCR engine and language…",
						});
					},
				});
				this.creating = Promise.race([creating, initializationFailure]);
				const worker = await abortable(this.creating, options.signal);
				if (current !== this.generation) {
					await worker.terminate();
					checkAbort(options.signal);
					throw new DOMException("Cancelled", "AbortError");
				}
				this.worker = worker;
				this.creating = null;
			}
			checkAbort(options.signal);
			return (await abortable(this.worker.recognize(image), options.signal)).data.text;
		} finally {
			options.signal?.removeEventListener("abort", abort);
			this.options = {};
		}
	}
	dispose() {
		this.executor?.dispose();
		this.generation++;
		if (this.worker) void this.worker.terminate();
		if (this.creating) void this.creating.then((worker) => worker.terminate()).catch(() => {});
		this.worker = null;
		this.creating = null;
		this.options = {};
	}
}
function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
	checkAbort(signal);
	return new Promise((resolve, reject) => {
		const abort = () => reject(new DOMException("Cancelled", "AbortError"));
		signal?.addEventListener("abort", abort, { once: true });
		promise.then(resolve, reject).finally(() => signal?.removeEventListener("abort", abort));
	});
}
export async function extractText(
	file: File,
	options: ExtractTextOptions = {},
): Promise<ExtractedText> {
	if (file.size > LIMITS.ocrBytes) throw new Error("Text extraction supports files up to 50 MiB.");
	const session = options.session ?? new OcrSession();
	const language = options.language ?? "eng";
	const pages: ExtractedPage[] = [];
	try {
		checkAbort(options.signal);
		if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
			const { loadPdf } = await import("../pdf/render");
			const task = await loadPdf(file);
			const abort = () => {
				void task.destroy();
			};
			options.signal?.addEventListener("abort", abort, { once: true });
			try {
				checkAbort(options.signal);
				const doc = await task.promise;
				if (doc.numPages > LIMITS.ocrPages)
					throw new Error("Text extraction supports PDFs up to 50 pages.");
				for (let i = 1; i <= doc.numPages; i++) {
					progress(options, `Reading page ${i} of ${doc.numPages}`, (i - 1) / doc.numPages);
					const page = await doc.getPage(i);
					try {
						const content = options.forceOcr ? null : await page.getTextContent();
						let text =
							content?.items
								.map((item) => ("str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : ""))
								.join("")
								.trim() ?? "";
						let method: ExtractedPage["method"] = "text";
						if (!text) {
							method = "ocr";
							const base = page.getViewport({ scale: 1 });
							const viewport = page.getViewport({
								scale: Math.min(150 / 72, 2400 / Math.max(base.width, base.height)),
							});
							const canvas = document.createElement("canvas");
							canvas.width = Math.ceil(viewport.width);
							canvas.height = Math.ceil(viewport.height);
							try {
								const ctx = canvas.getContext("2d");
								if (!ctx) throw new Error("Canvas is unavailable.");
								await page.render({ canvas, canvasContext: ctx, viewport, background: "white" })
									.promise;
								text = await session.recognize(canvas, language, {
									...options,
									onProgress: (p) =>
										options.onProgress?.({
											...p,
											label: `Page ${i}/${doc.numPages}: ${p.label}`,
											fraction:
												p.stage === "processing" && p.fraction !== null
													? (i - 1 + p.fraction) / doc.numPages
													: null,
										}),
								});
							} finally {
								canvas.width = canvas.height = 0;
							}
						}
						pages.push({
							page: i,
							text,
							method,
							warning: text.trim() ? undefined : "No readable text found on this page.",
						});
					} finally {
						page.cleanup();
					}
				}
			} finally {
				options.signal?.removeEventListener("abort", abort);
				await task.destroy();
			}
		} else {
			const bitmap = await decodeImage(file);
			const canvas = document.createElement("canvas");
			try {
				checkImageSize(bitmap.width, bitmap.height);
				canvas.width = bitmap.width;
				canvas.height = bitmap.height;
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("Canvas is unavailable.");
				ctx.fillStyle = "white";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(bitmap, 0, 0);
				const text = await session.recognize(canvas, language, options);
				pages.push({
					page: 1,
					text,
					method: "ocr",
					warning: text.trim() ? undefined : "No readable text found. Try a sharper image.",
				});
			} finally {
				bitmap.close();
				canvas.width = canvas.height = 0;
			}
		}
		progress(options, "Text ready", 1);
		return { pages, text: pages.map((page) => page.text).join("\f") };
	} catch (e) {
		checkAbort(options.signal);
		if ((e as { name?: string }).name === "PasswordException")
			throw new Error("This PDF is password-protected. Save an unlocked copy first.");
		throw e;
	} finally {
		if (!options.session) session.dispose();
	}
}
