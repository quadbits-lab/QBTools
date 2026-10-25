/**
 * The tool board — category blocks with a grid of cards, clipped to the
 * viewport and scrolled to keep the selection visible.
 *
 * Every row sets `flexShrink={0}`: the panel clips its content, and without it
 * yoga would squeeze the rows and overprint the text.
 */

import type { ToolDef } from "@qbtools/registry";
import { Box, Text } from "ink";
import { accents, accentTints, categoryAccent, theme } from "../theme";
import { type BoardItem, type BoardModel, CARD_HEIGHT } from "./board";

export interface ToolBoardProps {
	/** Outer panel width (borders included). */
	width: number;
	/** Visible rows, excluding the footer. */
	height: number;
	board: BoardModel;
	cardWidth: number;
	selectedSlug: string | undefined;
	offset: number;
	/** Cards visible after filtering. */
	shown: number;
	/** Cards in the catalogue. */
	total: number;
	/** The query, for the footer copy. */
	query: string;
}

export function ToolBoard(props: ToolBoardProps) {
	const inner = Math.max(10, props.width - 4);
	const viewportEnd = props.offset + props.height;
	const visible = props.board.items.filter(
		(item) => item.y + item.height > props.offset && item.y < viewportEnd,
	);
	const activeHeader = activeCategoryFor(props.board, props.selectedSlug);
	const query = props.query.trim();

	return (
		<Box flexDirection="column" height={props.height + 1} flexShrink={0}>
			<Box flexDirection="column" height={props.height} overflow="hidden" flexShrink={0}>
				{visible.map((item) =>
					item.kind === "header" ? (
						<CategoryHeader
							key={`h-${item.categoryId}`}
							item={item}
							width={inner}
							active={item.categoryId === activeHeader}
						/>
					) : (
						<CardRow
							key={`r-${item.rowIndex}`}
							item={item}
							cardWidth={props.cardWidth}
							selectedSlug={props.selectedSlug}
						/>
					),
				)}
			</Box>
			<Box flexShrink={0}>
				<Text color={theme.textSubtle}>
					{query
						? `${props.shown} of ${props.total} match "${query}"`
						: `Showing ${props.shown} of ${props.total} tools`}
				</Text>
			</Box>
		</Box>
	);
}

/** The category block that contains the selected card. */
function activeCategoryFor(board: BoardModel, slug: string | undefined): string | undefined {
	if (!slug) return undefined;
	let current: string | undefined;
	for (const item of board.items) {
		if (item.kind === "header") current = item.categoryId;
		else if (item.cards.some((tool) => tool.slug === slug)) return current;
	}
	return undefined;
}

function CategoryHeader(props: {
	item: Extract<BoardItem, { kind: "header" }>;
	width: number;
	active: boolean;
}) {
	const accent = accents[categoryAccent(props.item.categoryId)];
	const label = props.item.name.toUpperCase();
	const meta = `  .${props.item.code} (${props.item.count}) `;
	const head = `${props.active ? "▸ " : "  "}${label}${meta}`;
	const rule = "─".repeat(Math.max(0, props.width - head.length));

	return (
		<Box flexShrink={0}>
			<Text>
				<Text color={props.active ? accent : theme.textSubtle}>
					{`${props.active ? "▸ " : "  "}${label}`}
				</Text>
				<Text color={theme.textSubtle}>{meta}</Text>
				<Text color={theme.border}>{rule}</Text>
			</Text>
		</Box>
	);
}

function CardRow(props: {
	item: Extract<BoardItem, { kind: "cards" }>;
	cardWidth: number;
	selectedSlug: string | undefined;
}) {
	return (
		<Box flexDirection="row" gap={1} flexShrink={0} height={CARD_HEIGHT}>
			{props.item.cards.map((tool) => (
				<ToolCard
					key={tool.slug}
					tool={tool}
					width={props.cardWidth}
					selected={tool.slug === props.selectedSlug}
				/>
			))}
		</Box>
	);
}

export function ToolCard(props: { tool: ToolDef; width: number; selected: boolean }) {
	const accentId = categoryAccent(props.tool.category);
	const borderColor = props.selected ? accents[accentId] : theme.borderStrong;
	// Ink paints `backgroundColor` only over the content area — with a real
	// border the glyph cells keep the terminal background and read as a black
	// ring around the fill. The border is hand-drawn so the tint on the box
	// runs edge to edge, behind the glyphs.
	const tint = props.selected ? accentTints[accentId] : undefined;
	const inner = Math.max(4, props.width - 4);
	const rule = "─".repeat(Math.max(0, props.width - 2));
	const name = truncate(props.tool.name, inner).padEnd(inner);
	const slug = truncate(props.tool.slug, inner).padEnd(inner);

	return (
		<Box
			width={props.width}
			height={CARD_HEIGHT}
			flexShrink={0}
			flexDirection="column"
			backgroundColor={tint}
		>
			<Text color={borderColor}>{`╭${rule}╮`}</Text>
			<Text>
				<Text color={borderColor}>│</Text>
				<Text color={props.selected ? theme.fg : theme.textDim} bold={props.selected}>
					{` ${name} `}
				</Text>
				<Text color={borderColor}>│</Text>
			</Text>
			<Text>
				<Text color={borderColor}>│</Text>
				<Text color={props.selected ? theme.textDim : theme.textSubtle}>{` ${slug} `}</Text>
				<Text color={borderColor}>│</Text>
			</Text>
			<Text color={borderColor}>{`╰${rule}╯`}</Text>
		</Box>
	);
}

function truncate(text: string, width: number): string {
	return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text;
}
