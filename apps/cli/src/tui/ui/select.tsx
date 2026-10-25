/**
 * Select list — the replacement for OpenTUI's `<select>`.
 *
 * Renders an optional group header per group, a cursor row, checkbox markers
 * in multi mode and a scroll window when the list is longer than the visible
 * rows. Owns the keyboard while focused.
 */

import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { accents, theme } from "../theme";
import { useKeyHandler, WIDGET_KEY_PRIORITY } from "./key-router";

export interface SelectOption {
	label: string;
	value: string;
	hint?: string;
	group?: string;
	/** Multi mode: set to false for rows that are not checkboxes. */
	checkable?: boolean;
}

export interface SelectProps {
	options: SelectOption[];
	/** Currently selected value (controlled). */
	value?: string;
	onChange?(value: string): void;
	/** Fired on Enter. */
	onSelect?(value: string): void;
	focused?: boolean;
	/** Rows shown at once; the list scrolls beyond that. */
	visibleRows?: number;
	/** Multi mode: Space toggles the row under the cursor. */
	multi?: boolean;
	checked?: ReadonlySet<string>;
	onToggle?(value: string): void;
	emptyMessage?: string;
	/** Enable vim-style j/k navigation (off when a text field shares the keyboard). */
	vimKeys?: boolean;
	/** Keep the full list visible when the select is not focused. */
	alwaysExpanded?: boolean;
	priority?: number;
}

export function Select(props: SelectProps) {
	const { options, value, focused = false, multi = false } = props;
	const [cursor, setCursor] = useState(0);

	useEffect(() => {
		if (value === undefined) return;
		const index = options.findIndex((option) => option.value === value);
		if (index >= 0) setCursor(index);
	}, [value, options]);

	const move = (delta: number) => {
		if (options.length === 0) return;
		const next = Math.max(0, Math.min(options.length - 1, cursor + delta));
		setCursor(next);
		const option = options[next];
		if (option) props.onChange?.(option.value);
	};

	useKeyHandler(
		(input, key) => {
			if (!focused) return;
			if (key.upArrow || (props.vimKeys && input === "k" && !key.ctrl)) {
				move(-1);
				return true;
			}
			if (key.downArrow || (props.vimKeys && input === "j" && !key.ctrl)) {
				move(1);
				return true;
			}
			if (key.pageUp) {
				move(-(props.visibleRows ?? 10));
				return true;
			}
			if (key.pageDown) {
				move(props.visibleRows ?? 10);
				return true;
			}
			if (key.home) {
				move(-options.length);
				return true;
			}
			if (key.end) {
				move(options.length);
				return true;
			}
			if (key.return) {
				const option = options[cursor];
				if (option) props.onSelect?.(option.value);
				return true;
			}
			if (multi && input === " ") {
				const option = options[cursor];
				if (option) props.onToggle?.(option.value);
				return true;
			}
			return false;
		},
		{ active: focused, priority: props.priority ?? WIDGET_KEY_PRIORITY },
	);

	if (options.length === 0) {
		return (
			<Box>
				<Text color={theme.textSubtle}>{props.emptyMessage ?? "Nothing to show."}</Text>
			</Box>
		);
	}

	// An unfocused select behaves like a value: one line with the current
	// choice, no cursor and no option list.
	if (!focused && !props.alwaysExpanded) {
		const selectedOption =
			options.find((option) => option.value === value) ?? options[cursor] ?? options[0];
		return (
			<Box>
				<Text color={theme.textDim}>{selectedOption?.label ?? ""}</Text>
			</Box>
		);
	}

	const visibleRows = Math.max(1, props.visibleRows ?? options.length);
	const start = Math.max(0, Math.min(cursor - visibleRows + 1, options.length - visibleRows));
	const window = options.slice(start, start + visibleRows);
	let previousGroup: string | undefined;

	return (
		<Box flexDirection="column">
			{start > 0 ? <Text color={theme.textSubtle}>{`↑ ${start} more`}</Text> : null}
			{window.map((option, index) => {
				const absolute = start + index;
				const isCursor = absolute === cursor;
				const showGroup = option.group !== undefined && option.group !== previousGroup;
				previousGroup = option.group;
				const isChecked = props.checked?.has(option.value) === true;
				return (
					<Box key={option.value} flexDirection="column">
						{showGroup ? <Text color={theme.textSubtle}>{`  ${option.group}`}</Text> : null}
						<Box>
							{isCursor ? <Text color={accents.indigo}>▸ </Text> : <Text> </Text>}
							{multi && option.checkable !== false ? (
								<Text color={isChecked ? accents.emerald : theme.textSubtle}>
									{isChecked ? "[x] " : "[ ] "}
								</Text>
							) : null}
							<Text color={isCursor ? theme.fg : theme.textDim}>{option.label}</Text>
							{option.hint ? <Text color={theme.textSubtle}>{`  ${option.hint}`}</Text> : null}
						</Box>
					</Box>
				);
			})}
			{start + window.length < options.length ? (
				<Text color={theme.textSubtle}>{`↓ ${options.length - start - window.length} more`}</Text>
			) : null}
		</Box>
	);
}
