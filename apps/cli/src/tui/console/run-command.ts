/**
 * Direct command execution from the console prompt.
 *
 * `qbtools run <slug> [flags]` semantics, but driven from the prompt: the
 * flag → field mapping is shared with the headless command so both surfaces
 * behave identically.
 */

import { parseArgs } from "../../headless/args";
import { valuesFromArgs } from "../../headless/cmd/run";
import { CancelledError, runTool } from "../../runner/execute";
import { readInputFiles, writeOutput } from "../../runner/files";
import { type RunnerOutput, UnavailableError } from "../../runner/types";
import { activeProfile, loadConfig, recordRecent } from "../../services/config";

export interface DirectRunResult {
	summary: string;
	outputs: RunnerOutput[];
	saved: string[];
}

export async function runDirectCommand(
	slug: string,
	argv: string[],
	options: { onProgress?(label: string, fraction: number | null): void; signal?: AbortSignal } = {},
): Promise<DirectRunResult> {
	const config = await loadConfig();
	const profile = activeProfile(config);
	const args = parseArgs(argv);
	const { RUNNERS } = await import("../../runner/map");
	const runner = RUNNERS.get(slug);
	const values = runner ? await valuesFromArgs(runner, args, "") : {};
	const result = await runTool(slug, {
		values,
		outDir: profile.outputDir,
		signal: options.signal,
		onProgress: options.onProgress
			? (entry) => options.onProgress?.(entry.label, entry.fraction)
			: undefined,
	});
	await recordRecent(slug);
	const saved: string[] = [];
	for (const output of result.outputs) {
		if (output.type === "image" || output.type === "file") {
			const wrote = await writeOutput(
				{ outDir: profile.outputDir, suggestedName: output.suggestedName },
				output.bytes,
			);
			saved.push(wrote.path);
		}
	}
	return { summary: result.summary, outputs: result.outputs, saved };
}

export { CancelledError, readInputFiles, UnavailableError };
