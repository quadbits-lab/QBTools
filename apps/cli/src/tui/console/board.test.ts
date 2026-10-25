/**
 * Board layout model tests — pure geometry and navigation, no React.
 */

import { describe, expect, test } from "bun:test";
import { type ToolDef, tools } from "@qbtools/registry";
import { buildBoard, CARD_HEIGHT, HEADER_GAP } from "./board";

function tool(slug: string, category: string): ToolDef {
	return { slug, category, name: slug } as ToolDef;
}

/** image: 5 tools (3 rows at 2 cols), pdf: 2 tools (1 row). */
const sample = [
	tool("a", "image"),
	tool("b", "image"),
	tool("c", "image"),
	tool("d", "image"),
	tool("e", "image"),
	tool("f", "pdf"),
	tool("g", "pdf"),
];

describe("buildBoard", () => {
	test("every tool appears exactly once, in registry category order", () => {
		const board = buildBoard(tools, 4);
		const slugs = board.cardRows.flat().map((entry) => entry.slug);
		expect(new Set(slugs).size).toBe(tools.length);
		expect(slugs.length).toBe(tools.length);
		const headers = board.items.filter((item) => item.kind === "header");
		expect(headers).toHaveLength(8);
		expect(headers.map((item) => (item.kind === "header" ? item.categoryId : ""))).toEqual([
			"image",
			"pdf",
			"text",
			"calculators",
			"generators",
			"media",
			"security",
			"developer",
		]);
	});

	test("cards per row follow the column count", () => {
		const two = buildBoard(tools, 2);
		const four = buildBoard(tools, 4);
		expect(two.cardRows.every((row) => row.length <= 2)).toBe(true);
		expect(four.cardRows.every((row) => row.length <= 4)).toBe(true);
		expect(four.cardRows.length).toBeLessThan(two.cardRows.length);
	});

	test("lays out headers, gaps and card rows", () => {
		const board = buildBoard(sample, 2);
		// image header at 0, gap, rows at 2 / 7 / 12, block gap, pdf header at 17
		expect(board.rowY).toEqual([2, 7, 12, 19]);
		expect(board.cardRows.map((row) => row.map((entry) => entry.slug))).toEqual([
			["a", "b"],
			["c", "d"],
			["e"],
			["f", "g"],
		]);
		const pdfHeader = board.items.find(
			(item) => item.kind === "header" && item.categoryId === "pdf",
		);
		expect(pdfHeader?.y).toBe(12 + CARD_HEIGHT + 1);
		expect(HEADER_GAP).toBe(1);
	});

	test("find returns the row, column and y of a card", () => {
		const board = buildBoard(sample, 2);
		expect(board.find("d")).toEqual({ row: 1, col: 1, y: 7 });
		expect(board.find("f")).toEqual({ row: 3, col: 0, y: 19 });
		expect(board.find("nope")).toBeUndefined();
	});

	test("horizontal movement stays inside the row", () => {
		const board = buildBoard(sample, 2);
		expect(board.move("a", "right")?.slug).toBe("b");
		expect(board.move("b", "right")).toBeUndefined();
		expect(board.move("b", "left")?.slug).toBe("a");
		expect(board.move("a", "left")).toBeUndefined();
	});

	test("vertical movement crosses category blocks", () => {
		const board = buildBoard(sample, 2);
		// row 2 is the last image row ("e"); down lands in the pdf block.
		expect(board.move("e", "down")?.slug).toBe("f");
		expect(board.move("f", "up")?.slug).toBe("e");
		expect(board.move("a", "up")).toBeUndefined();
		expect(board.move("g", "down")).toBeUndefined();
	});

	test("vertical movement clamps to a shorter row", () => {
		const board = buildBoard(sample, 2);
		// "g" sits at col 1; the row above it ("e") only has one card.
		expect(board.move("g", "up")?.slug).toBe("e");
	});

	test("snapOffset rounds down to an item boundary", () => {
		const board = buildBoard(sample, 2);
		expect(board.snapOffset(0)).toBe(0);
		expect(board.snapOffset(1)).toBe(0); // inside the header gap
		expect(board.snapOffset(3)).toBe(2); // inside the first card row
		expect(board.snapOffset(8)).toBe(7);
		expect(board.snapOffset(12345)).toBe(board.rowY.at(-1) ?? 0);
	});

	test("the total height covers the last card row", () => {
		const board = buildBoard(sample, 2);
		const last = board.rowY.at(-1) ?? 0;
		// The last block has no trailing gap.
		expect(board.totalRows).toBe(last + CARD_HEIGHT);
	});
});
