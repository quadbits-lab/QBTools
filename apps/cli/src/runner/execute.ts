/**
 * Direct tool execution shared by headless and TUI surfaces: runs a runner
 * with pre-built values, maps cancellation and unavailability to typed errors.
 */

import { UnavailableError, type RunnerContext, type RunnerResult, type ToolRunner } from "./types";
import { runnerFor, WEB_ONLY_TOOLS } from "./map";

export class CancelledError extends Error {
	constructor() {
		super("Cancelled");
		this.name = "CancelledError";
	}
}

export interface RunOptions {
	values: Record<string, unknown>;
	outDir: string;
	outPath?: string;
	signal?: AbortSignal;
	onProgress?: (entry: { label: string; fraction: number | null }) => void;
}

export async function runTool(slug: string, options: RunOptions): Promise<RunnerResult> {
	const runner: ToolRunner | undefined = runnerFor(slug);
	if (!runner) {
		if (WEB_ONLY_TOOLS.has(slug)) {
			throw new UnavailableError("web", `"${slug}" runs in the browser. Open it with: qbtools open ${slug}`);
		}
		throw new Error(`Unknown tool: ${slug}. Run \`qbtools list\` to see every tool.`);
	}
	const controller = new AbortController();
	// SIGINT during a run cancels the job instead of killing the CLI; the
	// listener is owned per-run and removed in finally.
	const onSigint = () => controller.abort();
	process.on("SIGINT", onSigint);
	try {
		const context: RunnerContext = {
			values: options.values,
			outDir: options.outDir,
			outPath: options.outPath,
			signal: options.signal ?? controller.signal,
			onProgress: options.onProgress,
		};
		return await runner.run(context);
	} catch (error) {
		if (error instanceof UnavailableError) throw error;
		const name = (error as Error | undefined)?.name;
		const message = error instanceof Error ? error.message : String(error);
		if (name === "AbortError" || message === "Cancelled") throw new CancelledError();
		throw error;
	} finally {
		process.off("SIGINT", onSigint);
	}
}