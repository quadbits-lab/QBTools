import { cn } from "@qbtools/ui/utils";
import { useEffect, useRef } from "react";
import { parallaxProgress, resolveHologramPalette } from "#/lib/webgl/hologram-math";
import type { HologramScene } from "#/lib/webgl/hologram-scene";

/**
 * Decorative WebGL backdrop for the landing hero.
 *
 * The markup is server-rendered so the CSS artwork is always present; the
 * shader module is imported lazily on the client, after first paint, and every
 * listener is removed on unmount. Nothing here is interactive or exposed to
 * assistive technology.
 */
export function HeroHologram({ className }: { className?: string }) {
	const rootRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const root = rootRef.current;
		const canvas = canvasRef.current;
		if (!root || !canvas) return;

		const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const coarseQuery = window.matchMedia("(pointer: coarse)");

		let cancelled = false;
		let bootId = 0;
		let bootFrame = 0;
		let bootIdle = 0;
		let bootTimeout = 0;
		let scene: HologramScene | null = null;
		let inView = true;
		const cleanups: Array<() => void> = [];
		const idleWindow = window as Window & {
			requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
			cancelIdleCallback?: (handle: number) => void;
		};

		const markActive = (active: boolean) => {
			if (active) root.setAttribute("data-hologram-active", "true");
			else root.removeAttribute("data-hologram-active");
		};

		const readPalette = () => {
			const styles = getComputedStyle(document.documentElement);
			return resolveHologramPalette(
				(name) => styles.getPropertyValue(name),
				document.documentElement.classList.contains("light"),
			);
		};

		const updateScroll = () => {
			const rect = root.getBoundingClientRect();
			scene?.setScroll(parallaxProgress(rect.top, rect.height));
		};

		const syncRunning = () => {
			if (document.hidden || !inView) scene?.stop();
			else scene?.start();
		};

		const onPointerMove = (event: PointerEvent) => {
			scene?.setPointer(
				(event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
				-((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1),
			);
		};

		const onResize = () => {
			scene?.resize(root.clientWidth, root.clientHeight);
			updateScroll();
		};

		const teardownScene = () => {
			bootId += 1;
			if (bootFrame !== 0) cancelAnimationFrame(bootFrame);
			if (bootIdle !== 0) idleWindow.cancelIdleCallback?.(bootIdle);
			if (bootTimeout !== 0) clearTimeout(bootTimeout);
			bootFrame = 0;
			bootIdle = 0;
			bootTimeout = 0;
			for (const cleanup of cleanups.splice(0)) cleanup();
			scene?.dispose();
			scene = null;
			markActive(false);
		};

		const boot = async () => {
			if (cancelled || scene || motionQuery.matches) return;
			const id = bootId;
			// A failed chunk load must leave the CSS artwork in place, not reject.
			const shader = await import("#/lib/webgl/hologram-scene").catch(() => null);
			if (!shader || cancelled || id !== bootId || motionQuery.matches) return;

			const created = shader.createHologramScene(canvas, {
				coarsePointer: coarseQuery.matches,
				onActiveChange: markActive,
			});
			if (!created) return;
			scene = created;
			created.setPalette(readPalette());
			created.resize(root.clientWidth, root.clientHeight);
			updateScroll();

			const onScroll = () => updateScroll();
			const onVisibility = () => syncRunning();
			window.addEventListener("scroll", onScroll, { passive: true });
			window.addEventListener("resize", onResize);
			window.addEventListener("pointermove", onPointerMove, { passive: true });
			window.addEventListener("pointerdown", onPointerMove, { passive: true });
			cleanups.push(() => window.removeEventListener("scroll", onScroll));
			cleanups.push(() => window.removeEventListener("resize", onResize));
			cleanups.push(() => window.removeEventListener("pointermove", onPointerMove));
			cleanups.push(() => window.removeEventListener("pointerdown", onPointerMove));

			if (typeof ResizeObserver !== "undefined") {
				const resizeObserver = new ResizeObserver(onResize);
				resizeObserver.observe(root);
				cleanups.push(() => resizeObserver.disconnect());
			}

			if (typeof IntersectionObserver !== "undefined") {
				const intersectionObserver = new IntersectionObserver(
					(entries) => {
						const entry = entries[0];
						inView = entry ? entry.isIntersecting : true;
						syncRunning();
					},
					{ rootMargin: "200px" },
				);
				intersectionObserver.observe(root);
				cleanups.push(() => intersectionObserver.disconnect());
			}

			document.addEventListener("visibilitychange", onVisibility);
			cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

			const themeObserver = new MutationObserver(() => {
				scene?.setPalette(readPalette());
			});
			themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["class"],
			});
			cleanups.push(() => themeObserver.disconnect());

			// Start only if the hero is actually on screen and the tab is visible;
			// the observers resume it later otherwise.
			syncRunning();
			markActive(true);
		};

		const scheduleBoot = () => {
			if (cancelled || scene || motionQuery.matches) return;
			cancelAnimationFrame(bootFrame);
			const start = () => {
				bootIdle = 0;
				bootTimeout = 0;
				bootFrame = requestAnimationFrame(() => {
					bootFrame = requestAnimationFrame(() => {
						bootFrame = 0;
						void boot();
					});
				});
			};
			// Keep the shader upload and compile off the hydration/first-input path.
			if (typeof idleWindow.requestIdleCallback === "function") {
				bootIdle = idleWindow.requestIdleCallback(start, { timeout: 1500 });
			} else {
				bootTimeout = window.setTimeout(start, 200);
			}
		};

		const onMotionChange = () => {
			if (motionQuery.matches) teardownScene();
			else scheduleBoot();
		};

		motionQuery.addEventListener("change", onMotionChange);
		if (!motionQuery.matches) scheduleBoot();

		return () => {
			cancelled = true;
			motionQuery.removeEventListener("change", onMotionChange);
			teardownScene();
		};
	}, []);

	return (
		<div
			ref={rootRef}
			data-hologram-root=""
			aria-hidden="true"
			className={cn("hero-holo", className)}
		>
			<div className="hero-holo-fallback" />
			<canvas ref={canvasRef} className="hero-holo-canvas" />
			<div className="hero-holo-scrim" />
		</div>
	);
}
