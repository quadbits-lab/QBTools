/**
 * Shared TUI building blocks: focus tracker (so global hotkeys don't fire
 * while typing), schema-driven form fields, progress bar and result output
 * panel. All components are OpenTUI React intrinsics.
 */

import type { SelectOption } from "@opentui/core";
import { AVAILABILITY_HINTS, AVAILABILITY_LABELS, availabilityFor } from "../runner/map";
import type { RunnerField, RunnerOutput } from "../runner/types";
import type { AccentId } from "./theme";
import { accents, categoryAccent, theme } from "./theme";

type Tag = "none" | "input" | "select";

/** Module-level input-focus tracker: App reads it to gate global hotkeys. */
export const inputFocus = { tag: "none" as Tag };

export function selectOptions(entries: { name: string; value: string }[]): SelectOption[] {
	return entries.map((entry) => ({ name: entry.name, description: "", value: entry.value }));
}

/* ---------- header ---------- */

export function Header(props: { userChip?: string; updateHint?: string }) {
	return (
		<box
			height={1}
			flexDirection="row"
			paddingLeft={1}
			paddingRight={1}
			justifyContent="space-between"
		>
			<text>
				<span fg={theme.fg}>
					<strong>QBTools</strong>
				</span>
				<span fg={theme.textSubtle}> · toolkit</span>
			</text>
			<box flexDirection="row" gap={2}>
				{props.updateHint ? <text fg={accents.amber}>{props.updateHint}</text> : null}
				{props.userChip ? (
					<text>
						<span fg={accents.emerald}>●</span>
						<span fg={theme.textDim}> {props.userChip}</span>
					</text>
				) : (
					<text fg={theme.textSubtle}>○ signed out</text>
				)}
			</box>
		</box>
	);
}

/* ---------- footer ---------- */

export function Footer(props: { hint: string }) {
	return (
		<box height={1} paddingLeft={1}>
			<text fg={theme.textSubtle}>{props.hint}</text>
		</box>
	);
}

/* ---------- sidebar ---------- */

export interface SidebarItem {
	name: string;
	value: string;
	accent?: AccentId;
}

export function Sidebar(props: {
	items: SidebarItem[];
	selectedIndex: number;
	onSelect(value: string): void;
	onChange(index: number): void;
	focused: boolean;
}) {
	return (
		<box width={24} borderStyle="single" borderColor={theme.border} title="Navigate">
			<select
				focused={props.focused}
				options={selectOptions(props.items)}
				selectedIndex={props.selectedIndex}
				onSelect={(_index: number, option: SelectOption | null) =>
					props.onSelect(String(option?.value ?? ""))
				}
				onChange={(index: number) => props.onChange(index)}
				selectedBackgroundColor={theme.muted}
				selectedTextColor={theme.fg}
				height="100%"
			/>
		</box>
	);
}

/* ---------- form fields ---------- */

export function FieldLabel(props: { field: RunnerField }) {
	return (
		<text>
			<span fg={theme.textDim}>
				{props.field.label}
				{props.field.required ? <span fg={accents.rose}>*</span> : null}
			</span>
			{props.field.help ? <span fg={theme.textSubtle}> — {props.field.help}</span> : null}
		</text>
	);
}

