import type { ProcessingOptions, ProcessingProgress } from "@qbtools/engines/processing";
import { checkAbort } from "@qbtools/engines/processing";

export interface WorkerReply {
	id: number;
	result?: unknown;
	progress?: ProcessingProgress;
	error?: string;
}
/** One owner per tool session. Cancellation also interrupts synchronous WASM. */
export class ProcessingWorker {
	private worker: Worker | null = null;
	private nextId = 0;
	private active: { reject: (error: Error) => void; cleanup: () => void } | null = null;

	async run<T>(
		operation: string,
		payload: unknown,
		options: ProcessingOptions = {},
		transfer: Transferable[] = [],
	): Promise<T> {
		checkAbort(options.signal);
		if (this.active) throw new Error("A processing job is already running.");
		this.worker ??= new Worker(new URL("../../workers/processing.ts", import.meta.url), {
			type: "module",
		});
		const worker = this.worker;
		const id = ++this.nextId;
		return new Promise<T>((resolve, reject) => {
			const cleanup = () => {
				options.signal?.removeEventListener("abort", abort);
				worker.onmessage = null;
				worker.onerror = null;
				this.active = null;
			};
			const abort = () => this.dispose();
			this.active = { reject, cleanup };
			options.signal?.addEventListener("abort", abort, { once: true });
			worker.onerror = () => {
				cleanup();
				worker.terminate();
				this.worker = null;
				reject(new Error("The processing engine couldn't load. Please try again."));
			};
			worker.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
				if (data.id !== id) return;
				if (data.progress) {
					options.onProgress?.(data.progress);
					return;
				}
				cleanup();
				if (data.error) {
					worker.terminate();
					this.worker = null;
					reject(new Error(data.error));
				} else resolve(data.result as T);
			};
			try {
				worker.postMessage({ id, operation, payload }, transfer);
			} catch (error) {
				cleanup();
				reject(error);
			}
		});
	}
	dispose() {
		const active = this.active;
		active?.cleanup();
		this.worker?.terminate();
		this.worker = null;
		active?.reject(new DOMException("Cancelled", "AbortError"));
	}
}
