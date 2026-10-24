import { useSyncExternalStore } from "react";

/**
 * Tiny typed localStorage store shared across components, SSR-safe:
 * the server snapshot is always `fallback`.
 */
export function createLocalStore<T>(key: string, fallback: T) {
	const listeners = new Set<() => void>();
	let cache: { raw: string | null; value: T } | undefined;

	const read = (): T => {
		let raw: string | null = null;
		try {
			raw = localStorage.getItem(key);
		} catch {
			return fallback;
		}
		if (cache && cache.raw === raw) return cache.value;
		let value = fallback;
		try {
			value = raw === null ? fallback : (JSON.parse(raw) as T);
		} catch {
			value = fallback;
		}
		cache = { raw, value };
		return value;
	};

	const write = (next: T) => {
		try {
			localStorage.setItem(key, JSON.stringify(next));
		} catch {
			// Storage full or blocked: keep working in memory for this page view.
			cache = { raw: JSON.stringify(next), value: next };
		}
		for (const listener of listeners) listener();
	};

	const subscribe = (listener: () => void) => {
		listeners.add(listener);
		const onStorage = (event: StorageEvent) => {
			if (event.key === key) listener();
		};
		window.addEventListener("storage", onStorage);
		return () => {
			listeners.delete(listener);
			window.removeEventListener("storage", onStorage);
		};
	};

	return {
		read,
		write,
		update: (fn: (current: T) => T) => write(fn(read())),
		use: () => useSyncExternalStore(subscribe, read, () => fallback),
	};
}

const MAX_RECENT = 8;
export const recentTools = createLocalStore<string[]>("qbtools.recent", []);
export const favoriteTools = createLocalStore<string[]>("qbtools.favorites", []);

export function markToolUsed(slug: string) {
	recentTools.update((list) => [slug, ...list.filter((s) => s !== slug)].slice(0, MAX_RECENT));
}

export function toggleFavorite(slug: string) {
	favoriteTools.update((list) =>
		list.includes(slug) ? list.filter((s) => s !== slug) : [slug, ...list],
	);
}
