/**
 * The command bar — the prompt between the hero and the board.
 *
 * With terminal room to spare it becomes a dashed box (`⌘ PROMPT`) holding a
 * colored shell prompt, an amber arrow, the program name and key chips; on
 * short terminals the same prompt drops the frame and stays a single line.
 * In both variants the row never wraps: the shell and the hints give way
 * before the input does.
 */

import { Box, Text } from "ink";
import { accents, theme } from "../theme";
import { TextInput } from "../ui/text-input";

export interface CommandBarProps {
	width: number;
	/** User@host part of the shell prompt, e.g. `quadbits@alans`. */
	userAt: string;
	/** Home-abbreviated working directory, e.g. `~/RD/QBTools`. */
	dir: string;
	/** Program name shown after the prompt. */
	program: string;
	/** Current input. */
	value: string;
	onChange(value: string): void;
	focused: boolean;
	/** Draw the dashed frame around the prompt (needs three rows). */
	boxed?: boolean;
	hints: Array<{ keys: string; label: string }>;
}

/** Glyph that stands for the key inside a hint chip. */
const HINT_ICONS: Record<string, string> = {
	"<Enter>": "⏎",
	"<Tab>": "⇥",
	"<Esc>": "⎋",
	"<C-?>": "?",
};

function hintIcon(keys: string): string {
	return HINT_ICONS[keys] ?? keys.replace(/[<>]/g, "").slice(0, 1);
}

/** The dashed frame's border characters — `╭┄┄╮` / `┆` / `╰┄┄╯`. */
const DASHED = {
	topLeft: "╭",
	top: "┄",
	topRight: "╮",
	left: "┆",
	right: "┆",
	bottomLeft: "╰",
	bottom: "┄",
	bottomRight: "╯",
};

export function CommandBar(props: CommandBarProps) {
	if (props.boxed) return <BoxedPrompt {...props} />;
	return <CompactPrompt {...props} />;
}

/** The single-line prompt used on short terminals. */
function CompactPrompt(props: CommandBarProps) {
	const width = Math.max(40, props.width);
	const size = sizePrompt(width - 2, 2, props.userAt, props.dir, props.program, props.hints);
	return (
		<Box paddingX={1} width={width} flexDirection="row" flexShrink={0} overflow="hidden">
			<Text color={accents.sky} bold>
				{"⌘ "}
			</Text>
			<PromptRow {...props} size={size} />
		</Box>
	);
}

/** The framed prompt: dashed border with the label embedded in the top rule. */
function BoxedPrompt(props: CommandBarProps) {
	const width = Math.max(24, props.width);
	const border = props.focused ? accents.sky : theme.borderStrong;
	const size = sizePrompt(width - 4, 0, props.userAt, props.dir, props.program, props.hints);

	return (
		<Box flexDirection="column" width={width} flexShrink={0}>
			<Box flexShrink={0} flexDirection="row">
				<Text color={border}>{`╭┄ `}</Text>
				<Text color={props.focused ? accents.sky : theme.textSubtle} bold>
					⌘
				</Text>
				<Text color={props.focused ? accents.sky : theme.textSubtle} bold>
					{` PROMPT `}
				</Text>
				<Text color={border}>{`${"┄".repeat(Math.max(0, width - 13))}╮`}</Text>
			</Box>
			<Box
				width={width}
				paddingX={1}
				borderStyle={DASHED}
				borderTop={false}
				borderBottom={false}
				borderColor={border}
				flexShrink={0}
			>
				<PromptRow {...props} size={size} />
			</Box>
			<Box flexShrink={0} flexDirection="row">
				<Text color={border}>{`╰${"┄".repeat(Math.max(0, width - 2))}╯`}</Text>
			</Box>
		</Box>
	);
}

/**
 * Widths of the fixed prompt segments and the fitted shell. The hints are
 * dropped from the right before the input or the shell starves — the input
 * is the one thing that must never wrap.
 */
interface PromptSize {
	user: string;
	sep: string;
	dir: string;
	inputWidth: number;
	hints: Array<{ keys: string; label: string }>;
}

