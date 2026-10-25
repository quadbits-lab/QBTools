import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkForUpdate, updateHint } from "./update-check";

const savedEnv = { ...process.env };

afterEach(async () => {
	for (const key of Object.keys(process.env)) {
		if (!(key in savedEnv)) delete process.env[key];
	}
	Object.assign(process.env, savedEnv);
});

async function tempConfigDir(): Promise<string> {
	return mkdtemp(join(tmpdir(), "qbtools-update-test-"));
}

describe("update check", () => {
	test("respects the disabled flag", async () => {
		const dir = await tempConfigDir();
		process.env.QBTOOLS_CONFIG_DIR = dir;
		const { loadConfig, saveConfig } = await import("./config");
		const config = await loadConfig(true);
		await saveConfig({ ...config, updateCheck: false });
		expect(await checkForUpdate()).toBeNull();
		await rm(dir, { recursive: true, force: true });
	});

	test("respects the env opt-out", async () => {
		const dir = await tempConfigDir();
		process.env.QBTOOLS_CONFIG_DIR = dir;
		process.env.QBTOOLS_NO_UPDATE_CHECK = "1";
		expect(await checkForUpdate()).toBeNull();
		await rm(dir, { recursive: true, force: true });
	});

	test("uses the daily cache without hitting the network", async () => {
		const dir = await tempConfigDir();
		process.env.QBTOOLS_CONFIG_DIR = dir;
		await Bun.write(
			join(dir, "update-check.json"),
			JSON.stringify({ checkedAt: Date.now(), latest: "99.0.0" }),
		);
		const status = await checkForUpdate();
		expect(status?.updateAvailable).toBeTrue();
		expect(status?.latest).toBe("99.0.0");
		expect(updateHint(status)).toContain("npm i -g qbtools");
		await rm(dir, { recursive: true, force: true });
	});

	test("no hint when up to date or check failed", () => {
		expect(updateHint(null)).toBeNull();
		expect(updateHint({ current: "1.0.0", latest: "1.0.0", updateAvailable: false })).toBeNull();
	});
});
