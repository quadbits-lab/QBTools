import { useEffect, useState } from "react";
import type { FileJob } from "#/components/kit/file-results";
import { FileQueue } from "./file-queue";
export function useFileQueue() {
	const [jobs, setJobs] = useState<FileJob[]>([]);
	const [queue] = useState(() => new FileQueue(setJobs));
	useEffect(() => {
		queue.activate();
		return () => queue.dispose();
	}, [queue]);
	return {
		jobs,
		queue,
		busy: jobs.some((j) => ["loading", "processing", "queued"].includes(j.status)),
	};
}
