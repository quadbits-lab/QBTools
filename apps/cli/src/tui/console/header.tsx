/**
 * The header panel — the hero. Carries the ASCII wordmark, the title, the
 * description and the version, framed the way the instrument panel frames
 * every other section.
 *
 * The wordmark sits beside the copy on wide terminals and stacks above it on
 * narrow ones.
 */

import { Box, Text } from "ink";
import { accents, theme } from "../theme";
import { LOGO_LINES } from "../ui/ascii-logo";
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
}

const TITLE = "QBTools CLI - Private By Default";
const DESCRIPTION =
	"Compress, merge, format, and encrypt files locally from the command line. Zero server calls.";

export function Header(props: HeaderProps) {
	const wide = props.width >= 92;

	return (
		<Panel
			width={props.width}
			height={props.height}
			label={`QB-CORE v${props.version} (${props.platform})`}
			right={props.status}
			accent
		>
			<Box flexDirection={wide ? "row" : "column"} gap={wide ? 2 : 0} flexShrink={0}>
				<Box flexDirection="column" flexShrink={0}>
					{LOGO_LINES.map((line, index) => (
						<Text
							key={index}
							color={index < 2 ? accents.indigo : index === 2 ? accents.violet : theme.textSubtle}
						>
							{line}
						</Text>
					))}
				</Box>
				<Box flexDirection="column" flexGrow={1} flexBasis={0} flexShrink={1}>
					<Text>
						<Text color={theme.fg} bold>
							{TITLE}
						</Text>
						{`\n${DESCRIPTION}`}
						{wide ? `\n` : ""}
						{wide ? (
							<Text color={theme.textSubtle}>
								{`${props.toolCount} tools · v${props.version} · no server required`}
							</Text>
						) : null}
					</Text>
				</Box>
			</Box>
		</Panel>
	);
}
