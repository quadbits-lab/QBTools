import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	activeProfile,
	effectiveProfileName,
	loadConfig,
	saveConfig,
	serverUrl,
	toggleFavorite,
} from "./config";

const savedEnv = { ...process.env };

async function tempConfigDir(): Promise<string> {
	return mkdtemp(join(tmpdir(), "qbtools-config-test-"));
}

afterEach(async () => {
	for (const key of Object.keys(process.env)) {
		if (!(key in savedEnv)) delete process.env[key];
	}
	Object.assign(process.env, savedEnv);
});

describe("config", () => {
	test("defaults when no file exists", async () => {
		const dir = await tempConfigDir();
		process.env.QBTOOLS_CONFIG_DIR = dir;
		const config = await loadConfig(true);
		expect(config.onboarded).toBeFalse();
		expect(config.profiles.default.serverUrl).toBe("http://localhost:8310");
		expect(config.updateCheck).toBeTrue();
		await rm(dir, { recursive: true, force: true });
	});

	test("round-trips profiles and favorites", async () => {
		const dir = await tempConfigDir();
		process.env.QBTOOLS_CONFIG_DIR = dir;
		const config = await loadConfig(true);
		config.profiles.work = {
			serverUrl: "https://qbtools.example.com",
			outputDir: "/tmp/work-out",
		};
		config.activeProfile = "work";
		await saveConfig(config);

		const reloaded = await loadConfig(true);
		expect(effectiveProfileName(reloaded)).toBe("work");
		expect(activeProfile(reloaded).outputDir).toBe("/tmp/work-out");
		expect(serverUrl(reloaded)).toBe("https://qbtools.example.com");

		const added = await toggleFavorite("merge-pdf");
		expect(added).toBeTrue();
		const afterToggle = await loadConfig(true);
		expect(afterToggle.favorites).toEqual(["merge-pdf"]);
		expect(await toggleFavorite("merge-pdf")).toBeFalse();

		await rm(dir, { recursive: true, force: true });
	});

	test("QBTOOLS_SERVER env overrides the profile", async () => {
		const dir = await tempConfigDir();
		process.env.QBTOOLS_CONFIG_DIR = dir;
		process.env.QBTOOLS_SERVER = "https://override.example.com/";
		const config = await loadConfig(true);
		expect(serverUrl(config)).toBe("https://override.example.com");
		await rm(dir, { recursive: true, force: true });
	});

	test("unknown --profile falls back to the active profile", async () => {
		const dir = await tempConfigDir();
		process.env.QBTOOLS_CONFIG_DIR = dir;
		process.env.QBTOOLS_PROFILE = "does-not-exist";
		const config = await loadConfig(true);
		expect(effectiveProfileName(config)).toBe(config.activeProfile);
		await rm(dir, { recursive: true, force: true });
	});
});
