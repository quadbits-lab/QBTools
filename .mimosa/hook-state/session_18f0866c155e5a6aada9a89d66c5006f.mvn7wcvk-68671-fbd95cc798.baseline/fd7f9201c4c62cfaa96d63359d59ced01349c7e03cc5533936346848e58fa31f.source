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
export const guestRecentTools = createLocalStore<string[]>("qbtools.recent", []);
export const guestFavoriteTools = createLocalStore<string[]>("qbtools.favorites", []);
let account: {
	favorites: string[];
	recent: string[];
	save: (kind: "favorite" | "recent" | "clear", slug: string, saved?: boolean) => void;
} | null = null;
const personalListeners = new Set<() => void>();
export function setAccountTools(next: typeof account) {
	account = next;
	for (const listener of personalListeners) listener();
}
function toolStore(kind: "favorites" | "recent", guest: typeof guestFavoriteTools) {
	const read = () => account?.[kind] ?? guest.read();
	const subscribe = (listener: () => void) => {
		personalListeners.add(listener);
		const onStorage = () => listener();
		window.addEventListener("storage", onStorage);
		return () => {
			personalListeners.delete(listener);
			window.removeEventListener("storage", onStorage);
		};
	};
	const write = (next: string[]) => {
		if (account && kind === "recent") account.save("clear", "");
		else {
			guest.write(next);
			for (const listener of personalListeners) listener();
		}
	};
	return { read, write, use: () => useSyncExternalStore(subscribe, read, () => EMPTY_TOOLS) };
}
const EMPTY_TOOLS: string[] = [];
export const recentTools = toolStore("recent", guestRecentTools);
export const favoriteTools = toolStore("favorites", guestFavoriteTools);

export function markToolUsed(slug: string) {
	if (account) {
		account.save("recent", slug);
		return;
	}
	guestRecentTools.update((list) => [slug, ...list.filter((s) => s !== slug)].slice(0, MAX_RECENT));
	for (const listener of personalListeners) listener();
}

export function toggleFavorite(slug: string) {
	if (account) {
		account.save("favorite", slug, !account.favorites.includes(slug));
		return;
	}
	guestFavoriteTools.update((list) =>
		list.includes(slug) ? list.filter((s) => s !== slug) : [slug, ...list],
	);
	for (const listener of personalListeners) listener();
}
