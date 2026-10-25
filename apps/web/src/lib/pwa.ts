import { readThemeMode } from "@qbtools/ui/theme";
import { useSyncExternalStore } from "react";
import { THEME_COLOR, THEME_COLOR_LIGHT } from "./site";

/** The worker is served from the origin root so it can control every route. */
export const SW_URL = "/sw.js";
export const SW_SCOPE = "/";

/**
 * Opt-in flag for the service worker outside production.
 *
 * The worker is not registered on the dev server by default: it would cache
 * development modules and confuse hot reloads. Setting this key to "1" turns
 * it on, which is how the browser tests exercise it.
 */
export const SW_OPT_IN_KEY = "qbtools.sw";

export interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallState {
	/** A native install prompt is available (Chromium). */
	canInstall: boolean;
	/** The app is already running as an installed app. */
	installed: boolean;
	/** iOS Safari never fires beforeinstallprompt; it needs manual instructions. */
	needsIosHint: boolean;
}

const INITIAL_STATE: InstallState = { canInstall: false, installed: false, needsIosHint: false };

let state = INITIAL_STATE;
const listeners = new Set<() => void>();
let deferredPrompt: BeforeInstallPromptEvent | null = null;

function setState(next: Partial<InstallState>): void {
	state = { ...state, ...next };
	for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/** True when the app runs as an installed app rather than a browser tab. */
export function isStandalone(): boolean {
	if (typeof window === "undefined") return false;
	const nav = window.navigator as Navigator & { standalone?: boolean };
	return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** True for iOS Safari, which cannot show a native install prompt. */
export function isIosSafari(): boolean {
	if (typeof navigator === "undefined") return false;
	const agent = navigator.userAgent;
	const ios =
		/iPad|iPhone|iPod/.test(agent) ||
		(agent.includes("Macintosh") && typeof document !== "undefined" && "ontouchend" in document);
	const safari = /Safari/.test(agent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(agent);
	return ios && safari;
}

/** True when the worker should be registered for this session. */
export function shouldRegisterServiceWorker(): boolean {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
	if (import.meta.env.PROD) return true;
	try {
		return localStorage.getItem(SW_OPT_IN_KEY) === "1";
	} catch {
		return false;
	}
}

/** Register the worker. Returns null when registration is skipped or fails. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!shouldRegisterServiceWorker()) return null;
	try {
		return await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
	} catch (error) {
		console.warn("[pwa] The service worker could not be registered.", error);
		return null;
	}
}

/** Remember the deferred install prompt so a button can trigger it later. */
export function captureInstallPrompt(event: BeforeInstallPromptEvent): void {
	deferredPrompt = event;
	setState({ canInstall: true });
}

/** Record what the current browser already tells us about the install state. */
export function syncInstallState(): void {
	const installed = isStandalone();
	setState({ installed, needsIosHint: !installed && isIosSafari() });
}

/** Forget the install prompt once the app is installed. */
export function markInstalled(): void {
	deferredPrompt = null;
	setState({ canInstall: false, installed: true });
}

/** Show the native install prompt. Returns true when the user accepted. */
export async function promptInstall(): Promise<boolean> {
	if (!deferredPrompt) return false;
	const event = deferredPrompt;
	deferredPrompt = null;
	setState({ canInstall: false });
	try {
		await event.prompt();
		const choice = await event.userChoice;
		return choice.outcome === "accepted";
	} catch {
		return false;
	}
}

/** React state for the install button. */
export function useInstallState(): InstallState {
	return useSyncExternalStore(
		subscribe,
		() => state,
		() => INITIAL_STATE,
	);
}

/** True when the active theme renders the app on a dark background. */
export function isDarkTheme(): boolean {
	if (typeof window === "undefined") return true;
	const mode = readThemeMode();
	return (
		mode === "dark" ||
		(mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
	);
}

/** Keep the browser UI colour in step with the active theme. */
export function applyThemeColor(dark: boolean): void {
	const meta = document.querySelector('meta[name="theme-color"]');
	if (!meta) return;
	meta.setAttribute("content", dark ? THEME_COLOR : THEME_COLOR_LIGHT);
}
