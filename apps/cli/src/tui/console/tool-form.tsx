/**
 * The tool form — the fields zone of the inspector strip.
 *
 * Fields flow into columns (column-major) so a wide strip fits a whole schema.
 * The identity (name, key, availability) lives in the strip's first zone; this
 * component owns the fields, the Run row and the running/error line.
 */

import { getTool } from "@qbtools/registry";
import { Box, Text } from "ink";
import { useEffect, useMemo, useRef, useState } from "react";
import { CancelledError, runTool } from "../../runner/execute";
import { readInputFiles, writeOutput } from "../../runner/files";
import { RUNNERS } from "../../runner/map";
import { type RunnerField, type RunnerOutput, UnavailableError } from "../../runner/types";
import { activeProfile, loadConfig, recordRecent } from "../../services/config";
import { type FileSuggestion, suggestFiles } from "../../services/file-suggest";
import { setCancelHandler } from "../cancel";
import { accents, theme } from "../theme";
import { CARD_KEY_PRIORITY, Select, TextArea, TextInput, useKeyHandler } from "../ui";

export interface ToolFormProps {
	slug: string;
	/** Width of the fields zone. */
	width: number;
	/** Height available inside the strip. */
	height: number;
	onComplete(result: { summary: string; outputs: RunnerOutput[]; saved: string[] }): void;
	onClose(): void;
}

const MIN_COLUMN = 30;
const MAX_SUGGESTIONS = 4;

export function ToolForm(props: ToolFormProps) {
	const tool = getTool(props.slug);
	const fields = useMemo(() => RUNNERS.get(props.slug)?.fields ?? [], [props.slug]);
	const [values, setValues] = useState<Record<string, unknown>>({});
	const [focusIndex, setFocusIndex] = useState(0);
	const [running, setRunning] = useState<string | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);
	const [suggestions, setSuggestions] = useState<FileSuggestion[]>([]);
	const [suggestIndex, setSuggestIndex] = useState(0);
	const abortRef = useRef<AbortController | null>(null);
	const suggestTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const suggestToken = useRef(0);

	const runRow = fields.length;

	const columnCount = Math.max(1, Math.min(4, Math.floor((props.width - 2) / MIN_COLUMN)));
	const perColumn = Math.max(1, Math.ceil(fields.length / columnCount));
	const columns = useMemo(() => {
		const chunks: RunnerField[][] = [];
		for (let start = 0; start < fields.length; start += perColumn) {
			chunks.push(fields.slice(start, start + perColumn));
		}
		return chunks;
	}, [fields, perColumn]);
	const columnWidth = Math.max(
		MIN_COLUMN,
		Math.floor((props.width - (Math.max(1, columns.length) - 1)) / Math.max(1, columns.length)),
	);

	useEffect(() => {
		setValues(initialValues(fields));
		setFocusIndex(0);
		setRunning(undefined);
		setError(undefined);
	}, [fields]);

	useEffect(() => () => setCancelHandler(null), []);

	function setValue(name: string, value: unknown): void {
		setValues((previous) => ({ ...previous, [name]: value }));
	}

	function queueSuggestions(prefix: string): void {
		if (suggestTimer.current) clearTimeout(suggestTimer.current);
		if (!prefix.trim()) {
			setSuggestions([]);
			setSuggestIndex(0);
			return;
		}
		const token = ++suggestToken.current;
		suggestTimer.current = setTimeout(() => {
			void suggestFiles(prefix, { limit: MAX_SUGGESTIONS }).then((results) => {
				if (suggestToken.current !== token) return;
				setSuggestions(results);
				setSuggestIndex(0);
			});
		}, 120);
	}

	async function doRun(): Promise<void> {
		if (running) return;
		const config = await loadConfig();
		const profile = activeProfile(config);
		const prepared: Record<string, unknown> = { ...values };
		for (const field of fields) {
			if (field.kind === "file" || field.kind === "files") {
				const raw = prepared[field.name];
				const paths = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
				const cleaned = paths.map((path) => String(path).trim()).filter(Boolean);
				if (cleaned.length) prepared[field.name] = await readInputFiles(cleaned);
			}
			if (field.kind === "number") {
				const raw = prepared[field.name];
				if (typeof raw === "string" && raw.trim() === "") delete prepared[field.name];
			}
		}
		const controller = new AbortController();
		abortRef.current = controller;
		setCancelHandler(() => controller.abort());
		setRunning("starting");
		setError(undefined);
		try {
			const result = await runTool(props.slug, {
				values: prepared,
				outDir: profile.outputDir,
				signal: controller.signal,
				onProgress: (entry) =>
					setRunning(
						entry.fraction === null
							? entry.label
							: `${entry.label} ${Math.round(entry.fraction * 100)}%`,
					),
			});
			await recordRecent(props.slug);
			const saved: string[] = [];
			for (const output of result.outputs as RunnerOutput[]) {
				if (output.type === "image" || output.type === "file") {
					const wrote = await writeOutput(
						{ outDir: profile.outputDir, suggestedName: output.suggestedName },
						output.bytes,
					);
					saved.push(wrote.path);
				}
			}
			props.onComplete({ summary: result.summary, outputs: result.outputs, saved });
		} catch (caught) {
			if (caught instanceof CancelledError) setError("Cancelled.");
			else if (caught instanceof UnavailableError) setError(caught.message);
			else setError(caught instanceof Error ? caught.message : String(caught));
		} finally {
			abortRef.current = null;
			setCancelHandler(null);
			setRunning(undefined);
		}
	}

	const suggestionOpen =
		suggestions.length > 0 &&
		focusIndex < fields.length &&
		(fields[focusIndex]?.kind === "file" || fields[focusIndex]?.kind === "files");

	useKeyHandler(
		(input, key) => {
			if (suggestionOpen && (key.upArrow || key.downArrow)) {
				setSuggestIndex((index) => {
					const delta = key.upArrow ? -1 : 1;
					return Math.max(0, Math.min(suggestions.length - 1, index + delta));
				});
				return true;
			}
			if (suggestionOpen && key.return) {
				const suggestion = suggestions[suggestIndex];
				if (suggestion) {
					setValue(fields[focusIndex]?.name ?? "", suggestion.path);
					setSuggestions([]);
				}
				return true;
			}
			if (suggestionOpen && key.escape) {
				setSuggestions([]);
				return true;
			}
			if (key.tab) {
				setFocusIndex((index) => {
					const next = index + (key.shift ? -1 : 1);
					if (next < 0) return runRow;
					if (next > runRow) return 0;
					return next;
				});
				return true;
			}
			if (key.escape) {
				props.onClose();
				return true;
			}
			if (key.ctrl && input === "r") {
				void doRun();
				return true;
			}
			if (key.return && focusIndex === runRow) {
				void doRun();
				return true;
			}
			return false;
		},
		{ priority: CARD_KEY_PRIORITY },
	);

	if (!tool) return <Text color={theme.destructive}>Unknown tool: {props.slug}</Text>;

	const runFocused = focusIndex === runRow;

	return (
		<Box flexDirection="column" height={props.height} overflow="hidden" flexShrink={0}>
			<Box flexDirection="row" flexShrink={0}>
				{columns.map((chunk, columnIndex) => (
					<Box
						key={columnIndex}
						flexDirection="column"
						width={columnWidth}
						paddingRight={1}
						flexShrink={0}
					>
						{chunk.map((field) => {
							const index = fields.indexOf(field);
							const focused = focusIndex === index;
							return (
								<Box key={field.name} flexDirection="column" marginBottom={1} flexShrink={0}>
									<Text color={focused ? theme.fg : theme.textDim}>
										{`${focused ? "▸" : " "} ${field.label}`}
										{field.required ? <Text color={accents.rose}>*</Text> : null}
									</Text>
									<FieldInput
										field={field}
										value={values[field.name]}
										focused={focused}
										width={Math.max(12, columnWidth - 3)}
										onChange={(value) => {
											setValue(field.name, value);
											if (field.kind === "file" || field.kind === "files") {
												queueSuggestions(typeof value === "string" ? value : "");
											}
										}}
									/>
									{suggestionOpen && focused ? (
										<Box flexDirection="column" flexShrink={0}>
											{suggestions.map((suggestion, suggestionIdx) => (
												<Text
													key={suggestion.path}
													color={
														suggestionIdx === suggestIndex ? accents.emerald : theme.textSubtle
													}
												>
													{`${suggestionIdx === suggestIndex ? "›" : " "} ${
														suggestion.isDirectory ? `${suggestion.label} (dir)` : suggestion.label
													}`}
												</Text>
											))}
										</Box>
									) : null}
								</Box>
							);
						})}
					</Box>
				))}
			</Box>

			<Box flexShrink={0} marginTop={0}>
				<Text
					color={runFocused ? theme.bg : accents.emerald}
					backgroundColor={runFocused ? accents.emerald : undefined}
				>
					{runFocused ? " ▸ Run  (Enter) " : " ▸ Run  (Tab to run · Ctrl+R anywhere) "}
				</Text>
			</Box>
			{running ? (
				<Box flexShrink={0}>
					<Text color={theme.textDim}>{`⠋ ${running}`}</Text>
				</Box>
			) : null}
			{error ? (
				<Box flexShrink={0}>
					<Text color={theme.destructive}>{`✗ ${error}`}</Text>
				</Box>
			) : null}
		</Box>
	);
}

