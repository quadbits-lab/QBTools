/**
 * The event log panel — the ring buffer at the bottom of the console.
 * System events and tool results share the same stream, newest last.
 *
 * A line reads in three tones: the timestamp stays subtle, the tag carries
 * its own accent (per stream kind), and the message is colored by priority —
 * errors pop, warnings flag, plain info stays quiet.
 */

import { Box, Text } from "ink";
import { theme } from "../theme";
import type { ConsoleEvent } from "./events";

export interface EventLogProps {
	width: number;
	/** Visible rows. */
	height: number;
	events: ConsoleEvent[];
	/** Rows scrolled up from the bottom. */
	offset: number;
}

/** Which stream a tag belongs to — each gets its own accent. */
const TAG_COLOR: Record<string, string> = {
	SYS_BOOT: theme.text.accent,
	SYS: theme.text.accent,
	NET_POLICIES: theme.ui.symbol,
	RUN: theme.text.active,
	DONE: theme.status.success,
	OPEN: theme.text.accent,
	SEL: theme.ui.symbol,
	HELP: theme.status.warning,
	UPDATE: theme.status.warning,
	ERR: theme.status.error,
};

const LEVEL_COLOR: Record<ConsoleEvent["level"], string> = {
	info: theme.text.primary,
	ok: theme.status.success,
	warn: theme.status.warning,
	error: theme.status.error,
};

/** Priority marker before the message; plain info stays unmarked. */
const LEVEL_GLYPH: Record<ConsoleEvent["level"], string> = {
	info: "",
	ok: "✔ ",
	warn: "⚠ ",
	error: "✖ ",
};

interface LogRow {
	time: string;
	tag: string;
	level: ConsoleEvent["level"];
	text: string;
	detail: boolean;
	detailText?: string;
}

export function EventLog(props: EventLogProps) {
	const flat: LogRow[] = [];
	for (const event of props.events) {
		flat.push({
			time: event.time,
			tag: event.tag,
			level: event.level,
			text: event.text,
			detail: false,
		});
		for (const line of event.detail ?? []) {
			// A detail may carry several lines (a rendered table) — each one is
			// its own row so the ring buffer stays line-aligned.
			for (const part of line.split("\n")) {
				flat.push({ time: "", tag: "", level: event.level, text: part, detail: true });
			}
		}
	}
	const height = Math.max(1, props.height);
	const start = Math.max(0, flat.length - height - props.offset);
	const visible = flat.slice(start, start + height);
	const limit = Math.max(10, props.width - 4);

	return (
		<Box flexDirection="column">
			{visible.map((row, index) =>
				row.detail ? (
					<Text key={index} color={theme.text.secondary}>
						{`  ${truncate(row.text, limit - 2)}`}
					</Text>
				) : (
					<EventLine key={index} row={row} limit={limit} />
				),
			)}
			{props.offset > 0 ? (
				<Text color={theme.text.muted}>{`… ${props.offset} more lines above`}</Text>
			) : null}
		</Box>
	);
}

/** One event, painted in three segments so the stream stays one line. */
function EventLine(props: { row: LogRow; limit: number }) {
	const { row } = props;
	const tagColor = TAG_COLOR[row.tag] ?? LEVEL_COLOR[row.level];
	const glyph = LEVEL_GLYPH[row.level];
	// "[time] tag: " leaves this many columns for the message.
	const prefix = `[${row.time}] ${row.tag}: `.length;
	const budget = Math.max(8, props.limit - prefix - glyph.length);

	return (
		<Box flexDirection="row" flexShrink={0}>
			<Text color={theme.text.muted}>{`[${row.time}] `}</Text>
			<Text color={tagColor} bold>
				{row.tag}
			</Text>
			<Text color={theme.text.muted}>{": "}</Text>
			<Text color={LEVEL_COLOR[row.level]} bold={row.level === "error"}>
				{`${glyph}${truncate(row.text, budget)}`}
			</Text>
		</Box>
	);
}

function truncate(text: string, limit: number): string {
	return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}
