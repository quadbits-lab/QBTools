/**
 * The header panel — the hero. The QBTOOLS CLI wordmark and the
 * details block (name and version, runtime facts, working directory) share
 * the width evenly — the three gaps (left edge, between the blocks, right
 * edge) are equal, so the pair floats centered like one composition —
 * framed like every other instrument-panel section, centered vertically.
 *
 * On narrow terminals the two blocks stack and center as one column. The
 * details lines open on a full-block rail; each carries its own mark — gem
 * for identity, lamp for the runtime, pointer for the path.
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

/** The gem before the name — the active blue, like the category names below. */
const MARK = "◆";

/** Half-width block divider at the start of the details lines — one thin bar per row. */
const RAIL = "▌";

/** Runtime lamp (the local-mode dot's glyph) and the pointer before the path. */
const RUN_MARK = "●";
const PATH_MARK = "▸";

export function Header(props: HeaderProps) {
	const wide = props.width >= 92;

	// The copy runs three rows; the smaller art leaves room for air around the
	// content — the wide layout spreads evenly (the padding is the spacing
	// itself), the narrow stack pads before centering.

	const minRows = wide ? LOGO_HEIGHT : LOGO_HEIGHT + 4;

	const padY = props.height - 2 - minRows >= 2 ? 1 : 0;

	return (
		<Panel width={props.width} height={props.height} label="QB-CORE" right={props.status} accent>
			<Box
				width="100%"
				flexGrow={1}
				flexDirection={wide ? "row" : "column"}
				justifyContent={wide ? "space-evenly" : "center"}
				alignItems="center"
				gap={wide ? 0 : 1}
				paddingX={wide ? 0 : 2}
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
				<Box flexDirection="column" flexShrink={0}>
					<Text>
						<Text color={theme.border.divider}>{`${RAIL}   `}</Text>
						<Text color={theme.text.active}>{`${MARK} `}</Text>
						<Text color={theme.text.primary} bold>
							{NAME}
						</Text>
						<Text color={theme.text.secondary}>{`  v${props.version}`}</Text>
					</Text>
					<Text>
						<Text color={theme.border.divider}>{`${RAIL}   `}</Text>
						<Text color={theme.status.success}>{`${RUN_MARK} `}</Text>
						<Text color={theme.text.muted}>{`${props.platform} · `}</Text>
						<Text color={theme.text.primary} bold>
							{props.toolCount}
						</Text>
						<Text color={theme.text.muted}>{" tools"}</Text>
					</Text>
					<Text>
						<Text color={theme.border.divider}>{`${RAIL}   `}</Text>
						<Text color={theme.ui.symbol}>{`${PATH_MARK} `}</Text>
						<Text color={theme.text.muted}>{props.cwd}</Text>
					</Text>
				</Box>
			</Box>
		</Panel>
	);
}