function sizePrompt(
	content: number,
	iconWidth: number,
	userAt: string,
	dir: string,
	program: string,
	hints: Array<{ keys: string; label: string }>,
): PromptSize {
	const arrow = " ❯ ";
	const base = iconWidth + arrow.length + program.length + 1;
	let kept = [...hints];
	let hintsWidth = widthOf(kept);
	// Trailing chips give way first so shell and input keep room.
	while (kept.length > 1 && base + hintsWidth + 14 + 8 > content) {
		kept = kept.slice(0, -1);
		hintsWidth = widthOf(kept);
	}
	const leftover = Math.max(0, content - base - hintsWidth - 1);
	const inputFloor = Math.max(6, Math.floor(content * 0.1));
	const budget = Math.min(userAt.length + 3 + dir.length, Math.max(10, leftover - inputFloor));
	const fit = fitShell(userAt, dir, budget);
	const shellWidth = fit.user.length + fit.sep.length + fit.dir.length;
	const inputWidth = Math.max(6, content - base - shellWidth - hintsWidth);
	return { inputWidth, hints: kept, ...fit };
}

/** Shrink user@host and then the path so the whole shell fits the budget. */
interface ShellFit {
	user: string;
	sep: string;
	dir: string;
}

function fitShell(userAt: string, dir: string, budget: number): ShellFit {
	const sep = " : ";
	if (userAt.length + sep.length + dir.length <= budget) {
		return { user: userAt, sep, dir };
	}
	// The path yields first; then both sides are shortened, path keeping a
	// readable tail.
	const dirBudget = budget - userAt.length - sep.length;
	if (dirBudget >= 6) {
		return { user: userAt, sep, dir: truncateEnd(dir, dirBudget) };
	}
	const userBudget = Math.max(8, Math.floor(budget * 0.7));
	const user = truncateEnd(userAt, Math.min(userAt.length, userBudget));
	const dirBudgetAgain = budget - user.length - sep.length;
	if (dirBudgetAgain >= 6) {
		return { user, sep, dir: truncateEnd(dir, dirBudgetAgain) };
	}
	return { user: truncateEnd(userAt, Math.max(8, budget - 4)), sep: " ", dir: "" };
}

function widthOf(hints: Array<{ keys: string; label: string }>): number {
	if (hints.length === 0) return 0;
	return hints.reduce((sum, hint) => sum + 2 + 1 + hint.label.length, 0) + (hints.length - 1) * 2;
}

function PromptRow(props: CommandBarProps & { size: PromptSize }) {
	const shell = props.size;
	return (
		<Box flexDirection="row" flexShrink={0} overflow="hidden">
			{shell.user ? (
				<Box flexShrink={0}>
					<Text color={accents.emerald}>{shell.user}</Text>
				</Box>
			) : null}
			{shell.sep ? (
				<Box flexShrink={0}>
					<Text color={theme.textSubtle}>{shell.sep}</Text>
				</Box>
			) : null}
			{shell.dir ? (
				<Box flexShrink={0}>
					<Text color={accents.sky}>{shell.dir}</Text>
				</Box>
			) : null}
			<Box flexShrink={0}>
				<Text color={props.focused ? accents.amber : theme.textSubtle} bold={props.focused}>
					{" ❯ "}
				</Text>
			</Box>
			<Box flexShrink={0}>
				<Text color={props.focused ? theme.fg : theme.textDim} bold={props.focused}>
					{`${props.program} `}
				</Text>
			</Box>
			<Box flexShrink={0}>
				<TextInput
					value={props.value}
					onChange={props.onChange}
					placeholder="type a tool, or /help"
					focused={props.focused}
					width={shell.inputWidth}
					// With an empty prompt there is no cursor to move, so the
					// board gets the horizontal arrows.
					passThrough={(_input, key) =>
						props.value.length === 0 && (key.leftArrow || key.rightArrow)
					}
				/>
			</Box>
			<Box flexGrow={1} flexShrink={0} />
			<HintChips hints={shell.hints} focused={props.focused} />
		</Box>
	);
}

function HintChips(props: { hints: Array<{ keys: string; label: string }>; focused: boolean }) {
	return (
		<Box flexDirection="row" flexShrink={0}>
			{props.hints.map((hint, index) => (
				<Box key={hint.keys} marginLeft={index > 0 ? 2 : 0} flexShrink={0}>
					<Text
						backgroundColor={props.focused ? theme.muted : undefined}
						color={props.focused ? accents.sky : theme.textSubtle}
						bold
					>
						{` ${hintIcon(hint.keys)}`}
					</Text>
					<Text color={props.focused ? theme.textDim : theme.textSubtle}>{` ${hint.label}`}</Text>
				</Box>
			))}
		</Box>
	);
}

function truncateEnd(text: string, width: number): string {
	width = Math.max(1, width);
	if (text.length <= width) return text;
	return `${text.slice(0, Math.max(0, width - 1))}…`;
}
