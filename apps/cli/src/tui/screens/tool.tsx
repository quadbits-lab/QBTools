/**
 * Tool runner screen: schema-driven form → run → progress → results.
 * Focus is a form-managed index; Tab cycles, Enter runs when on the action
 * row, Esc hands control back to the shell.
 */

import { useEffect, useMemo, useState } from "react";
import type { ToolDef } from "@qbtools/registry";
import { getTool } from "@qbtools/registry";
import {
	AvailabilityBadge,
	ProgressBar,
	OutputPanel,
	FieldInput,
	FieldLabel,
} from "../components";
import { theme } from "../theme";
import { accents } from "../theme";
import { runTool, CancelledError } from "../../runner/execute";
import { UnavailableError, type RunnerOutput, type RunnerResult } from "../../runner/types";
import { readInputFiles } from "../../runner/files";
import { activeProfile, loadConfig, recordRecent } from "../../services/config";

type RunState =
	| { phase: "idle" }
	| { phase: "running"; label: string; fraction: number | null }
	| { phase: "done"; result: RunnerResult; saved: string[] }
	| { phase: "error"; message: string };

export function ToolScreen(props: { slug: string; width: number }): React.ReactElement {
	const tool = getTool(props.slug) as ToolDef | undefined;
	const [focusIndex, setFocusIndex] = useState(0);
	const [values, setValues] = useState<Record<string, unknown>>({});
	const [run, setRun] = useState<RunState>({ phase: "idle" });

	const runnerFields = useMemo(() => {
		// Resolve lazily via registry → map (avoids importing map at module top)
		return getRunnerFields(props.slug);
	}, [props.slug]);

	useEffect(() => {
		setValues(initialValues(runnerFields));
		setFocusIndex(0);
		setRun({ phase: "idle" });
	}, [runnerFields]);

	if (!tool) {
		return <text fg={theme.destructive}>Unknown tool: {props.slug}</text>;
	}

	const availability = getAvailability(props.slug);
	const totalRows = runnerFields.length + 1; // last row = Run action

	async function doRun(): Promise<void> {
		if (run.phase === "running") return;
		const config = await loadConfig();
		const profile = activeProfile(config);
		// File fields hold typed paths; resolve to File objects before running.
		const prepared: Record<string, unknown> = { ...values };
		for (const field of runnerFields) {
			if (field.kind === "file" || field.kind === "files") {
				const raw = prepared[field.name];
				const paths = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
				const cleaned = paths.map((path) => String(path).trim()).filter(Boolean);
				if (!cleaned.length) continue;
				prepared[field.name] = await readInputFiles(cleaned);
			}
			if (field.kind === "number") {
				const raw = prepared[field.name];
				if (typeof raw === "string" && raw.trim() === "") delete prepared[field.name];
			}
		}
		setRun({ phase: "running", label: "Starting…", fraction: null });
		try {
			const result = await runTool(props.slug, {
				values: prepared,
				outDir: profile.outputDir,
				onProgress: (entry) =>
					setRun({ phase: "running", label: entry.label, fraction: entry.fraction }),
			});
			await recordRecent(props.slug);
			const saved: string[] = [];
			for (const output of result.outputs as RunnerOutput[]) {
				if (output.type === "image" || output.type === "file") {
					const { writeOutput } = await import("../../runner/files");
					const wrote = await writeOutput(
						{ outDir: profile.outputDir, suggestedName: output.suggestedName },
						output.bytes,
					);
					saved.push(wrote.path);
				}
			}
			setRun({ phase: "done", result, saved });
		} catch (error) {
			if (error instanceof CancelledError) setRun({ phase: "error", message: "Cancelled." });
			else if (error instanceof UnavailableError)
				setRun({ phase: "error", message: error.message });
			else
				setRun({
					phase: "error",
					message: error instanceof Error ? error.message : String(error),
				});
		}
	}

	useEffect(() => {
		function onKey(key: { name: string; ctrl?: boolean; shift?: boolean }) {
			if (run.phase === "running") {
				if (key.name === "c" && key.ctrl) setRun({ phase: "error", message: "Cancelled." });
				return;
			}
			if (key.name === "tab") {
				setFocusIndex((index) => (index + 1) % totalRows);
				return;
			}
			if (key.name === "tab" && key.shift) {
				setFocusIndex((index) => (index - 1 + totalRows) % totalRows);
				return;
			}
			if (key.name === "r" && key.ctrl) {
				void doRun();
				return;
			}
			if ((key.name === "return" || key.name === "enter") && focusIndex === runnerFields.length) {
				void doRun();
			}
		}
		// registered via shell-level key handler; nothing here
		void onKey;
	}, [focusIndex, runnerFields, run.phase, values, totalRows]);

	function setValue(name: string, value: unknown): void {
		setValues((previous) => ({ ...previous, [name]: value }));
	}

	const innerWidth = Math.max(30, props.width - 2);

	return (
		<box flexDirection="column" flexGrow={1} paddingTop={1} paddingLeft={2} paddingRight={2} gap={1}>
			<box flexDirection="column">
				<text>
					<span fg={theme.fg}><strong>{tool.name}</strong></span>
					<span fg={theme.textSubtle}>  /{tool.slug}</span>
				</text>
				<text fg={theme.textDim}>{tool.tagline}</text>
				<AvailabilityBadge slug={props.slug} />
			</box>

			{run.phase === "running" ? (
				<ProgressBar label={run.label} fraction={run.fraction} width={Math.min(60, innerWidth)} />
			) : null}

			<box flexDirection="column" gap={1}>
				{runnerFields.map((field, index) => (
					<box key={field.name} flexDirection="column" width={innerWidth}>
						<FieldLabel field={field} />
						<FieldInput
							field={field}
							value={values[field.name]}
							focused={focusIndex === index}
							onChange={(value) => setValue(field.name, value)}
							width={innerWidth}
						/>
					</box>
				))}
				<text
					fg={focusIndex === runnerFields.length ? accents.emerald : theme.textDim}
					style={{ attributes: focusIndex === runnerFields.length ? 1 : 0 }}
				>
					{focusIndex === runnerFields.length ? "▶ Run (Enter or Ctrl+R)" : "  Run (Tab here, then Enter)"}
				</text>
			</box>

			{run.phase === "done" ? (
				<scrollbox focused height="100%" borderStyle="rounded" border borderColor={theme.border}>
					<box flexDirection="column" gap={1} padding={1}>
						<text fg={accents.emerald}>✓ {run.result.summary}</text>
						{run.saved.length ? (
							<text fg={theme.textDim}>Saved: {run.saved.join(", ")}</text>
						) : null}
						<OutputPanel outputs={run.result.outputs} />
					</box>
				</scrollbox>
			) : null}
			{run.phase === "error" ? (
				<text fg={theme.destructive}>✗ {run.message}</text>
			) : null}
		</box>
	);
}

/* --- lookup helpers kept module-local so map import stays lazy --- */

import { RUNNERS, availabilityFor } from "../../runner/map";

function getRunnerFields(slug: string) {
	return RUNNERS.get(slug)?.fields ?? [];
}

function getAvailability(slug: string) {
	return availabilityFor(slug);
}

function initialValues(fields: ReturnType<typeof getRunnerFields>): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	for (const field of fields) {
		if (field.default !== undefined) values[field.name] = field.default;
		else if (field.kind === "boolean") values[field.name] = false;
		else values[field.name] = "";
	}
	return values;
}