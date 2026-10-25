/**
 * The status bar — the bottom row of the console.
 *
 * `NORMAL │ qbtools │ 0 NETWORK EGRESS │ <C-f> Focus … │ utf-8(Unix)`
 * Always one line: the hints give way before the mode and posture.
 */

import { Box, Text } from "ink";
import { accents, theme } from "../theme";

export interface StatusBarProps {
	width: number;
	/** Operating mode, e.g. "NORMAL" / "RUNNING" / "INPUT". */
	mode: string;
	/** Network posture — the CLI is local-first, so this stays at 0. */
	network?: string;
	/** Key hints shown in the middle. */
	hints: Array<{ keys: string; label: string }>;
	/** Optional right-hand metadata. */
	right?: string;
}

export function StatusBar(props: StatusBarProps) {
	const width = Math.max(40, props.width - 2);
	const posture = props.network ?? "0 NETWORK EGRESS";
	const head = `${props.mode} │ qbtools │ ${posture} │ `;
	const hintText = props.hints.map((hint) => `${hint.keys} ${hint.label}`).join("  ");
	// The right-hand metadata only survives when the hints still have room.
	const rightFits = width - head.length - hintText.length - 3 >= 12;
	const right = props.right && rightFits ? ` │ ${props.right}` : "";
	const budget = width - head.length - right.length;
	const hints =
		budget <= 0 ? "" : hintText.length > budget ? `${hintText.slice(0, budget - 1)}…` : hintText;

	return (
		<Box paddingX={1} width={props.width} flexDirection="row">
			<Text color={accents.emerald}>{props.mode}</Text>
			<Text color={theme.textSubtle}>{" │ "}</Text>
			<Text color={theme.textDim}>qbtools</Text>
			<Text color={theme.textSubtle}>{" │ "}</Text>
			<Text color={theme.textSubtle}>{posture}</Text>
			<Text color={theme.textSubtle}>{" │ "}</Text>
			<Text color={theme.textSubtle}>{hints}</Text>
			<Box flexGrow={1} />
			{right ? <Text color={theme.textSubtle}>{right}</Text> : null}
		</Box>
	);
}
