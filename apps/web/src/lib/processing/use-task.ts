import type { JobStatus, ProcessingOptions, ProcessingProgress } from "@qbtools/engines/processing";
import { useCallback, useEffect, useRef, useState } from "react";

/** Cancels on replacement/unmount and prevents stale results from being published. */
export function useTask<T>() {
	const controller = useRef<AbortController | null>(null);
	const generation = useRef(0);
	const [status, setStatus] = useState<JobStatus>("queued");
	const [result, setResult] = useState<T | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState<ProcessingProgress | null>(null);
	const cancel = useCallback(() => {
		generation.current++;
		controller.current?.abort();
		controller.current = null;
		setStatus("cancelled");
		setProgress(null);
	}, []);
	const reset = useCallback(() => {
		cancel();
		setResult(null);
		setError(null);
		setStatus("queued");
	}, [cancel]);
	useEffect(
		() => () => {
			generation.current++;
			controller.current?.abort();
		},
		[],
	);
	const run = useCallback(async (work: (options: ProcessingOptions) => Promise<T>) => {
		controller.current?.abort();
		const current = ++generation.current;
		const ctrl = new AbortController();
		controller.current = ctrl;
		setResult(null);
		setError(null);
		setProgress(null);
		setStatus("loading");
		try {
			const value = await work({
				signal: ctrl.signal,
				onProgress: (p) => {
					if (generation.current === current) {
						setProgress(p);
						setStatus(p.stage);
					}
				},
			});
			if (current === generation.current && !ctrl.signal.aborted) {
				setResult(value);
				setStatus("done");
			}
		} catch (e) {
			if (current !== generation.current) return;
			if (ctrl.signal.aborted || (e instanceof Error && e.name === "AbortError"))
				setStatus("cancelled");
			else {
				setError(e instanceof Error ? e.message : "Processing failed. Please try again.");
				setStatus("error");
			}
		} finally {
			if (current === generation.current) {
				setProgress(null);
				controller.current = null;
			}
		}
	}, []);
	return {
		status,
		result,
		setResult,
		error,
		progress,
		busy: status === "loading" || status === "processing",
		run,
		cancel,
		reset,
	};
}
