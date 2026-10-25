/**
 * CLI configuration: ~/.config/qbtools/config.json with named profiles
 * (server URL, output dir, ffmpeg path) plus local favorites/recents.
 * `--profile <name>` (env QBTOOLS_PROFILE) selects a profile.
 */

import { chmod, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ProfileConfig {
	serverUrl: string;
	outputDir: string;
	ffmpegPath?: string;
}

export interface CliConfig {
	version: 1;
	onboarded: boolean;
	activeProfile: string;
	profiles: Record<string, ProfileConfig>;
	/** Local (anonymous) favorites; merged with the server on login. */
	favorites: string[];
	recents: string[];
	updateCheck: boolean;
}

export const DEFAULT_PROFILE = "default";
export const DEFAULT_SERVER_URL = "http://localhost:8310";

export function configDir(): string {
	if (process.env.QBTOOLS_CONFIG_DIR) return process.env.QBTOOLS_CONFIG_DIR;
	const xdg = process.env.XDG_CONFIG_HOME;
	if (xdg) return join(xdg, "qbtools");
	const appData = process.env.APPDATA;
	if (appData) return join(appData, "qbtools");
	return join(homedir(), ".config", "qbtools");
}

export function configFilePath(): string {
	return join(configDir(), "config.json");
}

function defaultConfig(): CliConfig {
	return {
		version: 1,
		onboarded: false,
		activeProfile: DEFAULT_PROFILE,
		profiles: {
			[DEFAULT_PROFILE]: {
				serverUrl: DEFAULT_SERVER_URL,
				outputDir: "./qbtools-output",
			},
		},
		favorites: [],
		recents: [],
		updateCheck: true,
	};
}

let cache: CliConfig | null = null;

export async function loadConfig(force = false): Promise<CliConfig> {
	if (cache && !force) return cache;
	const path = configFilePath();
	try {
		const text = await Bun.file(path).text();
		const parsed = JSON.parse(text) as Partial<CliConfig>;
		const base = defaultConfig();
		cache = {
			...base,
			...parsed,
			profiles: { ...base.profiles, ...parsed.profiles },
			favorites: parsed.favorites ?? [],
			recents: parsed.recents ?? [],
		};
	} catch {
		cache = defaultConfig();
	}
	return cache;
}

export async function saveConfig(config: CliConfig): Promise<void> {
	const dir = configDir();
	await mkdir(dir, { recursive: true });
	await Bun.write(configFilePath(), `${JSON.stringify(config, null, "\t")}\n`);
	await chmod(configFilePath(), 0o600).catch(() => {});
	cache = config;
}

/** The profile in effect: QBTOOLS_PROFILE/--profile, else the active one. */
export function effectiveProfileName(config: CliConfig): string {
	const requested = process.env.QBTOOLS_PROFILE?.trim();
	if (requested && config.profiles[requested]) return requested;
	return config.activeProfile;
}

export function activeProfile(config: CliConfig): ProfileConfig {
	const name = effectiveProfileName(config);
	return (
		config.profiles[name] ??
		config.profiles[DEFAULT_PROFILE] ?? {
			serverUrl: DEFAULT_SERVER_URL,
			outputDir: "./qbtools-output",
		}
	);
}

/** Server base URL: env override wins, then profile. */
export function serverUrl(config: CliConfig): string {
	const fromEnv = process.env.QBTOOLS_SERVER?.trim();
	if (fromEnv) return fromEnv.replace(/\/+$/, "");
	return activeProfile(config).serverUrl.replace(/\/+$/, "");
}

export async function recordRecent(slug: string): Promise<void> {
	const config = await loadConfig();
	const recents = [slug, ...config.recents.filter((item) => item !== slug)].slice(0, 10);
	await saveConfig({ ...config, recents });
}

export async function toggleFavorite(slug: string): Promise<boolean> {
	const config = await loadConfig();
	const has = config.favorites.includes(slug);
	const favorites = has
		? config.favorites.filter((item) => item !== slug)
		: [...config.favorites, slug];
	await saveConfig({ ...config, favorites });
	return !has;
}
