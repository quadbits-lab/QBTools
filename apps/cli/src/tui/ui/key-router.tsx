/**
 * Key router — the single keyboard owner of the TUI.
 *
 * Ink delivers every keystroke to every mounted `useInput` hook, so the app
 * must arbitrate. This provider owns ONE `useInput` and dispatches each
 * keystroke to registered handlers ordered by priority (highest first, then
 * most recently registered). The first handler that returns `true` consumes
 * the key; the rest never see it.
 *
 * Priorities used by the app:
 *   10  text input / textarea / select widget (owns the keyboard)
 *    0  the active screen
 *  -10  the app shell (Ctrl+C, help)
 */

import { type Key, useInput, useStdin } from "ink";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from "react";

export type KeyHandler = (input: string, key: Key) => boolean | undefined;

/** Key priorities — widgets beat cards, cards beat screens, screens beat the shell. */
export const WIDGET_KEY_PRIORITY = 10;
export const CARD_KEY_PRIORITY = 5;
export const SCREEN_KEY_PRIORITY = 0;
export const SHELL_KEY_PRIORITY = -10;

export interface KeyHandlerOptions {
	/** Skip dispatch while false (component not focused). */
	active?: boolean;
	/** Higher priority handlers run first. */
	priority?: number;
}

interface Registration {
	id: number;
	handler: KeyHandler;
	active: boolean;
	priority: number;
	order: number;
}

interface RouterApi {
	register(registration: Omit<Registration, "id" | "order">): number;
	unregister(id: number): void;
	update(id: number, patch: Partial<Pick<Registration, "active" | "priority">>): void;
}

const KeyRouterContext = createContext<RouterApi | null>(null);

export function KeyRouterProvider(props: { children: ReactNode }) {
	const { isRawModeSupported } = useStdin();
	const registrations = useRef(new Map<number, Registration>());
	const nextId = useRef(1);
	const order = useRef(0);

	const register = useCallback((registration: Omit<Registration, "id" | "order">) => {
		const id = nextId.current++;
		order.current += 1;
		registrations.current.set(id, { ...registration, id, order: order.current });
		return id;
	}, []);

	const unregister = useCallback((id: number) => {
		registrations.current.delete(id);
	}, []);

	const update = useCallback((id: number, patch: Partial<Registration>) => {
		const existing = registrations.current.get(id);
		if (existing) registrations.current.set(id, { ...existing, ...patch });
	}, []);

	const api = useMemo<RouterApi>(
		() => ({ register, unregister, update }),
		[register, unregister, update],
	);

	const dispatch = useCallback((input: string, key: Key) => {
		const active = [...registrations.current.values()].filter((entry) => entry.active);
		active.sort((a, b) => b.priority - a.priority || b.order - a.order);
		for (const entry of active) {
			if (entry.handler(input, key) === true) return;
		}
	}, []);

	// One subscription for the whole app. `isActive` is false when the
	// process has no TTY, which keeps Ink from throwing on raw mode.
	useInput(dispatch, { isActive: isRawModeSupported });

	return <KeyRouterContext.Provider value={api}>{props.children}</KeyRouterContext.Provider>;
}

/**
 * Register a key handler for as long as the component is mounted.
 * The handler may change every render; the latest version is always used.
 */
export function useKeyHandler(handler: KeyHandler, options?: KeyHandlerOptions): void {
	const router = useContext(KeyRouterContext);
	if (!router) throw new Error("useKeyHandler must be used inside <KeyRouterProvider>");
	const { active = true, priority = 0 } = options ?? {};
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	const idRef = useRef<number | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: registration happens once so the dispatch order is stable; active/priority are updated in the effect below
	useEffect(() => {
		const id = router.register({
			handler: (input, key) => handlerRef.current(input, key),
			active,
			priority,
		});
		idRef.current = id;
		return () => {
			router.unregister(id);
			idRef.current = null;
		};
		// Registration happens once: re-registering would reset dispatch order.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router]);

	useEffect(() => {
		const id = idRef.current;
		if (id === null) return;
		router.update(id, { active, priority });
	}, [router, active, priority]);
}
