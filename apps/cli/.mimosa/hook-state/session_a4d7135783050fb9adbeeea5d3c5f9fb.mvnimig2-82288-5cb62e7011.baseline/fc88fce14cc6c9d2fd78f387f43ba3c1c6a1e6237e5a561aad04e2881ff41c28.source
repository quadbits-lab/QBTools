/**
 * Native ffmpeg integration. All subprocesses run through
 * node:child_process.spawn with shell:false and an argument ARRAY — no
 * string commands are ever built. Executables come from a fixed allowlist of
 * literal names/paths (a custom install is picked up via PATH, plain binary
 * name). File arguments are wrapped in MediaPath, which refuses empty or
 * flag-shaped values.
 */

import { spawn as spawnProcess } from "node:child_process";
import type { ProcessingProgress } from "../runner/types";

/** A file argument vetted for ffmpeg (never empty, never a flag). */
export class MediaPath {
	private constructor(private readonly value: string) {}
	static create(raw: string, label: string): MediaPath {
		const trimmed = raw.trim();
		if (!trimmed) throw new Error(`${label} is required.`);
		if (trimmed.startsWith("-")) throw new Error(`${label} looks like a flag, not a path.`);
		return new MediaPath(trimmed);
	}
	get arg(): string {
		return this.value;
	}
}

const FFMPEG_CANDIDATES: Array<{ cmd: string }> = [
	{ cmd: "ffmpeg" },
	{ cmd: "/opt/homebrew/bin/ffmpeg" },
	{ cmd: "/usr/local/bin/ffmpeg" },
];
const FFPROBE_CANDIDATES: Array<{ cmd: string }> = [
	{ cmd: "ffprobe" },
	{ cmd: "/opt/homebrew/bin/ffprobe" },
	{ cmd: "/usr/local/bin/ffprobe" },
];

let resolved: { ffmpeg: { cmd: string }; ffprobe: { cmd: string } } | null | undefined;

/** Resolved binary paths (or null when absent) — used by doctor. */
export async function ffmpegPaths(): Promise<{ ffmpeg: string; ffprobe: string } | null> {
	try {
		const bins = await resolveBinaries();
		return { ffmpeg: bins.ffmpeg.cmd, ffprobe: bins.ffprobe.cmd };
	} catch (error) {
		if (isFfmpegMissingPublic(error)) return null;
		throw error;
	}
}

function isFfmpegMissingPublic(error: unknown): boolean {
	return (error as Error | undefined)?.name === "FfmpegUnavailable";
}

async function resolveBinaries(): Promise<{ ffmpeg: { cmd: string }; ffprobe: { cmd: string } }> {
	if (resolved !== undefined) {
		if (!resolved) throw unavailable();
		return resolved;
	}
	for (const [index, ffprobe] of FFPROBE_CANDIDATES.entries()) {
		const ffmpeg = FFMPEG_CANDIDATES[index];
		if (!ffmpeg) continue;
		const code = await probeBinary(ffprobe.cmd);
		if (code === 0) {
			resolved = { ffmpeg, ffprobe };
			return resolved;
		}
	}
	resolved = null;
	throw unavailable();
}

/** Version probe: fixed argv, shell disabled. */
function probeBinary(cmd: string): Promise<number> {
	return new Promise((resolve) => {
		const proc = spawnProcess(cmd, ["-version"], {
			shell: false,
			stdio: ["ignore", "ignore", "ignore"],
		});
		proc.on("error", () => resolve(1));
		proc.on("exit", (code) => resolve(code ?? 1));
	});
}

function unavailable(): Error {
	return Object.assign(
		new Error(
			"This tool needs a native ffmpeg binary. Install it (brew install ffmpeg / apt install ffmpeg) or add it to your PATH.",
		),
		{ name: "FfmpegUnavailable" },
	);
}

export function isFfmpegMissing(error: unknown): boolean {
	return (error as Error | undefined)?.name === "FfmpegUnavailable";
}

export interface MediaInfo {
	durationSeconds: number;
	width?: number;
	height?: number;
}

const DURATION_SECONDS_MAX = 60 * 60 * 24;

export async function probeMedia(file: MediaPath): Promise<MediaInfo> {
	const bins = await resolveBinaries();
	return new Promise<MediaInfo>((resolve, reject) => {
		const proc = spawnProcess(
			bins.ffprobe.cmd,
			[
				"-v",
				"error",
				"-show_entries",
				"format=duration:stream=width,height",
				"-of",
				"default=noprint_wrappers=1:nokey=0",
				file.arg,
			],
			{ shell: false, stdio: ["ignore", "pipe", "pipe"] },
		);
		let stdout = "";
		let stderr = "";
		proc.stdout.on("data", (chunk) => {
			stdout += String(chunk);
		});
		proc.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		proc.on("error", reject);
		proc.on("exit", (code) => {
			if (code !== 0) {
				reject(new Error(cleanProbeError(stderr)));
				return;
			}
			resolve(parseProbeOutput(stdout));
		});
	});
}

