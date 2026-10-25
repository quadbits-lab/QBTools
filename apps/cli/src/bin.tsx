#!/usr/bin/env bun
/**
 * qbtools entry point.
 * - No arguments + TTY  → interactive TUI (Ink, loaded lazily).
 * - `ui` / `tui` / `ink` → the same interactive TUI.
 * - Any subcommand      → headless mode (no Ink imports).
 * - Piped stdin/stdout  → headless mode automatically.
 */

const [, , ...argv] = process.argv;

const UI_COMMANDS = new Set(["ui", "tui", "ink"]);

function isInteractive(): boolean {
	return Boolean(process.stdout.isTTY && process.stdin.isTTY);
}

async function main(): Promise<void> {
	const [first] = argv;
	const wantsTui = !first || UI_COMMANDS.has(first);
	if (wantsTui && isInteractive()) {
		const { runTui } = await import("./tui/index.tsx");
		await runTui();
		// Ink owns the terminal until it unmounts; the UI already ended.
		process.exit(0);
	}
	if (first && UI_COMMANDS.has(first)) {
		process.stderr.write(
			"qbtools: the interactive UI needs a TTY. Use `qbtools help` for the headless commands.\n",
		);
		process.exit(1);
	}
	const { runHeadless } = await import("./headless/run.ts");
	const code = await runHeadless(wantsTui ? [] : argv);
	process.exit(code);
}

main().catch((error) => {
	process.stderr.write(`qbtools: fatal: ${error instanceof Error ? error.stack : String(error)}\n`);
	process.exit(1);
});
