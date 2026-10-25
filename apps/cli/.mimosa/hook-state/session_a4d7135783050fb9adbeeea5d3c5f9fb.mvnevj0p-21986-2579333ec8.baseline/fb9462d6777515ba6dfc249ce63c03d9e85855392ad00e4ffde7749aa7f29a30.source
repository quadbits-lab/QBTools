import { describe, expect, test } from "bun:test";
import { CLI_VERSION } from "./version";

describe("version", () => {
	test("stays in sync with package.json", async () => {
		const pkgUrl = new URL("../package.json", import.meta.url);
		const pkg = JSON.parse(await Bun.file(pkgUrl).text()) as { version: string };
		expect(CLI_VERSION).toBe(pkg.version);
	});
});
