/**
 * Declarative cleanup targets per OS. Everything is a fixed, well-known
 * user-level path — no user-supplied roots, no recursive glob input. Native
 * command targets (brew cleanup, apt-get clean, …) carry literal argv only
 * and are executed through the same shell:false/allowlist pattern as media.
 */

import { homedir, platform, tmpdir } from "node:os";
import { join } from "node:path";

export type CleanupOs = "macos" | "linux" | "windows";

export function currentOs(): CleanupOs {
	const p = platform();
	if (p === "darwin") return "macos";
	if (p === "win32") return "windows";
	return "linux";
}

export interface DirTarget {
	kind: "dirs";
	id: string;
	label: string;
	description: string;
	/** Contents of these directories are removed; the directory itself stays. */
	paths: string[];
}

export interface FileTarget {
	kind: "files";
	id: string;
	label: string;
	description: string;
	/** Exact file patterns (basename match) searched one level under these roots. */
	roots: string[];
	filename: string;
}

export interface CommandTarget {
	kind: "command";
	id: string;
	label: string;
	description: string;
	/** Fixed allowlist: only these (binary, argv) pairs may ever run. */
	native: Array<{ program: string; args: string[] }>;
}

export type CleanupTarget = DirTarget | FileTarget | CommandTarget;

function home(...parts: string[]): string {
	return join(homedir(), ...parts);
}

/** Targets shared by macOS and Linux (dev + browser caches). */
function unixShared(): CleanupTarget[] {
	return [
		{
			kind: "dirs",
			id: "npm-cache",
			label: "npm cache",
			description: "Package download cache (~/.npm).",
			paths: [home(".npm", "_cacache"), home(".npm", "_logs")],
		},
		{
			kind: "dirs",
			id: "bun-cache",
			label: "Bun install cache",
			description: "Bun's global install cache (~/.bun/install/cache).",
			paths: [home(".bun", "install", "cache")],
		},
		{
			kind: "dirs",
			id: "pip-cache",
			label: "pip cache",
			description: "Python package wheel cache (~/.cache/pip).",
			paths: [home(".cache", "pip")],
		},
		{
			kind: "dirs",
			id: "yarn-cache",
			label: "Yarn cache",
			description: "Yarn package cache (~/.cache/yarn).",
			paths: [home(".cache", "yarn")],
		},
		{
			kind: "dirs",
			id: "pnpm-cache",
			label: "pnpm cache",
			description: "pnpm package store metadata cache.",
			paths: [home(".cache", "pnpm")],
		},
	];
}

function macosTargets(): CleanupTarget[] {
	return [
		{
			kind: "dirs",
			id: "user-caches",
			label: "User caches",
			description: "Per-app caches in ~/Library/Caches.",
			paths: [home("Library", "Caches")],
		},
		{
			kind: "dirs",
			id: "user-logs",
			label: "User logs",
			description: "Application logs in ~/Library/Logs.",
			paths: [home("Library", "Logs")],
		},
		{
			kind: "dirs",
			id: "trash",
			label: "Trash",
			description: "Files in ~/.Trash.",
			paths: [home(".Trash")],
		},
		{
			kind: "dirs",
			id: "xcode-derived",
			label: "Xcode DerivedData",
			description: "Build artifacts (~/Library/Developer/Xcode/DerivedData).",
			paths: [home("Library", "Developer", "Xcode", "DerivedData")],
		},
		{
			kind: "dirs",
			id: "simulator-caches",
			label: "iOS Simulator caches",
			description: "Simulator caches (~/Library/Developer/CoreSimulator/Caches).",
			paths: [home("Library", "Developer", "CoreSimulator", "Caches")],
		},
		...unixShared(),
		{
			kind: "command",
			id: "brew-cleanup",
			label: "Homebrew cleanup",
			description: "Old versions and stale downloads (`brew cleanup --prune=all`).",
			native: [{ program: "brew", args: ["cleanup", "--prune=all"] }],
		},
		{
			kind: "files",
			id: "ds-store",
			label: ".DS_Store files",
			description: "Finder metadata files swept from your home directory.",
			roots: [home()],
			filename: ".DS_Store",
		},
	];
}

function linuxTargets(): CleanupTarget[] {
	return [
		{
			kind: "dirs",
			id: "user-cache",
			label: "User cache",
			description: "General app cache (~/.cache).",
			paths: [home(".cache")],
		},
		{
			kind: "dirs",
			id: "thumbnails",
			label: "Thumbnails",
			description: "File manager thumbnails (~/.thumbnails).",
			paths: [home(".thumbnails")],
		},
		{
			kind: "dirs",
			id: "trash",
			label: "Trash",
			description: "~/.local/share/Trash/files and .info.",
			paths: [home(".local", "share", "Trash", "files"), home(".local", "share", "Trash", "info")],
		},
		...unixShared(),
		{
			kind: "command",
			id: "apt-clean",
			label: "APT package cache",
			description: "Downloaded .deb archives (needs sudo, skipped silently when unavailable).",
			native: [{ program: "apt-get", args: ["clean"] }],
		},
		{
			kind: "command",
			id: "journal-vacuum",
			label: "Systemd journal vacuum",
			description: "Shrink journald logs to 100 MB (needs sudo).",
			native: [{ program: "journalctl", args: ["--vacuum-size=100M"] }],
		},
	];
}

function windowsTargets(): CleanupTarget[] {
	const localAppData = process.env.LOCALAPPDATA ?? home("AppData", "Local");
	const winTemp = process.env.TEMP ?? tmpdir();
	return [
		{
			kind: "dirs",
			id: "temp",
			label: "Temp folder",
			description: "User temporary files (%TEMP%).",
			paths: [winTemp],
		},
		{
			kind: "dirs",
			id: "browser-caches",
			label: "Browser caches",
			description: "Chrome/Edge/Firefox cache directories in %LOCALAPPDATA%.",
			paths: [
				join(localAppData, "Google", "Chrome", "User Data", "Default", "Cache"),
				join(localAppData, "Microsoft", "Edge", "User Data", "Default", "Cache"),
				join(localAppData, "Mozilla", "Firefox", "Profiles"),
			],
		},
		{
			kind: "dirs",
			id: "npm-cache",
			label: "npm cache",
			description: "npm cache (%LOCALAPPDATA%\\npm-cache).",
			paths: [join(localAppData, "npm-cache")],
		},
		{
			kind: "dirs",
			id: "bun-cache",
			label: "Bun install cache",
			description: "Bun install cache under the user profile.",
			paths: [home(".bun", "install", "cache")],
		},
	];
}

/** Targets for the running OS. Order is display order. */
export function targetsFor(os: CleanupOs = currentOs()): CleanupTarget[] {
	switch (os) {
		case "macos":
			return macosTargets();
		case "linux":
			return linuxTargets();
		case "windows":
			return windowsTargets();
	}
}

export const OS_LABELS: Record<CleanupOs, string> = {
	macos: "macOS",
	linux: "Linux",
	windows: "Windows",
};
