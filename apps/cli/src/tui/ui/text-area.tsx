/**
 * Multi-line text area.
 *
 * The value keeps real newlines; rendering wraps each logical line to the
 * available width and scrolls the viewport so the cursor stays visible.
 * Enter inserts a newline — Tab/Shift+Tab belong to the parent screen, which
 * uses them to move between fields.
 */

import { Box, type Key, Text } from "ink";
import { useEffect, useState } from "react";
import { theme } from "../theme";
import { useKeyHandler, WIDGET_KEY_PRIORITY } from "./key-router";

export interface TextAreaProps {
	value: string;
	onChange(value: string): void;
	onSubmit?(): void;
	placeholder?: string;
	focused?: boolean;
	width?: number;
	/** Visible rows; the area scrolls when the text is longer. */
	visibleRows?: number;
	/** Keys the area must not swallow (the parent screen handles them). */
	passThrough?(input: string, key: Key): boolean;
	priority?: number;
}

interface CursorPosition {
	line: number;
	column: number;
}

function locate(value: string, cursor: number): CursorPosition {
	let remaining = cursor;
	const lines = value.split("\n");
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index] ?? "";
		if (remaining <= line.length) return { line: index, column: remaining };
		remaining -= line.length + 1;
	}
	const last = lines.length - 1;
	return { line: Math.max(0, last), column: (lines[last] ?? "").length };
}

function offsetOf(value: string, position: CursorPosition): number {
	const lines = value.split("\n");
	let offset = 0;
	for (let index = 0; index < position.line; index++) {
		offset += (lines[index] ?? "").length + 1;
	}
	return offset + position.column;
}

/** Greedy word wrap with hard-split for long tokens. */
export function wrapLine(line: string, width: number): string[] {
	if (width <= 0) return [line];
	if (line.length <= width) return [line];
	const rows: string[] = [];
	let current = "";
	for (const word of line.split(/(\s+)/)) {
		if (word.length === 0) continue;
		if (current.length + word.length <= width) {
			current += word;
			continue;
		}
		if (word.trim().length === 0) {
			current = "";
			continue;
		}
		if (current.length > 0) {
			rows.push(current);
			current = "";
		}
		let rest = word;
		while (rest.length > width) {
			rows.push(rest.slice(0, width));
			rest = rest.slice(width);
		}
		current = rest;
	}
	if (current.length > 0 || rows.length === 0) rows.push(current);
	return rows;
}

export function TextArea(props: TextAreaProps) {
	const { value, onChange, focused = false, width = 40, visibleRows = 5 } = props;
	const [cursor, setCursor] = useState(value.length);

	useEffect(() => {
		setCursor((current) => Math.min(current, value.length));
	}, [value]);

	useKeyHandler(
		(input, key) => {
			if (!focused) return;
			if (props.passThrough?.(input, key)) return false;
			if (key.ctrl) {
				if (input === "k") {
					const position = locate(value, cursor);
					const lines = value.split("\n");
					const head = lines.slice(0, position.line).join("\n");
					const tail = lines.slice(position.line + 1).join("\n");
					const next = tail ? `${head}\n${tail}` : head;
					onChange(next);
					setCursor(head.length);
					return true;
				}
				if (input === "d") {
					// Forward delete — the physical Delete key is reported by Ink
					// as `delete` too, so it is bound to backspace below.
					if (cursor < value.length) {
						onChange(value.slice(0, cursor) + value.slice(cursor + 1));
					}
					return true;
				}
				return false;
			}
			if (key.return) {
				onChange(`${value.slice(0, cursor)}\n${value.slice(cursor)}`);
				setCursor(cursor + 1);
				return true;
			}
			// Ink reports the physical Backspace key (\x7f) as `delete` and only
			// Ctrl+H as `backspace` — both remove the character before the cursor.
			if (key.backspace || key.delete) {
				if (cursor > 0) {
					onChange(value.slice(0, cursor - 1) + value.slice(cursor));
					setCursor(cursor - 1);
				}
				return true;
			}
			if (key.upArrow || key.downArrow) {
				const position = locate(value, cursor);
				const lines = value.split("\n");
				const target = position.line + (key.upArrow ? -1 : 1);
				if (target < 0 || target >= lines.length) return true;
				const line = lines[target] ?? "";
				const column = Math.min(position.column, line.length);
				setCursor(offsetOf(value, { line: target, column }));
				return true;
			}
			if (key.home) {
				const position = locate(value, cursor);
				setCursor(offsetOf(value, { line: position.line, column: 0 }));
				return true;
			}
			if (key.end) {
				const position = locate(value, cursor);
				const lines = value.split("\n");
				setCursor(
					offsetOf(value, { line: position.line, column: (lines[position.line] ?? "").length }),
				);
				return true;
			}
			if (input && !key.meta) {
				onChange(value.slice(0, cursor) + input + value.slice(cursor));
				setCursor(cursor + input.length);
				return true;
			}
			return false;
		},
		{ active: focused, priority: props.priority ?? WIDGET_KEY_PRIORITY },
	);

	if (!value && !focused) {
		return (
			<Box>
				<Text color={theme.textSubtle}>{props.placeholder ?? ""}</Text>
			</Box>
		);
	}

	const position = locate(value, cursor);
	const logical = value.split("\n");
	const visual: Array<{ text: string; cursorOffset: number | null }> = [];
	logical.forEach((line, lineIndex) => {
		const rows = wrapLine(line, width);
		let remaining = lineIndex === position.line ? position.column : -1;
		rows.forEach((row) => {
			if (remaining >= 0 && remaining <= row.length) {
				visual.push({ text: row, cursorOffset: remaining });
				remaining = -2; // cursor already placed
			} else {
				visual.push({ text: row, cursorOffset: null });
				if (remaining > 0) remaining -= row.length;
			}
		});
	});

	const cursorRow = visual.findIndex((row) => row.cursorOffset !== null);
	const start = Math.max(0, Math.min(cursorRow - visibleRows + 1, visual.length - visibleRows));
	const window = visual.slice(Math.max(0, start), Math.max(0, start) + visibleRows);

	return (
		<Box flexDirection="column">
			{window.map((row, index) => (
				<Box key={`${index}-${row.text.slice(0, 8)}`}>
					{!focused || row.cursorOffset === null ? (
						<Text color={focused ? theme.fg : theme.textDim}>{row.text || " "}</Text>
					) : (
						<Text color={theme.fg}>
							{row.text.slice(0, row.cursorOffset)}
							<Text inverse>{row.text.slice(row.cursorOffset, row.cursorOffset + 1) || " "}</Text>
							{row.text.slice(row.cursorOffset + 1)}
						</Text>
					)}
				</Box>
			))}
			{visual.length > visibleRows ? (
				<Text color={theme.textSubtle}>
					{`${visual.length - visibleRows} more line${visual.length - visibleRows === 1 ? "" : "s"}`}
				</Text>
			) : null}
		</Box>
	);
}
