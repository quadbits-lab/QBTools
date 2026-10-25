import type { JobStatus, ProcessingProgress } from "@qbtools/engines/processing";

type FileJobStatus = JobStatus | "working";

export interface FileJob {
	id: string;
	file: File;
	status: FileJobStatus;
	progress?: ProcessingProgress;
	result?: { blob: Blob; name: string; note?: string };
	error?: string;
}

let jobCounter = 0;
export const makeJob = (file: File): FileJob => ({
	id: `job-${++jobCounter}`,
	file,
	status: "queued",
});
