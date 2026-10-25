/**
 * `qbtools run <slug> [flags]` — headless flag bridge into runner core with
 * stdin/stdout piping. Rendering helpers live here so the TUI reuses them.
 */

import { tools } from "@qbtools/registry";
import { CancelledError, runTool } from "../../runner/execute";
import { readInputFiles } from "../../runner/files";
import {
	type RunnerOutput,
	type RunnerResult,
	type ToolRunner,
	UnavailableError,
} from "../../runner/types";
import { activeProfile, loadConfig, recordRecent } from "../../services/config";
import { nearestNames } from "../../services/file-suggest";
import { getBool, getString, type ParsedArgs } from "../args";
import { type Command, type CommandIO, EXIT_ERROR, EXIT_OK, EXIT_UNAVAILABLE } from "../command";

async function readStdin(): Promise<string> {
	if (process.stdin.isTTY) return "";
	const chunks: Uint8Array[] = [];
	for await (const chunk of process.stdin) chunks.push(chunk as Uint8Array);
	return new TextDecoder().decode(concat(chunks));
}

function concat(chunks: Uint8Array[]): Uint8Array {
	const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
	const out = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return out;
}

/** Build runner values from parsed flags: scalars pass through, --in resolves files. */
export async function valuesFromArgs(
	runner: ToolRunner,
	args: ParsedArgs,
	stdin: string,
): Promise<Record<string, unknown>> {
	const values: Record<string, unknown> = {};
	for (const field of runner.fields) {
		if (field.kind === "file" || field.kind === "files") {
			if (field.name === "in") {
				// --in may be repeated; also accept positional leftovers after the slug
				const paths = [...args.positional.slice(1), ...flattenFlag(args, "in")];
				if (paths.length) values.in = await readInputFiles(paths);
			}
			continue;
		}
		const raw = getString(args, field.name);
		if (raw !== undefined) {
			values[field.name] = field.kind === "boolean" ? getBool(args, field.name) : raw;
			continue;
		}
		if (field.kind === "boolean") {
			// Absent flag keeps the schema default instead of forcing false.
			values[field.name] = args.flags.has(field.name)
				? getBool(args, field.name)
				: (field.default ?? false);
			continue;
		}
		if (field.default !== undefined) values[field.name] = field.default;
	}
	if (stdin && runner.stdinField) values[runner.stdinField] = stdin;
	return values;
}

function flattenFlag(args: ParsedArgs, name: string): string[] {
	const value = args.flags.get(name);
	if (value === undefined) return [];
	if (typeof value === "boolean") return [];
	if (Array.isArray(value)) return value;
	return [value];
}

export function formatTable(columns: string[], rows: string[][]): string {
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

export function renderOutput(output: RunnerOutput): string {
	switch (output.type) {
		case "text":
		case "markdown":
		case "code":
			return output.text;
		case "table":
			return formatTable(output.columns, output.rows);
		case "image":
			return `[image ${output.mimeType} · ${output.bytes.byteLength} bytes → ${output.suggestedName}]`;
		case "file":
			return `[file ${output.mimeType} · ${output.bytes.byteLength} bytes → ${output.suggestedName}]`;
	}
}

/** Bytes/text that `--stdout` emits for chaining. */
export function primaryStdoutPayload(
	result: RunnerResult,
): { bytes?: Uint8Array; text?: string } | null {
	for (const output of result.outputs) {
		if (output.type === "image" || output.type === "file") return { bytes: output.bytes };
	}
	for (const output of result.outputs) {
		if (output.type === "text" || output.type === "code" || output.type === "markdown") {
			return { text: output.text };
		}
	}
	return null;
}

export async function executeRunner(
	slug: string,
	args: ParsedArgs,
	options: { stdin?: string; io: CommandIO },
): Promise<{ code: number; result?: RunnerResult }> {
	const { io } = options;
	const config = await loadConfig();
	const profile = activeProfile(config);
	const outDir = getString(args, "outdir") ?? profile.outputDir;
	const outPath = getString(args, "out");
	const reportProgress = (entry: { label: string; fraction: number | null }) => {
		if (!process.stderr.isTTY) return;
		const percent = entry.fraction === null ? "" : ` ${Math.round(entry.fraction * 100)}%`;
		process.stderr.write(`\r${entry.label}${percent}\x1b[K`);
	};

	try {
		const { runnerFor } = await import("../../runner/map");
		const runnerDef = runnerFor(slug);
		const values = runnerDef ? await valuesFromArgs(runnerDef, args, options.stdin ?? "") : {};
		const result = await runTool(slug, {
			values,
			outDir,
			outPath,
			onProgress: reportProgress,
		});
		await recordRecent(slug);
		return { code: EXIT_OK, result };
	} catch (error) {
		if (error instanceof CancelledError) {
			io.err("\nCancelled.");
			return { code: EXIT_ERROR };
		}
		if (error instanceof UnavailableError) {
			io.err(error.message);
			return { code: EXIT_UNAVAILABLE };
		}
		const message = error instanceof Error ? error.message : String(error);
		io.err(withToolSuggestions(slug, message));
		return { code: EXIT_ERROR };
	} finally {
		if (process.stderr.isTTY) process.stderr.write("\r\x1b[K");
	}
}

/** Append "did you mean" hints when a slug looks like a typo of a real one. */
function withToolSuggestions(slug: string, message: string): string {
	if (!message.startsWith("Unknown tool:")) return `${slug} failed: ${message}`;
	const suggestions = nearestNames(slug, TOOL_SLUGS);
	return suggestions.length
		? `Unknown tool: ${slug} — did you mean: ${suggestions.join(", ")}?`
		: `${message} Run \`qbtools list\` to see every tool.`;
}

const TOOL_SLUGS = tools.map((tool) => tool.slug);
export const runCommand: Command = {
	name: "run",
	summary: "Run a tool headless: qbtools run <slug> [flags]",
	flags: [
		{ name: "in", arg: "value", description: "Input file (repeatable for multi-file tools)" },
		{ name: "out", arg: "value", description: "Explicit output path (default: output dir)" },
		{ name: "outdir", arg: "value", description: "Output directory override" },
		{ name: "stdin", description: "Read primary text input from stdin" },
		{ name: "stdout", description: "Write the primary result to stdout for piping" },
		{ name: "json", description: "Print the structured result as JSON" },
	],
	async run({ args, io }) {
		const slug = args.positional[0];
		if (!slug) {
			io.err("Usage: qbtools run <slug> [flags] — see `qbtools list` for slugs.");
			return EXIT_ERROR;
		}
		const stdin = getBool(args, "stdin") ? await readStdin() : "";
		const { code, result } = await executeRunner(slug, args, { stdin, io });
		if (!result) return code;

		if (getBool(args, "stdout")) {
			const payload = primaryStdoutPayload(result);
			if (payload?.bytes) {
				await Bun.write(Bun.stdout, payload.bytes);
			} else if (payload?.text !== undefined) {
				await Bun.write(
					Bun.stdout,
					payload.text.endsWith("\n") ? payload.text : `${payload.text}\n`,
				);
			} else {
				io.err("This tool has no pipable primary output; printing the summary instead:");
				io.out(result.summary);
			}
			return code;
		}

		if (getBool(args, "json")) {
			io.out(
				JSON.stringify({ slug, summary: result.summary, data: result.data ?? {} }, null, "\t"),
			);
			return code;
		}

		io.out(result.summary);
		for (const output of result.outputs) {
			const rendered = renderOutput(output);
			if (rendered.trim()) io.out(rendered);
		}
		return code;
	},
};
