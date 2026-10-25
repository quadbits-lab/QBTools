/**
 * The command bar — the prompt line above the panels.
 *
 * `user@host : ~/dir$ qbtools <input>` with the key hints on the right, the
 * way a shell prompt frames the work area. The bar always stays on one line:
 * the shell prompt and the hints give way before the input does.
 */

import { Box, Text } from "ink";
import { theme } from "../theme";
import { TextInput } from "../ui";

export interface CommandBarProps {
	width: number;
	/** Shell-style prompt, e.g. `guest@quadbits : ~/cli$`. */
	shell: string;
	/** Program name shown after the prompt. */
	program: string;
	/** Current input. */
	value: string;
	onChange(value: string): void;
	focused: boolean;
	hints: Array<{ keys: string; label: string }>;
}

export function CommandBar(props: CommandBarProps) {
	const width = Math.max(40, props.width - 2);
	const maxShell = Math.max(12, Math.floor(width * 0.32));
	const shell =
		props.shell.length > maxShell ? `${props.shell.slice(0, maxShell - 1)}…` : props.shell;

	const hintText = props.hints.map((hint) => `${hint.keys} ${hint.label}`).join("  ");
	const maxHints = Math.max(0, Math.floor(width * 0.34));
	const hints =
		hintText.length > maxHints ? `${hintText.slice(0, Math.max(0, maxHints - 1))}…` : hintText;

	const prefix = `${shell} ${props.program} `;
	const inputWidth = Math.max(8, width - prefix.length - hints.length - 2);

	return (
		<Box paddingX={1} width={props.width} flexDirection="row">
			<Text color={theme.textSubtle}>{shell}</Text>
			<Text color={theme.fg}>{` ${props.program} `}</Text>
			<Box flexShrink={0}>
				<TextInput
					value={props.value}
					onChange={props.onChange}
					placeholder="type a tool, or /help"
					focused={props.focused}
					width={inputWidth}
					// With an empty prompt there is no cursor to move, so the
					// board gets the horizontal arrows.
					passThrough={(_input, key) =>
						props.value.length === 0 && (key.leftArrow || key.rightArrow)
					}
				/>
			</Box>
			<Box flexGrow={1} />
			<Text color={theme.textSubtle}>{hints}</Text>
		</Box>
	);
}
