/**
 * Boxed panel with the label embedded in the top border — the console's
 * structural element:
 *
 *   ┌─ SYS:TELEMETRY ────────────────── ONLINE ─┐
 *   │ content                                  │
 *   └───────────────────────────────────────────┘
 *
 * The label and the right-hand tag live inside the border, so the frame never
 * shifts when a panel's content changes. A panel with a fixed height clips
 * its content instead of resizing the frame.
 */

import { Box, Text } from "ink";
import { theme } from "../theme";

export interface PanelProps {
	/** Left label, embedded in the top border. */
	label?: string;
	/** Right tag, embedded in the top border. */
	right?: string;
	/** Total outer width in columns (including both borders). */
	width: number;
	children: React.ReactNode;
	/** Border color; defaults to the theme border. */
	borderColor?: string;
	/** Highlight the panel border (used for the focused panel). */
	accent?: boolean;
	/** Fixed content height; the content is clipped when it does not fit. */
	height?: number;
}

export function Panel(props: PanelProps) {
	const width = Math.max(12, props.width);
	const inner = width - 2;
	const left = props.label ? `─ ${props.label} ` : "─";
	const right = props.right ? ` ${props.right} ` : "";
	const fill = Math.max(0, inner - left.length - right.length);
	const top = `┌${left}${"─".repeat(fill)}${right}┐`;
	const bottom = `└${"─".repeat(inner)}┘`;
	const borderColor = props.accent ? theme.borderStrong : (props.borderColor ?? theme.border);

	return (
		<Box flexDirection="column" width={width} flexShrink={0}>
			<Text color={borderColor}>{top}</Text>
			<Box
				flexDirection="column"
				width={width}
				paddingX={1}
				height={props.height ? Math.max(1, props.height - 2) : undefined}
				overflow={props.height ? "hidden" : undefined}
				borderStyle="single"
				borderTop={false}
				borderBottom={false}
				borderColor={borderColor}
			>
				{props.children}
			</Box>
			<Text color={borderColor}>{bottom}</Text>
		</Box>
	);
}

/** A bracketed chip — `[ALL (42)]`, `[STATUS: READY]`. */
export interface ChipProps {
	label: string;
	active?: boolean;
	dim?: boolean;
}

export function Chip(props: ChipProps) {
	const color = props.active ? theme.fg : props.dim ? theme.textSubtle : theme.textDim;
	return (
		<Text color={color} backgroundColor={props.active ? theme.muted : undefined}>
			{`[${props.label}]`}
		</Text>
	);
}
