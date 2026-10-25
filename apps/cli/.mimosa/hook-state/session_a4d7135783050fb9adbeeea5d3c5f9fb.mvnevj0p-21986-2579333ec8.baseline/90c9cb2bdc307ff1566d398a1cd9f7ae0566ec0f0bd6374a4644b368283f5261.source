/**
 * Shared file I/O helpers for runners: resolve input paths to File objects,
 * write outputs, and keep naming deterministic.
 */

import { mkdir } from "node:fs/promises";
import { basename, join } from "node:path";
import type { FileRef } from "./types";

const MAX_INPUT_BYTES = 128 * 1024 * 1024;

/** Read one or more filesystem paths into FileRefs (File + source path).
 * Engines receive the File; runners needing the on-disk path use filePaths(). */
export async function readInputFiles(paths: readonly string[]): Promise<FileRef[]> {
	if (!paths.length) throw new Error("No input files given. Use --in <path> […].");
	const results: FileRef[] = [];
	for (const path of paths) {
		const file = Bun.file(path);
		if (!(await file.exists())) throw new Error(`Input file not found: ${path}`);
		if (file.size > MAX_INPUT_BYTES) throw new Error(`Input file is too large (>128 MiB): ${path}`);
		results.push({ file: new File([await file.arrayBuffer()], basename(path)), path });
	}
	return results;
}

export interface SavedOutput {
	path: string;
	bytes: number;
}

/** Write an output; `outPath` wins, otherwise <outDir>/<suggestedName> (deduped). */
export async function writeOutput(
	options: {
		outDir: string;
		outPath?: string;
		suggestedName: string;
	},
	bytes: Uint8Array,
): Promise<SavedOutput> {
	if (options.outPath) {
		await mkdir(join(options.outPath, ".."), { recursive: true });
		await Bun.write(options.outPath, bytes);
		return { path: options.outPath, bytes: bytes.byteLength };
	}
	await mkdir(options.outDir, { recursive: true });
	const path = await dedupePath(options.outDir, options.suggestedName);
	await Bun.write(path, bytes);
	return { path, bytes: bytes.byteLength };
}

async function dedupePath(dir: string, name: string): Promise<string> {
	const ext = name.slice(name.lastIndexOf("."));
	const stem = name.slice(0, name.length - ext.length);
	let candidate = join(dir, name);
	for (let i = 2; i < 1000 && (await Bun.file(candidate).exists()); i++) {
		candidate = join(dir, `${stem}-${i}${ext}`);
	}
	return candidate;
}

/**
 * Reserve an output path for a process that writes the file itself
 * (ffmpeg), with the same dedupe behavior as writeOutput.
 */
export async function pickOutputPath(outDir: string, suggestedName: string): Promise<string> {
	await mkdir(outDir, { recursive: true });
	return dedupePath(outDir, suggestedName);
}

export function stemOf(name: string): string {
	const ext = name.slice(name.lastIndexOf("."));
	return name.slice(0, name.length - ext.length);
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KiB", "MiB", "GiB"];
	let value = bytes;
	let unit = "B";
	for (const next of units) {
		if (value < 1024) break;
		value /= 1024;
		unit = next;
	}
	return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
}

/** Size of a file the runner (or a subprocess) has written. */
export async function statFile(path: string): Promise<number> {
	return Bun.file(path).size;
}