function FieldInput(props: {
	field: RunnerField;
	value: unknown;
	focused: boolean;
	width: number;
	onChange(value: unknown): void;
}) {
	const field = props.field;
	if (field.kind === "boolean") {
		const on = props.value === true || props.value === "true";
		return (
			<Select
				focused={props.focused}
				options={[
					{ label: "On", value: "true" },
					{ label: "Off", value: "false" },
				]}
				value={on ? "true" : "false"}
				onChange={(value) => props.onChange(value === "true")}
				visibleRows={2}
			/>
		);
	}
	if (field.kind === "select") {
		const options = (field.options ?? []).map((option) => ({
			label: option.label,
			value: option.value,
		}));
		return (
			<Select
				focused={props.focused}
				options={options}
				value={typeof props.value === "string" ? props.value : undefined}
				onChange={(value) => props.onChange(value)}
				visibleRows={Math.max(2, Math.min(4, options.length))}
			/>
		);
	}
	if (field.kind === "textarea") {
		return (
			<TextArea
				value={typeof props.value === "string" ? props.value : ""}
				onChange={(value) => props.onChange(value)}
				placeholder={field.placeholder ?? "type here…"}
				focused={props.focused}
				width={props.width}
				visibleRows={3}
			/>
		);
	}
	const shown = Array.isArray(props.value)
		? (props.value as string[]).join(", ")
		: typeof props.value === "string"
			? props.value
			: props.value !== undefined && props.value !== null
				? String(props.value)
				: "";
	const placeholder =
		field.kind === "file" || field.kind === "files" ? "<path>" : (field.placeholder ?? "");
	return (
		<TextInput
			value={shown}
			onChange={(value) => props.onChange(value)}
			placeholder={placeholder}
			focused={props.focused}
			width={props.width}
		/>
	);
}

function initialValues(fields: RunnerField[]): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	for (const field of fields) {
		if (field.default !== undefined) values[field.name] = field.default;
		else if (field.kind === "boolean") values[field.name] = false;
		else values[field.name] = "";
	}
	return values;
}
