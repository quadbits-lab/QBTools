/**
 * The header panel — the hero. The QBTOOLS CLI wordmark in half-block pixel
 * letters beside three lines of copy: the name and version, the runtime
 * facts, and the working directory, framed like every other instrument-panel
 * section.
 *
 * The wordmark sits beside the copy on wide terminals and stacks above it on
 * narrow ones.
 */

import { Box, Text } from "ink";
import { theme } from "../theme";
import { LOGO_HEIGHT, LOGO_ROWS } from "../ui/ascii-logo";
import { Panel } from "../ui/panel";

export interface HeaderProps {
	width: number;
	/** Outer height of the panel (the content is clipped to fit). */
	height: number;
	version: string;
	platform: string;
	toolCount: number;
	/** Right-hand tag in the top border, e.g. "LOCAL" or "ONLINE". */
	status: string;
	/** Home-abbreviated working directory, e.g. "~/RD/QBTools". */
	cwd: string;
}

const NAME = "QBTools CLI";

export function Header(props: HeaderProps) {
	const wide = props.width >= 92;
	// Vertical breathing room — one blank row above and below the content —
	// whenever the given height goes beyond the art (granted by the console
	// on roomy terminals; short ones keep the content flush in the frame).
	const minRows = wide ? LOGO_HEIGHT : LOGO_HEIGHT + 3;
	const padY = props.height - 2 - minRows >= 2 ? 1 : 0;

	return (
		<Panel width={props.width} height={props.height} label="QB-CORE" right={props.status} accent>
			<Box
				flexDirection={wide ? "row" : "column"}
				gap={wide ? 2 : 0}
				alignItems={wide ? "center" : "flex-start"}
				flexShrink={0}
				paddingX={wide ? 2 : 1}
				paddingY={padY}
			>
				<Box flexDirection="column" flexShrink={0}>
					{LOGO_ROWS.map((runs, index) => (
						<Text key={index}>
							{runs.map((run, runIndex) => (
								<Text key={runIndex} color={run.color} backgroundColor={run.background}>
									{run.text}
								</Text>
							))}
						</Text>
					))}
				</Box>
				<Box flexDirection="column" flexGrow={1} flexBasis={0} flexShrink={1}>
					<Text>
						<Text color={theme.fg} bold>
							{NAME}
						</Text>
						<Text color={theme.textDim}>{`  v${props.version}`}</Text>
						{"\n"}
						<Text color={theme.textDim}>{`${props.platform} · ${props.toolCount} tools`}</Text>
						{"\n"}
						<Text color={theme.textSubtle}>{props.cwd}</Text>
					</Text>
				</Box>
			</Box>
		</Panel>
	);
}
