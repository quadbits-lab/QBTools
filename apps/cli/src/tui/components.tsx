/**
 * Shared TUI building blocks: focus tracker (so global hotkeys don't fire
 * while typing), schema-driven form fields, progress bar and result output
 * panel. All components are OpenTUI React intrinsics.
 */

import { createContext, useContext } from "react";
import type { RunnerField, RunnerOutput, RunnerValues } from "../runner/types";
import { categoryAccent, theme } from "./theme";
import { accents } from "./theme";
import { availabilityFor, AVAILABILITY_HINTS, AVAILABILITY_LABELS } from "../runner/map";
import type { AccentId } from "./theme";

type Tag = "none" | "input" | "select";

export interface FocusTracker {
	readonly tag: Tag;
	setTag(tag: Tag): void;
}

export const FocusContext = createContext<FocusTracker>({
	tag: "none",
	setTag: () => {},
});

export function useFocusTracker(): FocusTracker {
	return useContext(FocusContext);
}

/* ---------- header ---------- */

export function Header(props: { userChip?: string; updateHint?: string }) {
	return (
		<box height={1} flexDirection="row" paddingLeft={1} paddingRight={1} justifyContent="space-between">
			<text>
				<span fg={theme.fg}><strong>QBTools</strong></span>
				<span fg={theme.textSubtle}> · toolkit</span>
			</text>
			<box flexDirection="row" gap={2}>
				{props.updateHint ? <text fg={accents.amber}>{props.updateHint}</text> : null}
				{props.userChip ? (
					<text fg={theme.textDim}>
						<span fg={accents.emerald}>●</span>
						<span> {props.userChip}</span>
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
	onSelect(index: number, item: SidebarItem): void;
	onChange(index: number, item: SidebarItem): void;
	focused: boolean;
}): React.ReactElement {
	return (
		<box width={24} border borderStyle="single" borderColor={theme.border} title="Navigate">
			<select
				focused={props.focused}
				options={props.items.map((item) => ({
					name: item.name,
					description: undefined,
					value: item.value,
				}))}
				selectedIndex={props.selectedIndex}
				onSelect={(index: number, option: { value?: unknown }) =>
					props.onSelect(index, props.items[index] ?? { name: "", value: String(option.value) })}
				onChange={(index: number, option: { value?: unknown }) =>
					props.onChange(index, props.items[index] ?? { name: "", value: String(option.value) })}
				selectedBackgroundColor={theme.muted}
				selectedTextColor={theme.fg}
				fg={theme.textDim}
				height="100%"
			/>
		</box>
	);
}

/* ---------- form fields ---------- */

export function FieldLabel(props: { field: RunnerField }) {
	const required = props.field.required ? <span fg={accents.rose}>*</span> : null;
	return (
		<text fg={theme.textDim}>
			{props.field.label}
			{required}
			{props.field.help ? <span fg={theme.textSubtle}> — {props.field.help}</span> : null}
		</text>
	);
}

export function FieldInput(props: {
	field: RunnerField;
	value: unknown;
	focused: boolean;
	onChange(value: unknown): void;
	onEnter?(): void;
	width: number;
}): React.ReactElement {
	const tracker = useFocusTracker();
	const field = props.field;
	const focusProps = {
		focused: props.focused,
		onFocus: () => tracker.setTag(field.kind === "select" || field.kind === "boolean" ? "select" : "input"),
		onBlur: () => tracker.setTag("none"),
	};

	if (field.kind === "boolean") {
		const on = props.value === true || props.value === "true";
		return (
			<tab-select
				{...focusProps}
				tabWidth={14}
				options={[
					{ name: on ? "● On" : "  On", value: "true" },
					{ name: on ? "  Off" : "● Off", value: "false" },
				]}
				selectedIndex={on ? 0 : 1}
				onSelect={(index: number) => props.onChange(index === 0)}
				onChange={(index: number) => props.onChange(index === 0)}
			/>
		);
	}
	if (field.kind === "select") {
		return (
			<select
				{...focusProps}
				options={(field.options ?? []).map((option) => ({
					name: option.label,
					description: undefined,
					value: option.value,
				}))}
				height={3}
				showScrollIndicator={false}
				selectedIndex={Math.max(
					0,
					(field.options ?? []).findIndex((option) => option.value === props.value),
				)}
				onSelect={(index: number, option: { value?: unknown }) => props.onChange(option.value)}
				onChange={(index: number, option: { value?: unknown }) => props.onChange(option.value)}
				selectedBackgroundColor={theme.muted}
				selectedTextColor={theme.fg}
			/>
		);
	}
	if (field.kind === "textarea") {
		return (
			<textarea
				{...focusProps}
				initialValue={typeof props.value === "string" ? props.value : ""}
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
		fraction === null ? 0 : Math.max(0, Math.min(props.width - 2, Math.round(fraction * (props.width - 2))));
	const bar = `${"█".repeat(filled)}${"─".repeat(Math.max(0, props.width - 2 - filled))}`;
	const percent = fraction === null ? "" : ` ${Math.round(fraction * 100)}%`;
	return (
		<text fg={theme.textDim}>
			<span fg={accents.indigo}>{bar}</span>
			<span>{percent} </span>
			<span fg={theme.textSubtle}>{props.label}</span>
		</text>
	);
}

/* ---------- result panel ---------- */

export function OutputPanel(props: { outputs: RunnerOutput[] }): React.ReactElement {
	return (
		<box flexDirection="column" gap={1}>
			{props.outputs.map((output, index) => (
				<OutputBlock key={index} output={output} />
			))}
		</box>
	);
}

function OutputBlock(props: { output: RunnerOutput }): React.ReactElement {
	const output = props.output;
	if (output.type === "table") {
		return <text fg={theme.textDim}>{renderAsciiTable(output.columns, output.rows)}</text>;
	}
	if (output.type === "code") {
		return (
			<box border borderStyle="rounded" borderColor={theme.border} backgroundColor={theme.card} padding={1}>
				<code
					content={output.text}
					syntaxStyle="github-dark"
					width="100%"
					height={Math.min(16, output.text.split("\n").length)}
				/>
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

function renderAsciiTable(columns: string[], rows: string[][]): string {
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

export function AvailabilityBadge(props: { slug: string }): React.ReactElement {
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

export { categoryAccent, accents, theme };