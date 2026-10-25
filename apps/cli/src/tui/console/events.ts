/**
 * Console event log — the ring buffer shown in the bottom panel.
 *
 * Events are timestamped and tagged the way the instrument panel reads:
 * `SYS_BOOT`, `SEL`, `OPEN`, `RUN`, `DONE`, `ERR`.
 */

export type EventLevel = "info" | "ok" | "warn" | "error";

export interface ConsoleEvent {
	time: string;
	tag: string;
	level: EventLevel;
	text: string;
	/** Extra lines rendered under the event (tool results, help text). */
	detail?: string[];
}

export function eventTime(date = new Date()): string {
	const pad = (value: number, size = 2) => String(value).padStart(size, "0");
	return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(
		date.getMilliseconds(),
		3,
	)}`;
}

export function formatEvent(event: ConsoleEvent): string {
	return `[${event.time}] ${event.tag}: ${event.text}`;
}

export function makeEvent(
	tag: string,
	text: string,
	options: { level?: EventLevel; detail?: string[]; date?: Date } = {},
): ConsoleEvent {
	return {
		time: eventTime(options.date),
		tag,
		level: options.level ?? "info",
		text,
		detail: options.detail,
	};
}
