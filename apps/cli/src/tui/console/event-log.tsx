/**
 * The event log panel — the ring buffer at the bottom of the console.
 * System events and tool results share the same stream, newest last.
 */

import { Box, Text } from "ink";
import { accents, theme } from "../theme";
import { type ConsoleEvent, formatEvent } from "./events";

export interface EventLogProps {
	width: number;
	/** Visible rows. */
	height: number;
	events: ConsoleEvent[];
	/** Rows scrolled up from the bottom. */
	offset: number;
}

const LEVEL_COLOR: Record<ConsoleEvent["level"], string> = {
	info: theme.textDim,
	ok: accents.emerald,
	warn: accents.amber,
	error: accents.rose,
};

export function EventLog(props: EventLogProps) {
	const flat: Array<{ text: string; level: ConsoleEvent["level"]; detail: boolean }> = [];
	for (const event of props.events) {
		flat.push({ text: formatEvent(event), level: event.level, detail: false });
		for (const line of event.detail ?? []) {
			// A detail may carry several lines (a rendered table) — each one is
			// its own row so the ring buffer stays line-aligned.
			for (const part of line.split("\n")) {
				flat.push({ text: part, level: event.level, detail: true });
			}
		}
	}
	const height = Math.max(1, props.height);
	const start = Math.max(0, flat.length - height - props.offset);
	const visible = flat.slice(start, start + height);
	const limit = Math.max(10, props.width - 4);

	return (
		<Box flexDirection="column">
			{visible.map((line, index) => (
				<Text key={index} color={line.detail ? theme.textSubtle : LEVEL_COLOR[line.level]}>
					{line.detail ? `  ${truncate(line.text, limit - 2)}` : truncate(line.text, limit)}
				</Text>
			))}
			{props.offset > 0 ? (
				<Text color={theme.textSubtle}>{`… ${props.offset} more lines above`}</Text>
			) : null}
		</Box>
	);
}

function truncate(text: string, limit: number): string {
	return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}
