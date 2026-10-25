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

	// `design` is the render trigger: dropping it from the deps would leave
	// the preview stale once the previous render settles.
	// biome-ignore lint/correctness/useExhaustiveDependencies: design intentionally retriggers the debounced render
	useEffect(() => {
		const timer = setTimeout(() => void rerun(), debounceMs);
		return () => clearTimeout(timer);
	}, [rerun, debounceMs, design]);

	return state;
}

export interface MultiPreviewEntry<D> {
	key: string;
	/** Null entries are skipped — used to switch variants on and off. */
	design: D | null;
}

export interface MultiPreviewState {
	byKey: Record<string, { blob: Blob | null; busy: boolean }>;
	busy: boolean;
	warnings: DesignWarning[];
}

/**
 * Debounced previews for several designs rendered sequentially on one worker
 * (e.g. base icon + dark/tinted variants). Unchanged designs are skipped by
 * reference, so disabled variants cost nothing.
 */
export function useGraphicPreviews<D>(
	items: MultiPreviewEntry<D>[],
	render: (design: D) => Promise<{ blob: Blob; warnings: DesignWarning[] }>,
	debounceMs = 120,
): MultiPreviewState {
	const [state, setState] = useState<MultiPreviewState>({
		byKey: {},
		busy: false,
		warnings: [],
	});
	const latest = useRef(items);
	latest.current = items;
	const lastRendered = useRef<Partial<Record<string, D>>>({});
	const running = useRef(false);

	const rerun = useCallback(async () => {
		if (running.current) return;
		running.current = true;
		const snapshot = latest.current;
		const warnings: DesignWarning[] = [];
		setState((s) => ({ ...s, busy: true }));
		try {
			for (const item of snapshot) {
				if (!item.design || lastRendered.current[item.key] === item.design) continue;
				setState((s) => ({
					...s,
					byKey: {
						...s.byKey,
						[item.key]: { blob: s.byKey[item.key]?.blob ?? null, busy: true },
					},
				}));
				try {
					const out = await render(item.design);
					// Store only when this is still the current design for the key.
					if (latest.current.find((i) => i.key === item.key)?.design === item.design) {
						lastRendered.current[item.key] = item.design;
						setState((s) => ({
							...s,
							byKey: { ...s.byKey, [item.key]: { blob: out.blob, busy: false } },
						}));
					}
				} catch (error) {
					if (!isAbort(error) && error instanceof Error)
						warnings.push({ kind: "generic", message: error.message });
					setState((s) => ({
						...s,
						byKey: {
							...s.byKey,
							[item.key]: { blob: s.byKey[item.key]?.blob ?? null, busy: false },
						},
					}));
				}
			}
		} finally {
			running.current = false;
			setState((s) => ({ ...s, busy: false, warnings }));
			// Designs changed while rendering — run another pass.
			if (latest.current !== snapshot) void rerun();
		}
	}, [render]);

	// `items` (memoized by the caller) is the render trigger for new designs.
	// biome-ignore lint/correctness/useExhaustiveDependencies: items intentionally retriggers the debounced render pass
	useEffect(() => {
		const timer = setTimeout(() => void rerun(), debounceMs);
		return () => clearTimeout(timer);
	}, [rerun, debounceMs, items]);

	return state;
}
