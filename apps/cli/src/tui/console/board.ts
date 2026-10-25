/**
 * Board layout model — pure, no React.
 *
 * The tool catalogue is laid out as category blocks: a one-row header, a gap,
 * then card rows of `cols` cards. Cards are four rows tall with one blank row
 * between card rows; blocks are separated by one blank row.
 *
 * Navigation works on card rows only, so moving down from the last row of one
 * category lands in the next category without special-casing the headers.
 */

import { categories, type ToolDef } from "@qbtools/registry";
import { categoryCode } from "./categories";

export const CARD_HEIGHT = 4;
export const CARD_ROW_GAP = 1;
export const HEADER_GAP = 1;
export const BLOCK_GAP = 1;

export interface HeaderItem {
	kind: "header";
	categoryId: string;
	name: string;
	/** Short code shown next to the name, e.g. `img`. */
	code: string;
	count: number;
	y: number;
	height: 1;
}

export interface CardsItem {
	kind: "cards";
	rowIndex: number;
	cards: ToolDef[];
	y: number;
	height: number;
}

export type BoardItem = HeaderItem | CardsItem;

export type Direction = "left" | "right" | "up" | "down";

export interface BoardPosition {
	row: number;
	col: number;
	y: number;
}

export interface BoardModel {
	items: BoardItem[];
	/** Card rows in reading order, across category blocks. */
	cardRows: ToolDef[][];
	/** The y of each card row's top border. */
	rowY: number[];
	totalRows: number;
	find(slug: string): BoardPosition | undefined;
	move(slug: string, direction: Direction): ToolDef | undefined;
	/** Round a scroll target down to an item boundary so cards are never cut. */
	snapOffset(desired: number): number;
}

export function buildBoard(tools: ToolDef[], cols: number): BoardModel {
	const columnCount = Math.max(1, cols);
	const grouped = new Map<string, ToolDef[]>();
	for (const tool of tools) {
		const bucket = grouped.get(tool.category);
		if (bucket) bucket.push(tool);
		else grouped.set(tool.category, [tool]);
	}

	const items: BoardItem[] = [];
	const cardRows: ToolDef[][] = [];
	const rowY: number[] = [];
	let y = 0;
	let emitted = 0;
	const blocks = categories.filter((category) => (grouped.get(category.id)?.length ?? 0) > 0);

	for (const category of blocks) {
		const bucket = grouped.get(category.id) ?? [];
		items.push({
			kind: "header",
			categoryId: category.id,
			name: category.name,
			code: categoryCode(category.id),
			count: bucket.length,
			y,
			height: 1,
		});
		y += 1 + HEADER_GAP;

		for (let start = 0; start < bucket.length; start += columnCount) {
			const cards = bucket.slice(start, start + columnCount);
			const rowIndex = cardRows.length;
			items.push({ kind: "cards", rowIndex, cards, y, height: CARD_HEIGHT });
			cardRows.push(cards);
			rowY.push(y);
			y += CARD_HEIGHT;
			const moreInBlock = start + columnCount < bucket.length;
			if (moreInBlock) y += CARD_ROW_GAP;
		}

		emitted += 1;
		if (emitted < blocks.length) y += BLOCK_GAP;
	}

	function locate(slug: string): BoardPosition | undefined {
		for (let row = 0; row < cardRows.length; row++) {
			const col = cardRows[row]?.findIndex((tool) => tool.slug === slug) ?? -1;
			if (col >= 0) return { row, col, y: rowY[row] ?? 0 };
		}
		return undefined;
	}

	return {
		items,
		cardRows,
		rowY,
		totalRows: y,
		find: locate,
		move(slug, direction) {
			const position = locate(slug);
			if (!position) return undefined;
			const { row, col } = position;
			const current = cardRows[row] ?? [];
			if (direction === "left") return col > 0 ? cardRows[row]?.[col - 1] : undefined;
			if (direction === "right")
				return col + 1 < current.length ? cardRows[row]?.[col + 1] : undefined;
			const target = cardRows[row + (direction === "up" ? -1 : 1)];
			if (!target) return undefined;
			return target[Math.min(col, target.length - 1)];
		},
		snapOffset(desired) {
			if (desired <= 0) return 0;
			let best = 0;
			for (const item of items) {
				if (item.y <= desired) best = item.y;
				else break;
			}
			return best;
		},
	};
}
