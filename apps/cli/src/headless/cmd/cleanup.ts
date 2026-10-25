/**
 * `qbtools cleanup scan|clean|analyze` — system cleanup for the running OS.
 * Scan is read-only. Clean is dry-run unless --yes is passed; native
 * commands (brew cleanup etc.) additionally require --commands.
 */

import { formatBytes } from "../../runner/files";
import { cleanScan, type ScanReport, scanTargets } from "../../services/cleanup/clean";
import { getBool, getString } from "../args";
import { type Command, EXIT_ERROR, EXIT_OK } from "../command";

function formatBytesLocal(bytes: number): string {
	return formatBytes(bytes);
}

function renderReport(report: ScanReport): string[] {
	const lines: string[] = [];
	lines.push(`System cleanup scan — ${report.os}`);
	lines.push("");
	for (const row of report.categories) {
		const size =
			row.target.kind === "command"
				? "native command"
				: `${row.entries.length} files · ${formatBytesLocal(row.totalBytes)}`;
		lines.push(`  ${row.target.label.padEnd(28)} ${size}`);
		if (row.target.kind === "command") {
			lines.push(`    ${row.target.description}`);
		}
	}
	lines.push("");
	lines.push(`Total reclaimable: ${formatBytesLocal(report.totalBytes)}`);
	return lines;
}

export const cleanupCommand: Command = {
	name: "cleanup",
	summary: "Scan and clean system caches (macOS / Linux / Windows)",
	flags: [
		{ name: "yes", description: "Actually delete (default is a dry-run report)" },
		{ name: "commands", description: "Also run native commands (brew cleanup, apt-get clean…)" },
		{ name: "only", arg: "value", description: "Restrict to one target id (repeatable)" },
		{ name: "json", description: "Print the scan report as JSON" },
	],
	async run({ args, io }) {
		const mode = args.positional[0] ?? "scan";
		if (!["scan", "clean", "analyze"].includes(mode)) {
			io.err("Usage: qbtools cleanup <scan|clean|analyze>");
			return EXIT_ERROR;
		}
		const only = args.flags.has("only") ? args.flags.get("only") : undefined;
		const onlyList = Array.isArray(only)
			? (only as string[])
			: typeof only === "string"
				? [only]
				: undefined;

		if (mode === "analyze") {
			const report = await scanTargets({ only: onlyList });
			for (const row of report.categories) {
				if (row.target.kind === "command") continue;
				const largest = [...row.entries].sort((a, b) => b.size - a.size).slice(0, 5);
				io.out(`${row.target.label} — ${formatBytesLocal(row.totalBytes)}`);
				for (const entry of largest) {
					io.out(`    ${formatBytesLocal(entry.size).padStart(10)}  ${entry.path}`);
				}
			}
			io.out("");
			io.out(`Total: ${formatBytesLocal(report.totalBytes)}`);
			return EXIT_OK;
		}

		const report = await scanTargets({ only: onlyList });
		if (getBool(args, "json")) {
			io.out(
				JSON.stringify(
					{
						os: report.os,
						totalBytes: report.totalBytes,
						categories: report.categories.map((row) => ({
							id: row.target.id,
							label: row.target.label,
							kind: row.target.kind,
							files: row.entries.length,
							bytes: row.totalBytes,
						})),
					},
					null,
					"\t",
				),
			);
		} else {
			io.out(renderReport(report).join("\n"));
		}

		if (mode === "scan") {
			io.out("");
			io.out("Dry run by default. Delete with: qbtools cleanup clean --yes");
			return EXIT_OK;
		}

		if (!getBool(args, "yes")) {
			io.err("");
			io.err("Refusing to delete without --yes. Review the report above first.");
			return EXIT_ERROR;
		}
		const runCommands = getBool(args, "commands");
		const result = await cleanScan(report, {
			runCommands,
			onProgress: (entry) => {
				if (process.stderr.isTTY) {
					const percent = entry.fraction === null ? "" : ` ${Math.round(entry.fraction * 100)}%`;
					process.stderr.write(`\r${entry.label}${percent}\x1b[K`);
				}
			},
		});
		if (process.stderr.isTTY) process.stderr.write("\r\x1b[K");
		io.out("");
		io.out(`Deleted ${result.deletedFiles} files · freed ${formatBytesLocal(result.freedBytes)}`);
		for (const command of result.commandsRun) {
			io.out(`${command.label}: ${command.ok ? "ok" : "skipped"} — ${command.detail}`);
		}
		io.out(`Audit log: ${result.auditPath}`);
		return EXIT_OK;
	},
};
