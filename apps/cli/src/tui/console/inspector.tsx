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
import { accents, categoryAccent, theme } from "../theme";
import { Panel } from "../ui/panel";
import { categoryCode } from "./categories";

export type StripMode = "details" | "tool" | "cleanup" | "settings" | "account";

export interface InspectorStripProps {
	width: number;
	height: number;
	mode: StripMode;
	tool: ToolDef | undefined;
	availability?: { label: string; hint: string };
	flags?: string[];
	body?: React.ReactNode;
}

const MODE_LABEL: Record<StripMode, string> = {
	details: "▸ INSPECTOR",
	tool: "▸ INSPECTOR: OPEN",
	cleanup: "▸ INSPECTOR: CLEANUP",
	settings: "▸ INSPECTOR: SETTINGS",
	account: "▸ INSPECTOR: ACCOUNT",
};

const AVAILABILITY_COLOR: Record<string, string> = {
	"+sharp": accents.amber,
	"~ffmpeg": accents.amber,
	"▸ server": accents.indigo,
	local: accents.emerald,
};

/** Width of the fields zone for a given strip width (shared with the console). */
export function fieldsWidth(outerWidth: number): number {
	const inner = Math.max(20, outerWidth - 4);
	const identity = Math.max(22, Math.floor(inner * 0.24));
	return Math.max(20, inner - identity - 2);
}

export function InspectorStrip(props: InspectorStripProps) {
	const accent = props.tool ? accents[categoryAccent(props.tool.category)] : theme.borderStrong;
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
				borderColor={accent}
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
			borderColor={accent}
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
							<FlagsZone availability={props.availability} flags={props.flags} compact={compact} />
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
			borderColor={theme.border}
			borderLeft={!props.first}
			borderTop={false}
			borderBottom={false}
			borderRight={false}
		>
			{props.children}
		</Box>
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
			<Text color={theme.textSubtle}>
				No tool selected{"\n"}
				<Text color={theme.textSubtle}>type to filter the board</Text>
			</Text>
		);
	}
	return (
		<Text>
			<Text color={props.accent} bold>
				{props.tool.name}
			</Text>
			{"\n"}
			<Text color={theme.textSubtle}>
				{`${categoryCode(props.tool.category)}:${props.tool.slug}`}
			</Text>
			{props.compact ? null : (
				<>
					{"\n"}
					<Text color={theme.textDim}>{props.tool.tagline}</Text>
				</>
			)}
			{props.availability ? (
				<>
					{"\n"}
					<Text
						color={AVAILABILITY_COLOR[props.availability.label] ?? theme.textDim}
						backgroundColor={theme.muted}
					>
						{` ${props.availability.label} `}
					</Text>
				</>
			) : null}
		</Text>
	);
}

function CliZone(props: { tool: ToolDef | undefined; accent: string; compact: boolean }) {
	if (!props.tool) return <Text color={theme.textSubtle}>—</Text>;
	return (
		<Text>
			<Text color={theme.textSubtle}>CLI INVOCATION</Text>
			{"\n"}
			<Text backgroundColor={theme.muted}>
				<Text color={props.accent}> $ </Text>
				<Text color={theme.fg}>{`qbtools run ${props.tool.slug} `}</Text>
			</Text>
			{props.compact ? null : (
				<>
					{"\n"}
					<Text color={theme.textSubtle}>Enter opens the form · Ctrl+R runs anywhere</Text>
				</>
			)}
		</Text>
	);
}

function FlagsZone(props: {
	availability?: { label: string; hint: string };
	flags?: string[];
	compact: boolean;
}) {
	return (
		<Text>
			<Text color={theme.textSubtle}>SYNOPSIS / FLAGS</Text>
			{"\n"}
			<Text color={theme.textDim}>{props.flags?.length ? props.flags.join("  ") : "no flags"}</Text>
			{props.availability && !props.compact ? (
				<>
					{"\n"}
					<Text color={theme.textSubtle}>{props.availability.hint}</Text>
				</>
			) : null}
		</Text>
	);
}
