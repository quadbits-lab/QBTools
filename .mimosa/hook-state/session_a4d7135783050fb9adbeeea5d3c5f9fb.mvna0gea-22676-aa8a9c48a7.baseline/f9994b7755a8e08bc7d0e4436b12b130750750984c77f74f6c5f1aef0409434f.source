/**
 * Undo/redo history for design editors. Discrete edits commit a history
 * entry; rapid control changes coalesce; drags update live and push the
 * pre-drag snapshot when — and only when — the design actually changed.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const HISTORY_LIMIT = 50;
const COALESCE_MS = 400;

interface HistoryState<D> {
	design: D;
	past: D[];
	future: D[];
}

export interface DesignHistory<D> {
	design: D;
	/** Discrete change: push the current design onto the stack, then apply. */
	commit: (next: D) => void;
	/** Rapid changes (sliders, typing): the first change in a burst commits. */
	update: (mutate: (draft: D) => D) => void;
	/** Start a pointer interaction; call endInteraction on release. */
	beginInteraction: () => void;
	/** Apply a change without touching history during an interaction. */
	setLive: (next: D) => void;
	/** Mutate the design without touching history during an interaction. */
	updateLive: (mutate: (draft: D) => D) => void;
	/** Push the beginInteraction snapshot if the design changed; no-op drags never pollute history. */
	endInteraction: () => void;
	undo: () => void;
	redo: () => void;
	/** Replace the design wholesale (project import) and clear history. */
	replace: (next: D) => void;
	canUndo: boolean;
	canRedo: boolean;
}

export function useDesignHistory<D>(initial: D | (() => D)): DesignHistory<D> {
	const [state, setState] = useState<HistoryState<D>>(() => ({
		design: typeof initial === "function" ? (initial as () => D)() : initial,
		past: [],
		future: [],
	}));
	const ref = useRef(state);
	ref.current = state;
	const lastCommitAt = useRef(0);
	const interactionStart = useRef<D | null>(null);

	const commit = useCallback((next: D) => {
		const h = ref.current;
		ref.current = { design: next, past: [...h.past, h.design].slice(-HISTORY_LIMIT), future: [] };
		lastCommitAt.current = Date.now();
		setState(ref.current);
	}, []);

	const update = useCallback((mutate: (draft: D) => D) => {
		const h = ref.current;
		if (Date.now() - lastCommitAt.current > COALESCE_MS) {
			ref.current = {
				design: mutate(h.design),
				past: [...h.past, h.design].slice(-HISTORY_LIMIT),
				future: [],
			};
			lastCommitAt.current = Date.now();
		} else {
			ref.current = { ...h, design: mutate(h.design) };
		}
		setState(ref.current);
	}, []);

	const beginInteraction = useCallback(() => {
		interactionStart.current = ref.current.design;
	}, []);

	const setLive = useCallback((next: D) => {
		ref.current = { ...ref.current, design: next };
		setState(ref.current);
	}, []);

	const updateLive = useCallback((mutate: (draft: D) => D) => {
		ref.current = { ...ref.current, design: mutate(ref.current.design) };
		setState(ref.current);
	}, []);

	const endInteraction = useCallback(() => {
		const start = interactionStart.current;
		interactionStart.current = null;
		if (start === null || start === ref.current.design) return;
		const h = ref.current;
		ref.current = { design: h.design, past: [...h.past, start].slice(-HISTORY_LIMIT), future: [] };
		lastCommitAt.current = Date.now();
		setState(ref.current);
	}, []);

	const undo = useCallback(() => {
		const h = ref.current;
		if (h.past.length === 0) return;
		const prev = h.past[h.past.length - 1] as D;
		ref.current = {
			design: prev,
			past: h.past.slice(0, -1),
			future: [h.design, ...h.future].slice(0, HISTORY_LIMIT),
		};
		setState(ref.current);
	}, []);

	const redo = useCallback(() => {
		const h = ref.current;
		if (h.future.length === 0) return;
		const next = h.future[0] as D;
		ref.current = {
			design: next,
			past: [...h.past, h.design].slice(-HISTORY_LIMIT),
			future: h.future.slice(1),
		};
		setState(ref.current);
	}, []);

	const replace = useCallback((next: D) => {
		ref.current = { design: next, past: [], future: [] };
		lastCommitAt.current = Date.now();
		setState(ref.current);
	}, []);

	return {
		design: state.design,
		commit,
		update,
		beginInteraction,
		setLive,
		updateLive,
		endInteraction,
		undo,
		redo,
		replace,
		canUndo: state.past.length > 0,
		canRedo: state.future.length > 0,
	};
}

/** ⌘Z / ⌘⇧Z (Ctrl on Windows/Linux) while not focused on a text control. */
export function useUndoHotkeys(undo: () => void, redo: () => void, enabled = true) {
	useEffect(() => {
		if (!enabled) return;
		const onKey = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
			if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
			e.preventDefault();
			if (e.shiftKey) redo();
			else undo();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [undo, redo, enabled]);
}
