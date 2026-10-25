import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Firefox <158 otherwise touches the real, TCC-protected macOS browser app-data root.
// https://github.com/microsoft/playwright/issues/42768
const firefoxData =
	process.platform === "darwin" ? mkdtempSync(join(tmpdir(), "qbtools-firefox-")) : null;
if (firefoxData)
	process.once("exit", () => {
		try {
			rmSync(firefoxData, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
		} catch {
			/* OS temp cleanup can remove late Firefox shutdown files. */
		}
	});

const baseURL = process.env.QBTOOLS_TEST_URL ?? "http://127.0.0.1:8311";
export default defineConfig({
	testDir: "./tests/browser",
	globalSetup: "./tests/browser/setup.ts",
	testMatch: "**/*.pw.ts",
	timeout: 60_000,
	expect: { timeout: 30_000 },
	workers: 1,
	fullyParallel: false,
	use: { baseURL, trace: "retain-on-failure" },
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				...(firefoxData
					? { launchOptions: { env: { ...process.env, CFFIXED_USER_HOME: firefoxData } } }
					: {}),
			},
		},
		{ name: "webkit", use: { ...devices["Desktop Safari"] } },
	],
	webServer: process.env.QBTOOLS_TEST_URL
		? undefined
		: {
				command: "bun run --cwd apps/web dev --host 127.0.0.1 --port 8311",
				url: baseURL,
				reuseExistingServer: !process.env.CI,
				timeout: 120_000,
			},
});
