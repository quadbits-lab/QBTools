/**
 * Best-effort localStorage autosave for design editors. Writes are debounced
 * and quota-safe: designs embedding large raster artwork may exceed the
 * storage budget, in which case autosave silently stops persisting.
 */
import { useEffect } from "react";

export function readAutosave<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

export function clearAutosave(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch {
		// Ignore — clearing is best-effort too.
	}
}

export function useAutosave<T>(key: string, value: T, delayMs = 600): void {
	useEffect(() => {
		const timer = setTimeout(() => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch {
				// Quota exceeded (large artwork) — autosave is best-effort only.
			}
		}, delayMs);
		return () => clearTimeout(timer);
	}, [key, value, delayMs]);
}
