/**
 * Tool runner contracts shared by the TUI and headless modes.
 * A runner mirrors one registry ToolDef: schema-driven fields in,
 * structured outputs out. All heavy work happens in @qbtools/engines.
 */

import type { ProcessingOptions, ProcessingProgress } from "@qbtools/engines/processing";

export type { ProcessingOptions, ProcessingProgress };

/** How a tool executes in the CLI. Mirrors the plan's coverage tiers. */
export type Availability =
	| "local" // engines run headless today
	| "sharp" // needs the optional sharp dependency
	| "ffmpeg" // needs a native ffmpeg binary
	| "server" // requires an authenticated QBTools server
	| "web"; // browser-only; offered as a deep link

export type FieldKind = "text" | "textarea" | "number" | "select" | "boolean" | "file" | "files";

export interface RunnerField {
	name: string;
	label: string;
	kind: FieldKind;
	required?: boolean;
	/** Default value (string/number/boolean). */
	default?: string | number | boolean;
	placeholder?: string;
	help?: string;
	/** select options */
	options?: { label: string; value: string }[];
	/** file kinds: accepted extensions, e.g. ".pdf" */
	accept?: string[];
	/** number clamps */
	min?: number;
	max?: number;
}

/**
 * Field values as produced by headless flags or TUI forms.
 * File fields resolve to Bun File objects before the runner runs.
 */
export type RunnerValues = Record<string, unknown>;

export interface RunnerContext extends ProcessingOptions {
	values: RunnerValues;
	/** Directory that file outputs default to. */
	outDir: string;
	/** Explicit --out path when given. */
	outPath?: string;
}

export type RunnerOutput =
	| { type: "text"; text: string }
	| { type: "markdown"; text: string }
	| { type: "code"; language?: string; text: string }
	| { type: "table"; columns: string[]; rows: string[][] }
	| { type: "image"; bytes: Uint8Array; mimeType: string; suggestedName: string }
	| { type: "file"; bytes: Uint8Array; suggestedName: string; mimeType: string };

export interface RunnerResult {
	summary: string;
	outputs: RunnerOutput[];
	/** Structured payload for `--json`. */
	data?: object;
}

/** Thrown when a tool's optional dependency/server is missing. Exit code 2. */
export class UnavailableError extends Error {
	constructor(
		public readonly availability: Availability,
		message: string,
	) {
		super(message);
		this.name = "UnavailableError";
	}
}

export interface ToolRunner {
	slug: string;
	fields: RunnerField[];
	/** Field name that `--stdin` feeds (default: "text"). */
	stdinField?: string;
	availability: Availability;
	run(ctx: RunnerContext): Promise<RunnerResult>;
}

/* ---- value accessors used by runner implementations ---- */

export function str(values: RunnerValues, name: string, fallback = ""): string {
	const value = values[name];
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	return fallback;
}

export function num(values: RunnerValues, name: string, fallback: number): number {
	const value = values[name];
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return fallback;
}

export function bool(values: RunnerValues, name: string, fallback = false): boolean {
	const value = values[name];
	if (typeof value === "boolean") return value;
	if (typeof value === "string") return value === "true" || value === "1" || value === "yes";
	return fallback;
}

export function strList(values: RunnerValues, name: string): string[] {
	const value = values[name];
	if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
	if (typeof value === "string" && value) return [value];
	return [];
}

export function files(values: RunnerValues, name: string): File[] {
	const value = values[name];
	if (!Array.isArray(value)) {
		return value instanceof File ? [value] : [];
	}
	// FileRef entries carry the resolved File plus its source path.
	return value.flatMap((entry) => {
		if (entry && typeof entry === "object" && "file" in entry) {
			const file = (entry as { file?: unknown }).file;
			return file instanceof File ? [file] : [];
		}
		return entry instanceof File ? [entry] : [];
	});
}

/** FileRef: a resolved input File plus the path it came from. */
export interface FileRef {
	file: File;
	path: string;
}

export function isFileRef(value: unknown): value is FileRef {
	return (
		value !== null &&
		typeof value === "object" &&
		"file" in value &&
		(value as { file?: unknown }).file instanceof File &&
		"path" in value &&
		typeof (value as { path?: unknown }).path === "string"
	);
}

/** Original filesystem paths behind a file field (media subprocess inputs). */
export function filePaths(values: RunnerValues, name: string): string[] {
	const value = values[name];
	if (!Array.isArray(value)) return isFileRef(value) ? [value.path] : [];
	return value.filter(isFileRef).map((entry) => entry.path);
}

export function requireString(values: RunnerValues, name: string, label: string): string {
	const value = str(values, name).trim();
	if (!value) throw new Error(`Missing --${name}: ${label} is required.`);
	return value;
}
