/**
 * Pure helpers for the landing-hero hologram.
 *
 * Everything here is DOM-free so the shader inputs can be unit-tested without
 * a browser or a GPU. Colors are normalised sRGB components (0..1), ready to
 * upload straight into `vec3` uniforms.
 */

export type Rgb = readonly [number, number, number];

export interface HologramPalette {
	/** Page background, used as the shader base so edges blend seamlessly. */
	background: Rgb;
	/** Brightest neutral (foreground gray). */
	primary: Rgb;
	/** Mid neutral (muted gray). */
	secondary: Rgb;
	/** Deepest neutral (subtle gray). */
	accent: Rgb;
	/** Overall detail strength; the light theme is deliberately quieter. */
	intensity: number;
	/** Light themes composite the field as a tint instead of an emissive glow. */
	light: boolean;
}

/** Neutral token values from `packages/ui/src/theme.css` (fallbacks only). */
const DARK_FALLBACK = {
	background: [0.0667, 0.0667, 0.0667],
	primary: [0.9725, 0.9725, 0.9725],
	secondary: [0.7176, 0.7176, 0.7176],
	accent: [0.5608, 0.5608, 0.5608],
} as const satisfies Record<keyof Omit<HologramPalette, "intensity" | "light">, Rgb>;

const LIGHT_FALLBACK = {
	background: [1, 1, 1],
	primary: [0.051, 0.051, 0.051],
	secondary: [0.3333, 0.3333, 0.3333],
	accent: [0.3882, 0.3882, 0.3882],
} as const satisfies Record<keyof Omit<HologramPalette, "intensity" | "light">, Rgb>;

const DEFAULT_MAX_PIXELS = 2_400_000;
const DESKTOP_DPR_CAP = 1.75;
const MOBILE_DPR_CAP = 1.25;

export function clamp01(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.min(1, Math.max(0, value));
}

/**
 * Scroll progress through the hero: 0 while its top is at or below the viewport
 * top, 1 once it has scrolled out by its own height. Overscroll never escapes
 * the range, so the shader never jumps at the start or end of the page.
 */
export function parallaxProgress(heroTop: number, heroHeight: number): number {
	if (!Number.isFinite(heroTop) || !Number.isFinite(heroHeight) || heroHeight <= 0) return 0;
	return clamp01(-heroTop / heroHeight);
}

/** Cap the backing buffer: retina density on desktop, lighter on touch devices. */
export function preferredDpr(devicePixelRatio: number, coarsePointer: boolean): number {
	const dpr = Number.isFinite(devicePixelRatio) ? Math.max(1, devicePixelRatio) : 1;
	return Math.min(dpr, coarsePointer ? MOBILE_DPR_CAP : DESKTOP_DPR_CAP);
}

/**
 * Drawing-buffer size for the canvas, clamped to a pixel budget so 5K or
 * multi-monitor setups cannot allocate an enormous GPU surface.
 */
export function drawingBufferSize(
	cssWidth: number,
	cssHeight: number,
	dpr: number,
	maxPixels: number = DEFAULT_MAX_PIXELS,
): { width: number; height: number } {
	const width = cssWidth * dpr;
	const height = cssHeight * dpr;
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
		return { width: 1, height: 1 };
	}
	const limit = Number.isFinite(maxPixels) && maxPixels > 0 ? maxPixels : DEFAULT_MAX_PIXELS;
	const pixels = width * height;
	const scale = pixels > limit ? Math.sqrt(limit / pixels) : 1;
	// Floor (not round) keeps the rounded-up product from exceeding the budget.
	return {
		width: Math.max(1, Math.floor(width * scale)),
		height: Math.max(1, Math.floor(height * scale)),
	};
}

function channelFromHex(hex: string, start: number, length: number): number {
	const value = hex.slice(start, start + length);
	return Number.parseInt(length === 1 ? value + value : value, 16) / 255;
}

/** Parse the hex and `rgb()`/`rgba()` forms emitted by our design tokens. */
export function parseCssColor(value: string): Rgb | null {
	const input = value.trim().toLowerCase();
	if (!input) return null;

	if (input.startsWith("#")) {
		const hex = input.slice(1);
		if (!/^[0-9a-f]+$/.test(hex)) return null;
		if (hex.length === 3 || hex.length === 4) {
			return [channelFromHex(hex, 0, 1), channelFromHex(hex, 1, 1), channelFromHex(hex, 2, 1)];
		}
		if (hex.length === 6 || hex.length === 8) {
			return [channelFromHex(hex, 0, 2), channelFromHex(hex, 2, 2), channelFromHex(hex, 4, 2)];
		}
		return null;
	}

	const match = /^rgba?\(([^)]+)\)$/.exec(input);
	if (!match?.[1]) return null;
	const parts = match[1]
		.replace("/", " ")
		.split(/[\s,]+/)
		.filter(Boolean);
	if (parts.length < 3) return null;
	const channels: number[] = [];
	for (const part of parts.slice(0, 3)) {
		const parsed = part.endsWith("%")
			? (Number.parseFloat(part) / 100) * 255
			: Number.parseFloat(part);
		if (!Number.isFinite(parsed)) return null;
		channels.push(Math.min(255, Math.max(0, parsed)) / 255);
	}
	const [r, g, b] = channels;
	if (r === undefined || g === undefined || b === undefined) return null;
	return [r, g, b];
}

/**
 * Resolve the shader palette from CSS custom properties. `readToken` is
 * normally backed by `getComputedStyle(document.documentElement)`; passing a
 * plain function keeps this testable and lets the caller refresh on theme
 * changes.
 */
export function resolveHologramPalette(
	readToken: (name: string) => string,
	light: boolean,
): HologramPalette {
	const fallback = light ? LIGHT_FALLBACK : DARK_FALLBACK;
	const read = (name: string, base: Rgb): Rgb => parseCssColor(readToken(name)) ?? base;
	return {
		background: read("--background", fallback.background),
		primary: read("--foreground", fallback.primary),
		secondary: read("--muted-foreground", fallback.secondary),
		accent: read("--subtle", fallback.accent),
		intensity: light ? 0.85 : 1,
		light,
	};
}
