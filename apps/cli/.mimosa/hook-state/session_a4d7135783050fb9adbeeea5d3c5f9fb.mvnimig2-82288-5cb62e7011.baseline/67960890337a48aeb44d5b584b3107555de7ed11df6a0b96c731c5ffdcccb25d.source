#!/usr/bin/env bun
/**
 * qbtools entry point.
 * - No arguments + TTY  → interactive TUI (OpenTUI, loaded lazily).
 * - Any subcommand      → headless mode (no OpenTUI imports).
 * - Piped stdin/stdout  → headless mode automatically.
 */

const [, , ...argv] = process.argv;

function isInteractive(): boolean {
	return Boolean(process.stdout.isTTY && process.stdin.isTTY);
}

async function main(): Promise<void> {
	const [first] = argv;
	const wantsTui = !first || first === "ui" || first === "tui";
	if (wantsTui && isInteractive()) {
		const { runTui } = await import("./tui/index.tsx");
		await runTui();
		// runTui's renderer owns the exit; returning here would end with code 0
		// while the renderer loop is still active, so block until destroyed.
		await new Promise<never>(() => {});
	}
	const { runHeadless } = await import("./headless/run.ts");
	const code = await runHeadless(wantsTui ? [] : argv);
	process.exit(code);
}

main().catch((error) => {
	process.stderr.write(`qbtools: fatal: ${error instanceof Error ? error.stack : String(error)}\n`);
	process.exit(1);
});
