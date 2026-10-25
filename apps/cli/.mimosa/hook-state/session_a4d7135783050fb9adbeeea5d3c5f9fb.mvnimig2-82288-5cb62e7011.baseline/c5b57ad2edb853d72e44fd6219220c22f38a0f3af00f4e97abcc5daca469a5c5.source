/**
 * Cleanup scan + clean. Scan never deletes; clean deletes only entries that
 * pass the guard again at delete time, writes an audit log, and defaults to
 * dry-run in every surface (headless requires --yes).
 */

import { spawn as spawnProcess } from "node:child_process";
import { readdir, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ProcessingProgress } from "../../runner/types";
import { guardCandidate } from "./paths";
import { type CleanupOs, type CleanupTarget, currentOs, targetsFor } from "./targets";

export interface ScannedEntry {
	targetId: string;
	targetLabel: string;
	path: string;
	size: number;
}

export interface ScanReport {
	os: CleanupOs;
	categories: Array<{
		target: CleanupTarget;
		entries: ScannedEntry[];
		totalBytes: number;
		skipped: number;
	}>;
	totalBytes: number;
	scannedAt: string;
}

export type { CleanupOs, CleanupTarget };
export { currentOs, targetsFor };

function baseOf(target: CleanupTarget): string {
	if (target.kind === "dirs") return target.paths[0] ?? homedir();
	if (target.kind === "files") return target.roots[0] ?? homedir();
	return homedir();
}

const MAX_DEPTH = 12;

async function walk(
	dir: string,
	target: CleanupTarget,
	base: string,
	row: ScanReport["categories"][number],
	depth: number,
): Promise<number> {
	if (depth > MAX_DEPTH) return 0;
	const entries = await readdir(dir, { withFileTypes: true }).catch(() => null);
	if (!entries) return 0;
	let total = 0;
	for (const entry of entries) {
		const child = join(dir, entry.name);
		const guarded = await guardCandidate(child, base);
		if (!guarded.ok) {
			row.skipped += 1;
			continue;
		}
		if (guarded.guarded.isDirectory) {
			total += await walk(child, target, base, row, depth + 1);
		} else {
			row.entries.push({
				targetId: target.id,
				targetLabel: target.label,
				path: child,
				size: guarded.guarded.size,
			});
			total += guarded.guarded.size;
		}
	}
	return total;
}

async function scanDirTarget(
	target: Extract<CleanupTarget, { kind: "dirs" }>,
	row: ScanReport["categories"][number],
): Promise<number> {
	let total = 0;
	for (const path of target.paths) {
		// The allowlisted directory itself is trusted; contents are guarded per entry.
		total += await walk(path, target, path, row, 0);
	}
	return total;
}

async function scanFileTarget(
	target: Extract<CleanupTarget, { kind: "files" }>,
	row: ScanReport["categories"][number],
): Promise<number> {
	let total = 0;
	for (const root of target.roots) {
		const entries = await readdir(root, { withFileTypes: true }).catch(() => null);
		if (!entries) continue;
		for (const entry of entries) {
			if (entry.name !== target.filename) continue;
			const child = join(root, entry.name);
			const guarded = await guardCandidate(child, root);
			if (!guarded.ok) {
				row.skipped += 1;
				continue;
			}
			row.entries.push({
				targetId: target.id,
				targetLabel: target.label,
				path: child,
				size: guarded.guarded.size,
			});
			total += guarded.guarded.size;
		}
	}
	return total;
}

/** Read-only scan across all targets for the running OS. */
export async function scanTargets(
	options: { only?: string[]; onProgress?: (label: string) => void } = {},
): Promise<ScanReport> {
	const targets = targetsFor().filter(
		(target) => !options.only?.length || options.only.includes(target.id),
	);
	const report: ScanReport = {
		os: currentOs(),
		categories: [],
		totalBytes: 0,
		scannedAt: new Date().toISOString(),
	};
	for (const target of targets) {
		options.onProgress?.(target.label);
		const row: ScanReport["categories"][number] = {
			target,
			entries: [],
			totalBytes: 0,
			skipped: 0,
		};
		if (target.kind === "dirs") {
			row.totalBytes = await scanDirTarget(target, row);
		} else if (target.kind === "files") {
			row.totalBytes = await scanFileTarget(target, row);
		}
		// command targets report availability only; sizes come at run time
		report.categories.push(row);
		report.totalBytes += row.totalBytes;
	}
	return report;
}

