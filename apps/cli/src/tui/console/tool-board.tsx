/**
 * The tool board — category blocks with a grid of cards, clipped to the
 * viewport and scrolled to keep the selection visible.
 *
 * Every row sets `flexShrink={0}`: the panel clips its content, and without it
 * yoga would squeeze the rows and overprint the text.
 */

import type { ToolDef } from "@qbtools/registry";
import { Box, Text } from "ink";
import { AVAILABILITY_LABELS, availabilityFor } from "../../runner/map";
import type { Availability } from "../../runner/types";
import { categoryColor, GRADIENT, theme } from "../theme";
import { type BoardItem, type BoardModel, CARD_HEIGHT } from "./board";

/** Status dot color per availability class. */
const STATUS_COLOR: Record<Availability | "web", string> = {
	local: theme.status.success,
	sharp: theme.status.warning,
	ffmpeg: theme.status.warning,
	server: theme.text.accent,
	web: theme.status.error,
};

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
	// Catalogue census — how many tools of each availability class live here.
	const tally = new Map<string, number>();
	for (const item of props.board.items) {
		if (item.kind !== "cards") continue;
		for (const tool of item.cards) {
			const label = AVAILABILITY_LABELS[availabilityFor(tool.slug)];
			tally.set(label, (tally.get(label) ?? 0) + 1);
		}
	}
	const census = Object.keys(STATUS_COLOR)
		.map((className) => {
			const key = className as keyof typeof STATUS_COLOR;
			return {
				color: STATUS_COLOR[key],
				label: AVAILABILITY_LABELS[key],
				count: tally.get(AVAILABILITY_LABELS[key]) ?? 0,
			};
		})
		.filter((entry) => entry.count > 0);

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
				<Text>
					<Text color={theme.text.secondary}>
						{query
							? `${props.shown} of ${props.total} match "${query}"`
							: `Showing ${props.shown} of ${props.total} tools`}
					</Text>
					{census.map((entry) => (
						<Text key={entry.label}>
							<Text color={theme.text.muted}>{"   "}</Text>
							<Text color={entry.color}>{"●"}</Text>
							<Text color={theme.text.muted}>{` ${entry.label} ${entry.count}`}</Text>
						</Text>
					))}
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
	const label = props.item.name.toUpperCase();
	const meta = `  .${props.item.code} (${props.item.count}) `;
	const head = `${props.active ? "▸ " : "  "}${label}${meta}`;
	const rule = "─".repeat(Math.max(0, props.width - head.length));
	// The active block's rule ignites across the Gemini gradient — the one
	// full-bleed color on the board, marking where the cursor lives.
	const chunk = Math.ceil(rule.length / GRADIENT.length);

	return (
		<Box flexShrink={0}>
			<Text>
				<Text color={props.active ? theme.text.active : theme.text.muted}>
					{`${props.active ? "▸ " : "  "}`}
				</Text>
				<Text color={props.active ? theme.text.primary : theme.text.muted} bold={props.active}>
					{label}
				</Text>
				<Text color={props.active ? theme.text.accent : theme.text.muted}>{meta}</Text>
				{props.active ? (
					GRADIENT.map((tone, index) => {
						const slice = rule.slice(index * chunk, (index + 1) * chunk);
						return slice ? (
							<Text key={index} color={tone}>
								{slice}
							</Text>
						) : null;
					})
				) : (
					<Text color={theme.text.muted}>{rule}</Text>
				)}
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
	const accent = categoryColor(props.tool.category);
	const borderColor = props.selected ? theme.surface.onHighlight : theme.border.default;
	// Ink paints `backgroundColor` only over the content area — with a real
	// border the glyph cells keep the terminal background and read as a black
	// ring around the fill. The border is hand-drawn so the tint on the box
	// runs edge to edge, behind the glyphs.
	const tint = props.selected ? theme.surface.highlight : undefined;
	const inner = Math.max(4, props.width - 4);
	const rule = "─".repeat(Math.max(0, props.width - 2));
	const name = truncate(props.tool.name, inner).padEnd(inner);
	const slug = truncate(props.tool.slug, inner).padEnd(inner);
	const status = availabilityFor(props.tool.slug);
	const statusText = ` ${AVAILABILITY_LABELS[status]}`.padEnd(inner);

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
				{/* Titles wear the category accent — each block reads in its own hue. */}
				<Text color={props.selected ? theme.surface.onHighlight : accent} bold={props.selected}>
					{` ${name} `}
				</Text>
				<Text color={borderColor}>│</Text>
			</Text>
			<Text>
				<Text color={borderColor}>│</Text>
				<Text color={props.selected ? theme.surface.onHighlight : theme.text.secondary}>
					{` ${slug} `}
				</Text>
				<Text color={borderColor}>│</Text>
			</Text>
			<Text>
				<Text color={borderColor}>│</Text>
				<Text color={props.selected ? theme.surface.onHighlight : STATUS_COLOR[status]}>
					{" ●"}
				</Text>
				<Text color={props.selected ? theme.surface.onHighlight : theme.text.secondary}>
					{statusText}
				</Text>
				<Text color={borderColor}>│</Text>
			</Text>
			<Text color={borderColor}>{`╰${rule}╯`}</Text>
		</Box>
	);
}

function truncate(text: string, width: number): string {
	return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text;
}
