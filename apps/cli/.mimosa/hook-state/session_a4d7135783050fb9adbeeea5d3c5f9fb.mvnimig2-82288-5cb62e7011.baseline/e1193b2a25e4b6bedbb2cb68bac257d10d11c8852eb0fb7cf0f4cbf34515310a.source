/**
 * Non-blocking update check against the npm registry, at most once a day.
 * Results are cached in the config directory; `--no-update-check` and
 * `updateCheck: false` in config.json opt out entirely.
 */

import { CLI_VERSION } from "../version";
import { configFilePath, loadConfig } from "./config";

export interface UpdateStatus {
	current: string;
	latest: string;
	updateAvailable: boolean;
}

interface CheckCache {
	checkedAt: number;
	latest: string;
}

const DAY_MS = 86_400_000;

function cachePath(): string {
	return configFilePath().replace("config.json", "update-check.json");
}

function compareSemver(a: string, b: string): number {
	const parse = (value: string) =>
		value
			.replace(/^v/, "")
			.split(".")
			.map((part) => Number.parseInt(part, 10) || 0);
	const [aMajor = 0, aMinor = 0, aPatch = 0] = parse(a);
	const [bMajor = 0, bMinor = 0, bPatch = 0] = parse(b);
	if (aMajor !== bMajor) return aMajor - bMajor;
	if (aMinor !== bMinor) return aMinor - bMinor;
	return aPatch - bPatch;
}

/**
 * Check for a newer published version. Never throws; returns null when the
 * check is disabled, too recent, or the registry is unreachable.
 */
export async function checkForUpdate(
	options: { timeoutMs?: number } = {},
): Promise<UpdateStatus | null> {
	const config = await loadConfig();
	if (!config.updateCheck || process.env.QBTOOLS_NO_UPDATE_CHECK === "1") return null;

	try {
		const cached = JSON.parse(await Bun.file(cachePath()).text()) as CheckCache;
		if (Date.now() - cached.checkedAt < DAY_MS) {
			return {
				current: CLI_VERSION,
				latest: cached.latest,
				updateAvailable: compareSemver(CLI_VERSION, cached.latest) < 0,
			};
		}
	} catch {
		/* No cache yet. */
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);
		const response = await fetch("https://registry.npmjs.org/qbtools/latest", {
			signal: controller.signal,
		});
		clearTimeout(timeout);
		if (!response.ok) return null;
		const payload = (await response.json()) as { version?: string };
		const latest = payload.version;
		if (!latest) return null;
		await Bun.write(
			cachePath(),
			JSON.stringify({ checkedAt: Date.now(), latest } satisfies CheckCache),
		);
		return {
			current: CLI_VERSION,
			latest,
			updateAvailable: compareSemver(CLI_VERSION, latest) < 0,
		};
	} catch {
		return null;
	}
}

export function updateHint(status: UpdateStatus | null): string | null {
	if (!status?.updateAvailable) return null;
	return `qbtools ${status.latest} is available (you have ${status.current}). Upgrade: npm i -g qbtools`;
}
