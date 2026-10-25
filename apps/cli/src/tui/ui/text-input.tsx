/**
 * Single-line text input.
 *
 * Ink has no input primitive, so this is a controlled editor: the value lives
 * in the parent, the cursor lives here. It registers a key handler at widget
 * priority so the screen below never sees the keys it owns.
 */

import { Box, type Key, Text } from "ink";
import { useEffect, useState } from "react";
import { theme } from "../theme";
import { useKeyHandler, WIDGET_KEY_PRIORITY } from "./key-router";

export interface TextInputProps {
	value: string;
	onChange(value: string): void;
	/** Called on Enter. Without it, Enter is left to the parent screen. */
	onSubmit?(): void;
	placeholder?: string;
	/** Only a focused input reacts to keys. */
	focused?: boolean;
	/** Visible width in columns; longer values scroll horizontally. */
	width?: number;
	/** Render every character as a bullet (secrets). */
	mask?: boolean;
	/** Keys the input must not swallow (the parent screen handles them). */
	passThrough?(input: string, key: Key): boolean;
	priority?: number;
}

export function TextInput(props: TextInputProps) {
	const { value, onChange, focused = false, width, mask = false } = props;
	const [cursor, setCursor] = useState(value.length);

	// Keep the cursor inside the value when the parent changes it.
	useEffect(() => {
		setCursor((current) => Math.min(current, value.length));
	}, [value]);

	useKeyHandler(
		(input, key) => {
			if (!focused) return;
			if (props.passThrough?.(input, key)) return false;
			if (key.ctrl) {
				switch (input) {
					case "a":
						setCursor(0);
						return true;
					case "e":
						setCursor(value.length);
						return true;
					case "u":
						onChange(value.slice(cursor));
						setCursor(0);
						return true;
					case "k":
						onChange(value.slice(0, cursor));
						return true;
					case "d":
						// Forward delete — the physical Delete key is reported by Ink
						// as `delete` too, so it is bound to backspace below.
						if (cursor < value.length) {
							onChange(value.slice(0, cursor) + value.slice(cursor + 1));
						}
						return true;
					case "w": {
						const trimmed = value.slice(0, cursor).replace(/\s*\S+$/, "");
						onChange(trimmed + value.slice(cursor));
						setCursor(trimmed.length);
						return true;
					}
					default:
						return false; // Ctrl+C and friends belong to the shell.
				}
			}
			if (key.return) {
				if (!props.onSubmit) return false;
				props.onSubmit();
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
			if (key.leftArrow) {
				setCursor(Math.max(0, cursor - 1));
				return true;
			}
			if (key.rightArrow) {
				setCursor(Math.min(value.length, cursor + 1));
				return true;
			}
			if (key.home) {
				setCursor(0);
				return true;
			}
			if (key.end) {
				setCursor(value.length);
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
				<Text color={theme.textSubtle}>{truncate(props.placeholder ?? "", width ?? 40)}</Text>
			</Box>
		);
	}

	const display = mask ? "•".repeat(value.length) : value;
	const column = width && width > 2 ? width - 1 : undefined;
	let start = 0;
	if (column && display.length > column) {
		start = Math.max(0, Math.min(cursor - Math.floor(column / 2), display.length - column));
	}
	const slice = display.slice(start, column ? start + column : undefined);
	const prefix = start > 0 ? "…" : "";
	const suffix = column && start + (column ?? 0) < display.length ? "…" : "";

	if (!focused) {
		return (
			<Box>
				{prefix ? <Text color={theme.textSubtle}>…</Text> : null}
				<Text color={theme.textDim}>{slice}</Text>
				{suffix ? <Text color={theme.textSubtle}>…</Text> : null}
			</Box>
		);
	}

	const cursorIndex = Math.max(0, Math.min(slice.length, cursor - start));

	return (
		<Box>
			{prefix ? <Text color={theme.textSubtle}>…</Text> : null}
			{value.length === 0 && props.placeholder ? (
				<Text color={theme.textSubtle}>
					{truncate(props.placeholder, Math.max(1, (width ?? 40) - 2))}
				</Text>
			) : null}
			<Text color={theme.fg}>
				{slice.slice(0, cursorIndex)}
				<Text inverse>{slice.slice(cursorIndex, cursorIndex + 1) || " "}</Text>
				{slice.slice(cursorIndex + 1)}
			</Text>
			{suffix ? <Text color={theme.textSubtle}>…</Text> : null}
		</Box>
	);
}

function truncate(text: string, width: number): string {
	return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text;
}