/* ---------- clean ---------- */

export interface CleanOptions {
	signal?: AbortSignal;
	onProgress?: (entry: ProcessingProgress) => void;
	/** Commands (brew cleanup etc.) run only when explicitly requested. */
	runCommands?: boolean;
}

export interface CleanResult {
	deletedFiles: number;
	freedBytes: number;
	commandsRun: Array<{ id: string; label: string; ok: boolean; detail: string }>;
	auditPath: string;
}

/**
 * Delete every guarded entry of the scan. Guarding is re-verified per entry
 * immediately before deletion; the audit log records exactly what was
 * removed. Caller decides dry-run by choosing to call this at all.
 */
export async function cleanScan(
	report: ScanReport,
	options: CleanOptions = {},
): Promise<CleanResult> {
	const result: CleanResult = { deletedFiles: 0, freedBytes: 0, commandsRun: [], auditPath: "" };
	const allEntries: ScannedEntry[] = [];
	const totalEntries = report.categories.reduce((sum, row) => sum + row.entries.length, 0) || 1;
	let done = 0;
	for (const row of report.categories) {
		if (row.target.kind !== "dirs" && row.target.kind !== "files") continue;
		const base = baseOf(row.target);
		for (const entry of row.entries) {
			if (options.signal?.aborted) throw new Error("Cancelled");
			const guarded = await guardCandidate(entry.path, base);
			if (!guarded.ok) continue;
			try {
				await rm(entry.path, { recursive: true, force: false });
				result.deletedFiles += 1;
				result.freedBytes += entry.size;
				allEntries.push(entry);
			} catch {
				/* file vanished or locked: skip */
			}
			done += 1;
			options.onProgress?.({
				stage: "processing",
				fraction: done / totalEntries,
				label: `Cleaning ${row.target.label}…`,
			});
		}
	}
	if (options.runCommands) {
		for (const row of report.categories) {
			if (row.target.kind !== "command") continue;
			for (const native of row.target.native) {
				const detail = await runNative(native.program, native.args);
				result.commandsRun.push({ id: row.target.id, label: row.target.label, ...detail });
			}
		}
	}
	result.auditPath = await writeAudit(report, result, allEntries);
	return result;
}

interface NativeOutcome {
	ok: boolean;
	detail: string;
}

/** Run an allowlisted native cleanup command (shell:false, fixed argv). */
function runNative(program: string, args: string[]): Promise<NativeOutcome> {
	return new Promise((resolve) => {
		const proc = spawnProcess(program, args, {
			shell: false,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let output = "";
		proc.stdout?.on("data", (chunk) => {
			output += String(chunk);
		});
		proc.stderr?.on("data", (chunk) => {
			output += String(chunk);
		});
		proc.on("error", () => resolve({ ok: false, detail: "not installed" }));
		proc.on("exit", (code) =>
			resolve({
				ok: code === 0,
				detail:
					code === 0
						? output.trim().split("\n").slice(0, 3).join(" · ").slice(0, 200)
						: `exit ${code}`,
			}),
		);
	});
}

async function writeAudit(
	report: ScanReport,
	result: CleanResult,
	entries: ScannedEntry[],
): Promise<string> {
	const { configDir } = await import("../config");
	const dir = join(configDir(), "cleanup-logs");
	const { mkdir } = await import("node:fs/promises");
	await mkdir(dir, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const path = join(dir, `${stamp}.json`);
	const payload = {
		scannedAt: report.scannedAt,
		os: report.os,
		deletedFiles: result.deletedFiles,
		freedBytes: result.freedBytes,
		commands: result.commandsRun,
		entries: entries.map((entry) => ({ path: entry.path, size: entry.size })),
	};
	await Bun.write(path, `${JSON.stringify(payload, null, "\t")}\n`);
	return path;
}
