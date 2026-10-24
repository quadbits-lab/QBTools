/**
 * Debounced preview renderer: coalesces rapid edits with a 100 ms debounce,
 * keeps one active render, and discards stale revisions by generation.
 * Exports bypass this pipeline and are prioritized by their own worker.
 */
import type { DesignWarning } from "@qbtools/engines/graphic";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PreviewResult {
	blob: Blob | null;
	busy: boolean;
	warnings: DesignWarning[];
}

function isAbort(error: unknown): boolean {
	return (
		error instanceof DOMException ||
		(error instanceof Error && (error.name === "AbortError" || error.message.includes("aborted")))
	);
}

export function useGraphicPreview<D>(
	design: D,
	render: (design: D) => Promise<{ blob: Blob; warnings: DesignWarning[] }>,
	debounceMs = 100,
): PreviewResult {
	const [state, setState] = useState<PreviewResult>({ blob: null, busy: false, warnings: [] });
	const latest = useRef<D>(design);
	latest.current = design;
	const lastTarget = useRef<D | null>(null);
	const running = useRef(false);

	const rerun = useCallback(async () => {
		if (running.current) return; // the in-flight run reschedules itself
		const target = latest.current;
		lastTarget.current = target;
		running.current = true;
		setState((s) => ({ ...s, busy: true }));
		try {
			const out = await render(target);
			if (latest.current !== lastTarget.current) {
				// A newer revision arrived while rendering — chain a fresh render.
				running.current = false;
				void rerun();
				return;
			}
			setState({ blob: out.blob, busy: false, warnings: out.warnings });
		} catch (error) {
			if (!isAbort(error)) {
				const message =
					error instanceof Error ? error.message : "Preview failed. Please try again.";
				setState((s) => ({
					blob: s.blob,
					busy: false,
					warnings: [{ kind: "generic" as const, message }],
				}));
			} else {
				setState((s) => ({ ...s, busy: false }));
			}
		} finally {
			running.current = false;
		}
	}, [render]);

	useEffect(() => {
		const timer = setTimeout(() => void rerun(), debounceMs);
		return () => clearTimeout(timer);
	}, [design, rerun, debounceMs]);

	return state;
}
