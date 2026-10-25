/**
 * Dashboard: popular tools, recents and favorites from local config.
 */

import type { SelectOption } from "@opentui/core";
import { getTool, popularTools } from "@qbtools/registry";
import { useEffect, useState } from "react";
import { AVAILABILITY_LABELS, availabilityFor } from "../../runner/map";
import { loadConfig } from "../../services/config";
import { accents, theme } from "../theme";

export interface ToolPick {
	slug: string;
	name: string;
}

export function DashboardScreen(props: { width: number; onOpenTool(slug: string): void }) {
	const [recents, setRecents] = useState<string[]>([]);
	const [favorites, setFavorites] = useState<string[]>([]);

	useEffect(() => {
		void loadConfig().then((config) => {
			setRecents(config.recents);
			setFavorites(config.favorites);
		});
	}, []);

	const popular = popularTools(8).map((tool) => ({ slug: tool.slug, name: tool.name }));
	const recentTools = recents
		.map((slug) => ({ slug, name: getTool(slug)?.name ?? slug }))
		.filter((entry) => getTool(entry.slug));
	const favoriteTools = favorites
		.map((slug) => ({ slug, name: getTool(slug)?.name ?? slug }))
		.filter((entry) => getTool(entry.slug));

	return (
		<box
			flexDirection="column"
			flexGrow={1}
			paddingTop={1}
			paddingLeft={2}
			paddingRight={2}
			gap={1}
		>
			<text>
				<span fg={theme.fg}>
					<strong>Popular tools</strong>
				</span>
				<span fg={theme.textSubtle}> — Enter opens · / searches</span>
			</text>
			<ToolList
				tools={popular.map((tool) => ({ ...tool, note: "popular" }))}
				onOpenTool={props.onOpenTool}
				focused
			/>
			{favoriteTools.length ? (
				<box flexDirection="column" gap={1}>
					<text fg={theme.fg}>
						<strong>Favorites</strong>
					</text>
					<text fg={theme.textDim}>{favoriteTools.map((tool) => tool.name).join(" · ")}</text>
				</box>
			) : null}
			{recentTools.length ? (
				<box flexDirection="column" gap={1}>
					<text fg={theme.fg}>
						<strong>Recent</strong>
					</text>
					<text fg={theme.textDim}>{recentTools.map((tool) => tool.name).join(" · ")}</text>
				</box>
			) : null}
			<text fg={theme.textSubtle}>
				<span fg={accents.emerald}>local</span>
				<span> tools run offline · </span>
				<span fg={accents.amber}>+sharp/+ffmpeg</span>
				<span> use optional native deps · </span>
				<span fg={accents.rose}>web</span>
				<span> tools open in the browser</span>
			</text>
		</box>
	);
}

function ToolList(props: {
	tools: Array<ToolPick & { note: string }>;
	onOpenTool(slug: string): void;
	focused: boolean;
}) {
	return (
		<select
			focused={props.focused}
			options={props.tools.map((tool) => ({
				name: tool.name,
				description: "",
				value: tool.slug,
			}))}
			onChange={() => {}}
			onSelect={(_index: number, option: SelectOption | null) =>
				props.onOpenTool(String(option?.value ?? ""))
			}
			height={Math.min(props.tools.length, 10)}
			selectedBackgroundColor={theme.muted}
			selectedTextColor={theme.fg}
		/>
	);
}

export function slugLabel(slug: string): string {
	const tool = getTool(slug);
	return `${tool?.name ?? slug} · ${AVAILABILITY_LABELS[availabilityFor(slug)]}`;
}
