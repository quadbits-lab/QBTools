export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "qbtools.theme";
const THEME_EVENT = "qbtools:theme";

/**
 * Inline script for <head>: applies the stored theme before first paint so
 * there is no light/dark flash. System preference is read in JS only.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('${THEME_STORAGE_KEY}');if(m!=='light'&&m!=='dark')m='system';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export function readThemeMode(): ThemeMode {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		return stored === "light" || stored === "dark" ? stored : "system";
	} catch {
		return "system";
	}
}

export function applyThemeMode(mode: ThemeMode) {
	const dark =
		mode === "dark" ||
		(mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
	const root = document.documentElement;
	root.classList.toggle("dark", dark);
	root.style.colorScheme = dark ? "dark" : "light";
}

export function setThemeMode(mode: ThemeMode) {
	try {
		if (mode === "system") localStorage.removeItem(THEME_STORAGE_KEY);
		else localStorage.setItem(THEME_STORAGE_KEY, mode);
	} catch {
		// Storage blocked: still apply for this page view.
	}
	applyThemeMode(mode);
	window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT, { detail: mode }));
}

/** Subscribe to theme changes from any toggle; returns an unsubscribe fn. */
export function onThemeChange(listener: (mode: ThemeMode) => void) {
	const handler = (event: Event) => listener((event as CustomEvent<ThemeMode>).detail);
	window.addEventListener(THEME_EVENT, handler);
	const media = window.matchMedia("(prefers-color-scheme: dark)");
	const onMedia = () => {
		if (readThemeMode() === "system") applyThemeMode("system");
	};
	media.addEventListener("change", onMedia);
	return () => {
		window.removeEventListener(THEME_EVENT, handler);
		media.removeEventListener("change", onMedia);
	};
}
