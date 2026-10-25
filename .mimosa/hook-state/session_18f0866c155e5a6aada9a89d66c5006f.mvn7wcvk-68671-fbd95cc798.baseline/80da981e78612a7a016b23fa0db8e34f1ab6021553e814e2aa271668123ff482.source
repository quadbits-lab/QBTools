import { describe, expect, test } from "bun:test";
import {
	drawingBufferSize,
	parallaxProgress,
	parseCssColor,
	preferredDpr,
	resolveHologramPalette,
} from "./hologram-math";

describe("parallaxProgress", () => {
	test("maps the hero's travel to a clamped 0..1 range", () => {
		expect(parallaxProgress(0, 500)).toBe(0);
		expect(parallaxProgress(120, 500)).toBe(0);
		expect(parallaxProgress(-250, 500)).toBe(0.5);
		expect(parallaxProgress(-500, 500)).toBe(1);
		expect(parallaxProgress(-900, 500)).toBe(1);
	});

	test("is safe for degenerate and non-finite inputs", () => {
		expect(parallaxProgress(-100, 0)).toBe(0);
		expect(parallaxProgress(-100, -20)).toBe(0);
		expect(parallaxProgress(Number.NaN, 500)).toBe(0);
		expect(parallaxProgress(-100, Number.POSITIVE_INFINITY)).toBe(0);
	});
});

describe("preferredDpr", () => {
	test("caps retina density and never returns less than 1", () => {
		expect(preferredDpr(3, false)).toBe(1.75);
		expect(preferredDpr(2, false)).toBe(1.75);
		expect(preferredDpr(1, false)).toBe(1);
		expect(preferredDpr(0.5, false)).toBe(1);
	});

	test("keeps touch devices on a lighter budget", () => {
		expect(preferredDpr(3, true)).toBe(1.25);
		expect(preferredDpr(1, true)).toBe(1);
		expect(preferredDpr(Number.NaN, true)).toBe(1);
	});
});

describe("drawingBufferSize", () => {
	test("scales by DPR for ordinary sizes", () => {
		expect(drawingBufferSize(800, 400, 2)).toEqual({ width: 1600, height: 800 });
	});

	test("bounds large buffers without changing aspect ratio", () => {
		const size = drawingBufferSize(3840, 2160, 2, 2_400_000);
		expect(size.width * size.height).toBeLessThanOrEqual(2_400_000);
		expect(size.width / size.height).toBeCloseTo(3840 / 2160, 2);
	});

	test("never allocates an empty canvas", () => {
		expect(drawingBufferSize(0, 0, 2)).toEqual({ width: 1, height: 1 });
		expect(drawingBufferSize(Number.NaN, 100, 2)).toEqual({ width: 1, height: 1 });
	});
});

describe("parseCssColor", () => {
	test("parses the hex forms used by the design tokens", () => {
		const [r, g, b] = parseCssColor("#34d399") ?? [];
		expect(r).toBeCloseTo(52 / 255);
		expect(g).toBeCloseTo(211 / 255);
		expect(b).toBeCloseTo(153 / 255);
		expect(parseCssColor("#fff")).toEqual([1, 1, 1]);
	});

	test("parses rgb and rgba functions", () => {
		expect(parseCssColor("rgb(17 17 17)")).toEqual([17 / 255, 17 / 255, 17 / 255]);
		const rgba = parseCssColor("rgba(52, 211, 153, 0.5)") ?? [];
		expect(rgba[1]).toBeCloseTo(211 / 255);
	});

	test("rejects values the tokens never emit", () => {
		expect(parseCssColor("")).toBeNull();
		expect(parseCssColor("transparent")).toBeNull();
		expect(parseCssColor("#12345")).toBeNull();
		expect(parseCssColor("rgb(1, 2)")).toBeNull();
	});
});

describe("resolveHologramPalette", () => {
	const tokens: Record<string, string> = {
		"--background": "#0a0a0a",
		"--foreground": "#f8f8f8",
		"--muted-foreground": "#b7b7b7",
		"--subtle": "#8f8f8f",
	};

	test("reads neutral theme tokens and keeps full strength in the dark theme", () => {
		const palette = resolveHologramPalette((name) => tokens[name] ?? "", false);
		expect(palette.background).toEqual([10 / 255, 10 / 255, 10 / 255]);
		expect(palette.intensity).toBe(1);
		expect(palette.light).toBe(false);
		expect(palette.primary[0]).toBeCloseTo(248 / 255);
	});

	test("resolves a strictly grayscale palette in both themes", () => {
		for (const light of [false, true]) {
			const palette = resolveHologramPalette((name) => tokens[name] ?? "", light);
			for (const color of [palette.primary, palette.secondary, palette.accent]) {
				expect(color[0]).toBe(color[1]);
				expect(color[1]).toBe(color[2]);
			}
		}
	});

	test("falls back to built-in neutrals and quiets the light theme", () => {
		const palette = resolveHologramPalette(() => "", true);
		expect(palette.background).toEqual([1, 1, 1]);
		expect(palette.light).toBe(true);
		expect(palette.intensity).toBeGreaterThan(0.5);
		expect(palette.primary[0]).toBeCloseTo(13 / 255);
	});

	test("ignores malformed token values", () => {
		const palette = resolveHologramPalette(
			(name) => (name === "--background" ? "nope" : ""),
			false,
		);
		expect(palette.background).toEqual([0.0667, 0.0667, 0.0667]);
	});
});
