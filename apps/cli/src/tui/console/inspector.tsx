/**
 * Inspector strip — the sticky panel under the board.
 *
 * Three zones, separated by vertical rules:
 *   identity (name, key, tagline, availability) │ CLI invocation │ flags
 *
 * When a tool is opened the CLI/flags zone gives way to the form's fields. The
 * cleanup/settings/account cards take the full width.
 *
 * Each zone is a stack of non-shrinking boxes around multi-line `Text` nodes:
 * the strip has a fixed height, so the panel must clip the overflow rather
 * than let yoga squeeze the rows into each other.
 */

import type { ToolDef } from "@qbtools/registry";
import { Box, Text } from "ink";
import { categoryColor, theme } from "../theme";
import { Panel } from "../ui/panel";
import { categoryCode } from "./categories";

export type StripMode = "details" | "tool" | "cleanup" | "settings" | "account";

export interface InspectorStripProps {
	width: number;
	height: number;
	mode: StripMode;
	tool: ToolDef | undefined;
	availability?: { label: string; hint: string };
	/** Command-line flags of the selected runner, as name + placeholder. */
	flags?: Array<{ name: string; placeholder: string }>;
	body?: React.ReactNode;
}

const MODE_LABEL: Record<StripMode, string> = {
	details: "▸ INSPECTOR",
	tool: "▸ INSPECTOR: OPEN",
	cleanup: "▸ INSPECTOR: CLEANUP",
	settings: "▸ INSPECTOR: SETTINGS",
	account: "▸ INSPECTOR: ACCOUNT",
};

/** Width of the fields zone for a given strip width (shared with the console). */
export function fieldsWidth(outerWidth: number): number {
	const inner = Math.max(20, outerWidth - 4);
	const identity = Math.max(22, Math.floor(inner * 0.24));
	return Math.max(20, inner - identity - 2);
}

export function InspectorStrip(props: InspectorStripProps) {
	const accent = props.tool ? categoryColor(props.tool.category) : theme.border.strong;
	const contentHeight = Math.max(3, props.height - 2);
	const inner = Math.max(20, props.width - 4);
	const fullWidth = props.mode !== "details" && props.mode !== "tool";
	const compact = contentHeight < 4;

	if (fullWidth) {
		return (
			<Panel
				label={MODE_LABEL[props.mode]}
				right={props.tool ? categoryCode(props.tool.category).toUpperCase() : undefined}
				width={props.width}
				height={props.height}
				accent
			>
				<Box flexDirection="column" height={contentHeight} overflow="hidden" flexShrink={0}>
					{props.body}
				</Box>
			</Panel>
		);
	}

	const identityWidth = Math.max(22, Math.floor(inner * (props.mode === "tool" ? 0.24 : 0.3)));

	return (
		<Panel
			label={MODE_LABEL[props.mode]}
			right={props.tool ? categoryCode(props.tool.category).toUpperCase() : undefined}
			width={props.width}
			height={props.height}
			accent
		>
			<Box flexDirection="row" height={contentHeight} overflow="hidden" flexShrink={0}>
				<Zone width={identityWidth} height={contentHeight} first>
					<IdentityZone
						tool={props.tool}
						availability={props.availability}
						accent={accent}
						compact={compact}
					/>
				</Zone>
				{props.mode === "tool" ? (
					<Zone width={Math.max(20, inner - identityWidth - 2)} height={contentHeight}>
						<Box flexShrink={0} height={contentHeight} overflow="hidden">
							{props.body}
						</Box>
					</Zone>
				) : (
					<>
						<Zone width={Math.max(24, Math.floor(inner * 0.34))} height={contentHeight}>
							<CliZone tool={props.tool} accent={accent} compact={compact} />
						</Zone>
						<Zone
							width={Math.max(
								18,
								inner - identityWidth - Math.max(24, Math.floor(inner * 0.34)) - 4,
							)}
							height={contentHeight}
						>
							<FlagsZone
								availability={props.availability}
								flags={props.flags}
								compact={compact}
								accent={accent}
							/>
						</Zone>
					</>
				)}
			</Box>
		</Panel>
	);
}

