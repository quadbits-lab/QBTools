import type { ProcessingOptions } from "@qbtools/engines/processing";
import type { FileJob } from "./file-jobs";
import { makeJob } from "./file-jobs";

type Work = (file: File, options: ProcessingOptions) => Promise<FileJob["result"]>;
export class FileQueue {
	private jobs: FileJob[] = [];
	private pending: { job: FileJob; work: Work }[] = [];
	private active: { id: string; controller: AbortController } | null = null;
	private draining = false;
	private disposed = false;
	constructor(private changed: (jobs: FileJob[]) => void) {}
	private update(id: string, patch: Partial<FileJob>) {
		this.jobs = this.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
		this.changed([...this.jobs]);
	}
	add(files: File[], work: Work) {
		const jobs = files.map(makeJob);
		this.jobs.push(...jobs);
		this.pending.push(...jobs.map((job) => ({ job, work })));
		this.changed([...this.jobs]);
		void this.drain();
	}
	remove(id: string) {
		this.pending = this.pending.filter(({ job }) => job.id !== id);
		if (this.active?.id === id) this.active.controller.abort();
		this.jobs = this.jobs.filter((job) => job.id !== id);
		this.changed([...this.jobs]);
	}
	clear() {
		for (const job of [...this.jobs]) this.remove(job.id);
	}
	activate() {
		this.disposed = false;
	}
	dispose() {
		this.disposed = true;
		this.active?.controller.abort();
		this.pending = [];
	}
	private async drain() {
		if (this.draining) return;
		this.draining = true;
		try {
			while (this.pending.length && !this.disposed) {
				const next = this.pending.shift();
				if (!next) break;
				const { job, work } = next;
				const controller = new AbortController();
				this.active = { id: job.id, controller };
				this.update(job.id, { status: "loading" });
				try {
					const result = await work(job.file, {
						signal: controller.signal,
						onProgress: (progress) => this.update(job.id, { status: progress.stage, progress }),
					});
					if (!controller.signal.aborted && !this.disposed)
						this.update(job.id, { status: "done", result, progress: undefined });
				} catch (e) {
					if (!this.disposed)
						this.update(job.id, {
							status: controller.signal.aborted ? "cancelled" : "error",
							progress: undefined,
							error: controller.signal.aborted
								? undefined
								: e instanceof Error
									? e.message
									: "Processing failed.",
						});
				} finally {
					this.active = null;
				}
			}
		} finally {
			this.draining = false;
		}
	}
}
