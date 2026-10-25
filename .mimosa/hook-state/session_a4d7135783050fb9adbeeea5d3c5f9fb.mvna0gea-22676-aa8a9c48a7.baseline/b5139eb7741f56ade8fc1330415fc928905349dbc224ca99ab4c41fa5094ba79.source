import { expect, test } from "bun:test";
import { LIMITS } from "../processing";
import { boxToPixels, groupBoxesByPage, MIN_BOX, normalizeBox } from "./redact-boxes";

const box = (overrides = {}) => ({
	page: 0,
	x: 0.1,
	y: 0.2,
	width: 0.3,
	height: 0.1,
	...overrides,
});
test("boxes are clipped to the page", () => {
	const clipped = normalizeBox(box({ x: 0.9, width: 0.5 }));
	expect(clipped?.x).toBeCloseTo(0.9);
	expect(clipped?.width).toBeCloseTo(0.1);
	expect(clipped?.y).toBeCloseTo(0.2);
	expect(normalizeBox(box({ x: -0.2, width: 0.4 }))?.x).toBe(0);
});
test("dragging up or left is treated as the same rectangle", () => {
	const flipped = normalizeBox(box({ x: 0.4, y: 0.3, width: -0.3, height: -0.1 }));
	expect(flipped?.x).toBeCloseTo(0.1);
	expect(flipped?.y).toBeCloseTo(0.2);
	expect(flipped?.width).toBeCloseTo(0.3);
	expect(flipped?.height).toBeCloseTo(0.1);
});
test("accidental clicks and invalid numbers are dropped", () => {
	expect(normalizeBox(box({ width: MIN_BOX / 2 }))).toBeNull();
	expect(normalizeBox(box({ x: Number.NaN }))).toBeNull();
	expect(normalizeBox(box({ x: 1.2, width: 0.3 }))).toBeNull();
});
test("grouping validates pages and counts", () => {
	const grouped = groupBoxesByPage([box(), box({ page: 2 }), box({ page: 2, y: 0.6 })], 3);
	expect([...grouped.keys()]).toEqual([0, 2]);
	expect(grouped.get(2)).toHaveLength(2);
	expect(() => groupBoxesByPage([], 3)).toThrow("at least one");
	expect(() => groupBoxesByPage([box({ page: 3 })], 3)).toThrow("doesn't exist");
	expect(() => groupBoxesByPage([box({ page: -1 })], 3)).toThrow("doesn't exist");
	expect(() => groupBoxesByPage([box({ width: 0 })], 3)).toThrow("at least one");
	expect(() => groupBoxesByPage(Array(LIMITS.redactBoxes + 1).fill(box()), 3)).toThrow("or fewer");
});
test("pixel rectangles are padded and stay inside the page", () => {
	expect(boxToPixels(box({ x: 0, y: 0, width: 1, height: 1 }), 100, 200)).toEqual({
		x: 0,
		y: 0,
		width: 100,
		height: 200,
	});
	const r = boxToPixels(box({ x: 0.25, y: 0.5, width: 0.25, height: 0.25 }), 100, 200, 2);
	expect(r).toEqual({ x: 23, y: 98, width: 29, height: 54 });
});