function Zone(props: {
	width: number;
	height: number;
	first?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Box
			flexDirection="column"
			width={props.width}
			height={props.height}
			overflow="hidden"
			flexShrink={0}
			paddingX={1}
			borderStyle="single"
			borderColor={theme.border.default}
			borderLeft={!props.first}
			borderTop={false}
			borderBottom={false}
			borderRight={false}
		>
			{props.children}
		</Box>
	);
}

/** A zone's header: an accent gem before the label, so the zones read apart. */
function ZoneTitle(props: { label: string; color: string }) {
	return (
		<>
			<Text color={props.color}>{"◆ "}</Text>
			<Text color={theme.text.secondary} bold>
				{props.label}
			</Text>
		</>
	);
}

function IdentityZone(props: {
	tool: ToolDef | undefined;
	availability?: { label: string; hint: string };
	accent: string;
	compact: boolean;
}) {
	if (!props.tool) {
		return (
			<Text color={theme.text.muted}>
				No tool selected{"\n"}
				<Text color={theme.text.muted}>type to filter the board</Text>
			</Text>
		);
	}
	return (
		<Text>
			<Text color={props.accent} bold>
				{props.tool.name}
			</Text>
			{"\n"}
			<Text color={theme.text.muted}>
				{`${categoryCode(props.tool.category)}:${props.tool.slug}`}
			</Text>
			{props.compact ? null : (
				<>
					{"\n"}
					<Text color={theme.text.primary}>{props.tool.tagline}</Text>
				</>
			)}
			{props.availability ? (
				<>
					{"\n"}
					<Text color={theme.surface.onChip} backgroundColor={theme.surface.chip}>
						{` ${props.availability.label} `}
					</Text>
				</>
			) : null}
		</Text>
	);
}

function CliZone(props: { tool: ToolDef | undefined; accent: string; compact: boolean }) {
	if (!props.tool) return <Text color={theme.text.muted}>—</Text>;
	return (
		<Text>
			<ZoneTitle label="CLI INVOCATION" color={props.accent} />
			{"\n"}
			<Text backgroundColor={theme.surface.chip}>
				<Text color={theme.surface.onChip} bold>
					{" $ "}
				</Text>
				<Text color={theme.surface.onChip} bold>
					qbtools
				</Text>
				<Text color={theme.surface.onChip}>{" run "}</Text>
				<Text color={theme.surface.onChip}>{props.tool.slug}</Text>{" "}
			</Text>
			{props.compact ? null : (
				<>
					{"\n"}
					<Text color={theme.text.secondary}>
						{"▸ Enter opens the form"} <Text color={theme.text.accent}>{"·"}</Text> Ctrl+R runs
						anywhere
					</Text>
				</>
			)}
		</Text>
	);
}

function FlagsZone(props: {
	availability?: { label: string; hint: string };
	flags?: Array<{ name: string; placeholder: string }>;
	compact: boolean;
	accent: string;
}) {
	const flags = props.flags ?? [];
	return (
		<Text>
			<ZoneTitle label="SYNOPSIS / FLAGS" color={props.accent} />
			{"\n"}
			{flags.length > 0 ? (
				flags.map((flag, index) => (
					<Text key={flag.name}>
						{index > 0 ? <Text color={theme.text.muted}>{"  "}</Text> : null}
						<Text color={theme.text.muted}>{"--"}</Text>
						{/* Tokens read in the brightest tone; placeholders sit back in the quiet cyan. */}
						<Text color={theme.status.warning}>{flag.name}</Text>
						{flag.placeholder ? (
							<Text color={theme.ui.symbol}>{` <${flag.placeholder}>`}</Text>
						) : null}
					</Text>
				))
			) : (
				<Text color={theme.text.muted}>no flags</Text>
			)}
			{props.availability && !props.compact ? (
				<>
					{"\n"}
					<Text color={theme.text.secondary}>{`▸ ${props.availability.hint}`}</Text>
				</>
			) : null}
		</Text>
	);
}