function parseProbeOutput(stdout: string): MediaInfo {
	const info: MediaInfo = { durationSeconds: 0 };
	for (const raw of stdout.split("\n")) {
		const line = raw.trim();
		if (line.startsWith("duration=")) {
			const seconds = Number(line.slice("duration=".length));
			if (Number.isFinite(seconds) && seconds > 0 && seconds < DURATION_SECONDS_MAX) {
				info.durationSeconds = seconds;
			}
		}
		if (line.startsWith("width=")) {
			const width = Number(line.slice("width=".length));
			if (Number.isFinite(width) && width > 0) info.width = width;
		}
		if (line.startsWith("height=")) {
			const height = Number(line.slice("height=".length));
			if (Number.isFinite(height) && height > 0) info.height = height;
		}
	}
	return info;
}

function cleanProbeError(stderr: string): string {
	const firstMeaningful = stderr
		.split("\n")
		.map((line) => line.trim())
		.find((line) => line && !line.startsWith("["));
	if (firstMeaningful) return firstMeaningful;
	return "ffprobe couldn't read that file.";
}

export interface RunFfmpegOptions {
	signal?: AbortSignal;
	onProgress?: (entry: ProcessingProgress) => void;
	durationSeconds?: number;
	label?: string;
}

/**
 * Run one ffmpeg job. `argv` is prebuilt by the runners (literals plus
 * MediaPath args) and always ends with `-progress pipe:1`. The child is
 * killed on cancellation.
 */
export async function runFfmpeg(
	argvOptions: Array<string | MediaPath>,
	options: RunFfmpegOptions = {},
): Promise<void> {
	const bins = await resolveBinaries();
	const args: string[] = ["-hide_banner", "-loglevel", "error", "-y"];
	for (const part of argvOptions) args.push(typeof part === "string" ? part : part.arg);
	await new Promise<void>((resolve, reject) => {
		const controller = new AbortController();
		const proc = spawnProcess(bins.ffmpeg.cmd, args, {
			shell: false,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdoutBuffer = "";
		let stderrBuffer = "";
		let settled = false;
		const finish = (fn: () => void) => {
			if (settled) return;
			settled = true;
			controller.abort();
			options.signal?.removeEventListener("abort", onAbort);
			fn();
		};
		const onAbort = () => {
			if (settled) return;
			proc.kill("SIGKILL");
			finish(resolve);
		};
		if (options.signal) {
			if (options.signal.aborted) onAbort();
			else options.signal.addEventListener("abort", onAbort, { once: true });
		}
		proc.stdout.on("data", (chunk) => {
			stdoutBuffer += String(chunk);
			let index = stdoutBuffer.indexOf("progress=");
			while (index >= 0) {
				const lineStart = stdoutBuffer.lastIndexOf("\n", index);
				const timeMatch = /out_time_ms=(\d+)/.exec(
					stdoutBuffer.slice(lineStart < 0 ? 0 : lineStart, index),
				);
				if (timeMatch && options.durationSeconds && options.onProgress) {
					const seconds = Number(timeMatch[1]) / 1_000_000;
					options.onProgress({
						stage: "processing",
						fraction: Math.min(1, seconds / options.durationSeconds),
						label: options.label ?? "Processing…",
					});
				}
				stdoutBuffer = stdoutBuffer.slice(index + 1);
				index = stdoutBuffer.indexOf("progress=");
			}
		});
		proc.stderr.on("data", (chunk) => {
			stderrBuffer += String(chunk);
			if (stderrBuffer.length > 8192) stderrBuffer = stderrBuffer.slice(-4096);
		});
		proc.on("error", (error) => finish(() => reject(error)));
		proc.on("exit", (code) => {
			if (settled) return;
			const cancelled = controller.signal.aborted || code === null;
			if (cancelled || code === 0) finish(resolve);
			else {
				finish(() =>
					reject(
						new Error(
							[ffmpegStderr(stderrBuffer), "ffmpeg exited with an error."]
								.filter(Boolean)
								.join(" — "),
						),
					),
				);
			}
		});
	});
}

function ffmpegStderr(stderr: string): string {
	const lines = stderr
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("progress="));
	const tail = lines.slice(-3).join(" · ");
	return tail.slice(0, 300);
}

/** Grab a still frame as PNG bytes (thumbnail-maker input). */
export async function grabFrame(file: MediaPath, seconds: number): Promise<Uint8Array> {
	const bins = await resolveBinaries();
	const seek = Math.max(0, Math.min(seconds, DURATION_SECONDS_MAX));
	return new Promise<Uint8Array>((resolve, reject) => {
		const proc = spawnProcess(
			bins.ffmpeg.cmd,
			[
				"-hide_banner",
				"-loglevel",
				"error",
				"-ss",
				seek.toFixed(3),
				"-i",
				file.arg,
				"-frames:v",
				"1",
				"-f",
				"image2pipe",
				"-vcodec",
				"png",
				"pipe:1",
			],
			{ shell: false, stdio: ["ignore", "pipe", "pipe"] },
		);
		const chunks: Buffer[] = [];
		let stderr = "";
		proc.stdout.on("data", (chunk) => chunks.push(chunk as Buffer));
		proc.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		proc.on("error", reject);
		proc.on("exit", () => {
			const png = Buffer.concat(chunks);
			if (png.length) resolve(new Uint8Array(png));
			else reject(new Error(cleanProbeError(stderr)));
		});
	});
}