export function FieldInput(props: {
	field: RunnerField;
	value: unknown;
	focused: boolean;
	onChange(value: unknown): void;
	width: number;
}) {
	const field = props.field;
	const focusProps = { focused: props.focused };

	if (field.kind === "boolean") {
		const on = props.value === true || props.value === "true";
		return (
			<select
				{...focusProps}
				height={2}
				showScrollIndicator={false}
				options={selectOptions([
					{ name: "On", value: "true" },
					{ name: "Off", value: "false" },
				])}
				selectedIndex={on ? 0 : 1}
				onSelect={(index: number) => props.onChange(index === 0)}
				onChange={(_index: number, _option: SelectOption | null) => {}}
				selectedBackgroundColor={theme.muted}
				selectedTextColor={theme.fg}
			/>
		);
	}
	if (field.kind === "select") {
		return (
			<select
				{...focusProps}
				options={selectOptions(
					(field.options ?? []).map((option) => ({ name: option.label, value: option.value })),
				)}
				height={3}
				showScrollIndicator={false}
				selectedIndex={Math.max(
					0,
					(field.options ?? []).findIndex((option) => option.value === props.value),
				)}
				onSelect={(_index: number, option: SelectOption | null) => props.onChange(option?.value)}
				onChange={(_index: number, option: SelectOption | null) => props.onChange(option?.value)}
				selectedBackgroundColor={theme.muted}
				selectedTextColor={theme.fg}
			/>
		);
	}
	if (field.kind === "textarea") {
		const initial = typeof props.value === "string" ? props.value : "";
		return (
			<textarea
				{...focusProps}
				initialValue={initial}
				placeholder={field.placeholder ?? "type here…"}
				width={props.width}
				height={5}
				wrapMode="word"
				textColor={theme.fg}
				backgroundColor={theme.card}
				focusedBackgroundColor={theme.secondary}
				placeholderColor={theme.textSubtle}
				cursorColor={theme.fg}
			/>
		);
	}
	// text / number / file(s) all use single-line input; numbers validate on run
	const shown = Array.isArray(props.value)
		? (props.value as string[]).join(", ")
		: typeof props.value === "string"
			? props.value
			: props.value !== undefined && props.value !== null
				? String(props.value)
				: "";
	const placeholder =
		field.kind === "file" || field.kind === "files" ? "/path/to/file" : (field.placeholder ?? "");
	return (
		<input
			{...focusProps}
			value={shown}
			onChange={props.onChange}
			placeholder={placeholder}
			width={props.width}
			textColor={theme.fg}
			backgroundColor={theme.card}
			focusedBackgroundColor={theme.secondary}
			placeholderColor={theme.textSubtle}
			cursorColor={theme.fg}
		/>
	);
}

/* ---------- progress ---------- */

export function ProgressBar(props: { label: string; fraction: number | null; width: number }) {
	const fraction = props.fraction;
	const filled =
		fraction === null
			? 0
			: Math.max(0, Math.min(props.width - 2, Math.round(fraction * (props.width - 2))));
	const bar = `${"█".repeat(filled)}${"─".repeat(Math.max(0, props.width - 2 - filled))}`;
	const percent = fraction === null ? "" : ` ${Math.round(fraction * 100)}%`;
	return (
		<text>
			<span fg={accents.indigo}>{bar}</span>
			<span fg={theme.textDim}>{percent} </span>
			<span fg={theme.textSubtle}>{props.label}</span>
		</text>
	);
}

/* ---------- result panel ---------- */

export function OutputPanel(props: { outputs: RunnerOutput[] }) {
	return (
		<box flexDirection="column" gap={1}>
			{props.outputs.map((output, index) => (
				<OutputBlock key={index} output={output} />
			))}
		</box>
	);
}

function OutputBlock(props: { output: RunnerOutput }) {
	const output = props.output;
	if (output.type === "table") {
		return <text fg={theme.textDim}>{renderAsciiTable(output.columns, output.rows)}</text>;
	}
	if (output.type === "code") {
		return (
			<box
				borderStyle="rounded"
				borderColor={theme.border}
				backgroundColor={theme.card}
				padding={1}
			>
				<text fg={theme.fg}>{output.text}</text>
			</box>
		);
	}
	if (output.type === "image") {
		return (
			<text fg={theme.textDim}>
				{`[${output.mimeType} preview · ${output.bytes.byteLength} bytes → ${output.suggestedName}]`}
			</text>
		);
	}
	if (output.type === "file") {
		return (
			<text fg={theme.textDim}>
				{`[${output.mimeType} · ${output.bytes.byteLength} bytes → ${output.suggestedName}]`}
			</text>
		);
	}
	return <text fg={theme.fg}>{output.text}</text>;
}

export function renderAsciiTable(columns: string[], rows: string[][]): string {
	const widths = columns.map((column, index) =>
		Math.max(column.length, ...rows.map((row) => (row[index] ?? "").length)),
	);
	const line = (cells: string[]) =>
		cells.map((cell, index) => (cell ?? "").padEnd(widths[index] ?? 0)).join("  ");
	return [
		line(columns),
		widths.map((width) => "─".repeat(width)).join("  "),
		...rows.map(line),
	].join("\n");
}

/* ---------- availability badge ---------- */

export function AvailabilityBadge(props: { slug: string }) {
	const availability = availabilityFor(props.slug);
	const accentColor: Record<string, string> = {
		local: accents.emerald,
		sharp: accents.amber,
		ffmpeg: accents.amber,
		server: accents.indigo,
		web: accents.rose,
	};
	return (
		<text>
			<span fg={accentColor[availability] ?? theme.textSubtle}>
				{AVAILABILITY_LABELS[availability]}
			</span>
			<span fg={theme.textSubtle}> — {AVAILABILITY_HINTS[availability]}</span>
		</text>
	);
}

export { accents, categoryAccent, theme };
