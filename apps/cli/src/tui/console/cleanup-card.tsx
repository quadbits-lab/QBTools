/**
 * Cleanup card — the system cleanup flow, rendered in the inspector.
 *
 * Scans read-only on mount, Space toggles categories, and the two-step
 * confirm (select row → Enter → Y) stands between the user and a deletion.
 */

import { Box, Text } from "ink";
import { useEffect, useMemo, useState } from "react";
import {
	type CleanResult,
	cleanScan,
	type ScanReport,
	scanTargets,
} from "../../services/cleanup/clean";
import { OS_LABELS } from "../../services/cleanup/targets";
import { theme } from "../theme";
import { CARD_KEY_PRIORITY, Select, Spinner, useKeyHandler } from "../ui";
import { type ConsoleEvent, makeEvent } from "./events";

const COMMANDS_ROW = "__commands__";
const CLEAN_ROW = "__clean__";

export interface CleanupCardProps {
	width: number;
	onEvent(event: ConsoleEvent): void;
	onClose(): void;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KiB", "MiB", "GiB"];
	let value = bytes;
	let unit = "B";
	for (const next of units) {
		if (value < 1024) break;
		value /= 1024;
		unit = next;
	}
	return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
}

export function CleanupCard(props: CleanupCardProps) {
	const [report, setReport] = useState<ScanReport | null>(null);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [phase, setPhase] = useState<"scan" | "review" | "confirm" | "clean" | "done">("scan");
	const [label, setLabel] = useState("Starting scan…");

	useEffect(() => {
		void scanTargets({ onProgress: (text) => setLabel(text) })
			.then((scanned) => {
				setReport(scanned);
				setPhase("review");
			})
			.catch((error) => {
				setLabel(error instanceof Error ? error.message : String(error));
				setPhase("done");
			});
	}, []);

	const options = useMemo(() => {
		if (!report) return [];
		return [
			...report.categories
				.filter((row) => row.target.kind !== "command")
				.map((row) => ({
					label: `${row.target.label} · ${formatBytes(row.totalBytes)}`,
					value: row.target.id,
					group: "CATEGORIES",
					checkable: true,
				})),
			{
				label: "Native commands (brew/apt)",
				value: COMMANDS_ROW,
				group: "OPTIONS",
				checkable: true,
			},
			{ label: "Clean selection", value: CLEAN_ROW, group: "OPTIONS", checkable: false },
		];
	}, [report]);

	const selectedBytes =
		report?.categories
			.filter((row) => selected.has(row.target.id))
			.reduce((sum, row) => sum + row.totalBytes, 0) ?? 0;

	async function runClean(): Promise<void> {
		if (!report) return;
		setPhase("clean");
		try {
			const result: CleanResult = await cleanScan(report, {
				runCommands: selected.has(COMMANDS_ROW),
				onProgress: (entry) => setLabel(entry.label),
			});
			props.onEvent(
				makeEvent(
					"DONE",
					`freed ${formatBytes(result.freedBytes)} · ${result.deletedFiles} files`,
					{
						level: "ok",
						detail: [`audit: ${result.auditPath}`],
					},
				),
			);
			setPhase("done");
		} catch (error) {
			props.onEvent(
				makeEvent("ERR", error instanceof Error ? error.message : String(error), {
					level: "error",
				}),
			);
			setPhase("done");
		}
	}

	useKeyHandler(
		(input, key) => {
			if (phase === "confirm") {
				if (input === "y" || input === "Y") {
					void runClean();
					return true;
				}
				if (key.escape) {
					setPhase("review");
					return true;
				}
				return false;
			}
			if (key.escape) {
				props.onClose();
				return true;
			}
			return false;
		},
		{ priority: CARD_KEY_PRIORITY },
	);

	if (phase === "scan") {
		return (
			<Box flexDirection="column">
				<Text color={theme.text.primary} bold>
					System cleanup
				</Text>
				<Spinner label={label} />
			</Box>
		);
	}
	if (phase === "clean") {
		return (
			<Box flexDirection="column">
				<Text color={theme.text.primary} bold>
					Cleaning…
				</Text>
				<Text color={theme.text.secondary}>{label}</Text>
			</Box>
		);
	}
	if (phase === "done" || !report) {
		return (
			<Box flexDirection="column">
				<Text color={theme.text.primary} bold>
					System cleanup
				</Text>
				<Text color={theme.text.muted}>done — Esc to close</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" flexShrink={0}>
			<Text color={theme.text.primary} bold>
				{`System cleanup — ${OS_LABELS[report.os]}`}
			</Text>
			{phase === "confirm" ? (
				<Text color={theme.status.error}>Press Y to delete — Esc to go back.</Text>
			) : null}
			<Select
				options={options}
				multi
				vimKeys
				checked={selected}
				focused={phase === "review"}
				visibleRows={Math.max(4, Math.min(10, options.length))}
				onToggle={(value) => {
					if (value === CLEAN_ROW) return;
					setSelected((previous) => {
						const next = new Set(previous);
						if (next.has(value)) next.delete(value);
						else next.add(value);
						return next;
					});
				}}
				onSelect={(value) => {
					if (value === CLEAN_ROW && selected.size > 0) setPhase("confirm");
				}}
			/>
			<Text color={theme.text.muted}>
				{`Selection: ${formatBytes(selectedBytes)} in ${selected.size} item${selected.size === 1 ? "" : "s"}`}
			</Text>
		</Box>
	);
}
