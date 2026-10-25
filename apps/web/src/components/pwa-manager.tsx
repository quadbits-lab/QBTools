import { onThemeChange } from "@qbtools/ui/theme";
import { toast } from "@qbtools/ui/toaster";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
	applyThemeColor,
	type BeforeInstallPromptEvent,
	captureInstallPrompt,
	isDarkTheme,
	markInstalled,
	registerServiceWorker,
	syncInstallState,
} from "#/lib/pwa";

/**
 * Progressive Web App wiring: registers the service worker, surfaces a new
 * version when one is waiting, tracks the install prompt and keeps the browser
 * UI colour in step with the theme.
 *
 * Renders nothing — the install button lives in the site header.
 */
export function PwaManager() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
	const reloadingRef = useRef(false);

	useEffect(() => {
		syncInstallState();

		const onBeforeInstallPrompt = (event: Event) => {
			// Chromium offers the native prompt; we show our own button instead.
			event.preventDefault();
			captureInstallPrompt(event as BeforeInstallPromptEvent);
		};
		const onInstalled = () => {
			markInstalled();
			toast.success("QBTools is installed.", { description: "It now opens in its own window." });
		};
		window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);

	useEffect(() => {
		let cancelled = false;

		const announceUpdate = (registration: ServiceWorkerRegistration) => {
			const waiting = registration.waiting;
			if (!waiting) return;
			toast("A new version of QBTools is ready.", {
				description: "Reload to pick up the latest tools and fixes.",
				duration: Infinity,
				action: {
					label: "Reload",
					onClick: () => {
						reloadingRef.current = true;
						waiting.postMessage({ type: "SKIP_WAITING" });
					},
				},
			});
		};

		const watchForUpdates = (registration: ServiceWorkerRegistration) => {
			registration.addEventListener("updatefound", () => {
				const installing = registration.installing;
				if (!installing) return;
				installing.addEventListener("statechange", () => {
					if (installing.state !== "installed") return;
					// A controller means this is an update, not the first install.
					if (!navigator.serviceWorker.controller) return;
					announceUpdate(registration);
				});
			});
			announceUpdate(registration);
		};

		void registerServiceWorker().then((registration) => {
			if (cancelled || !registration) return;
			registrationRef.current = registration;
			watchForUpdates(registration);
			registration.update().catch(() => undefined);
		});

		const onControllerChange = () => {
			if (!reloadingRef.current) return;
			reloadingRef.current = false;
			window.location.reload();
		};
		navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);

		return () => {
			cancelled = true;
			navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
		};
	}, []);

	useEffect(() => {
		// Navigating re-renders the document head, which resets the meta tag.
		if (pathname) applyThemeColor(isDarkTheme());
		return onThemeChange(() => applyThemeColor(isDarkTheme()));
	}, [pathname]);

	return null;
}
