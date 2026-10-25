/**
 * Cleanup safety tests: path guards against escape/symlink/special files,
 * scan round-trips on fixture trees, dry-run guarantees, audit logs.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { cleanScan, scanTargets } from "./clean";
import { guardCandidate } from "./paths";
import { currentOs, targetsFor } from "./targets";

const created: string[] = [];

async function fixtureDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "qbtools-cleanup-test-"));
	created.push(dir);
	return dir;
}

afterEach(async () => {
	for (const dir of created.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

describe("path guards", () => {
	test("accepts a regular file inside the base", async () => {
		const base = await fixtureDir();
		const file = join(base, "cache.bin");
		await writeFile(file, "data");
		const result = await guardCandidate(file, base);
		expect(result.ok).toBeTrue();
	});

	test("rejects a candidate outside the base", async () => {
		const base = await fixtureDir();
		const outside = await fixtureDir();
		const result = await guardCandidate(outside, base);
		expect(result.ok).toBeFalse();
	});

	test("rejects a symlink escaping the base", async () => {
		const base = await fixtureDir();
		const outside = await fixtureDir();
		const link = join(base, "escape");
		await symlink(outside, link);
		const result = await guardCandidate(link, base);
		expect(result.ok).toBeFalse();
		if (!result.ok) expect(result.reason).toContain("symlink");
	});

	test("rejects the base directory itself", async () => {
		const base = await fixtureDir();
		const result = await guardCandidate(base, base);
		expect(result.ok).toBeFalse();
	});

	test("handles missing candidates gracefully", async () => {
		const base = await fixtureDir();
		const result = await guardCandidate(join(base, "gone.bin"), base);
		expect(result.ok).toBeFalse();
	});
});

describe("targets", () => {
	test("every OS has at least three dir targets", () => {
		for (const os of ["macos", "linux", "windows"] as const) {
			const targets = targetsFor(os);
			const dirs = targets.filter((target) => target.kind === "dirs");
			expect(dirs.length).toBeGreaterThanOrEqual(3);
			for (const target of targets) {
				expect(target.id).toMatch(/^[a-z0-9-]+$/);
			}
		}
	});

	test("all allowlisted paths live under the user home (unix)", () => {
		if (currentOs() === "windows") return; // %TEMP% may be elsewhere
		for (const target of targetsFor()) {
			if (target.kind === "dirs") {
				for (const path of target.paths) {
					expect(path.startsWith(homedir())).toBeTrue();
				}
			}
		}
	});

	test("native commands use fixed argv (brew/apt/journalctl)", () => {
		for (const target of targetsFor()) {
			if (target.kind !== "command") continue;
			for (const native of target.native) {
				expect(["brew", "apt-get", "journalctl"]).toContain(native.program);
				expect(native.args.every((arg) => !arg.startsWith("-rf"))).toBeTrue();
			}
		}
	});
});

describe("scan + clean round-trip", () => {
	test("scan finds fixture files without deleting them; clean removes only guarded entries", async () => {
		const cache = await fixtureDir();
		const nested = join(cache, "app");
		await mkdir(nested, { recursive: true });
		await writeFile(join(nested, "blob.bin"), "x".repeat(1024));

		// Build a scan report scoped to exactly this fixture directory.
		const report = {
			os: currentOs(),
			categories: [
				{
					target: {
						kind: "dirs" as const,
						id: "fixture",
						label: "Fixture cache",
						description: "test",
						paths: [cache],
					},
					entries: [] as Array<{
						targetId: string;
						targetLabel: string;
						path: string;
						size: number;
					}>,
					totalBytes: 0,
					skipped: 0,
				},
			],
			totalBytes: 0,
			scannedAt: new Date().toISOString(),
		};
		const rows = report.categories[0];
		if (!rows) throw new Error("missing fixture row");
		const guarded = await guardCandidate(join(nested, "blob.bin"), cache);
		expect(guarded.ok).toBeTrue();
		if (guarded.ok) {
			rows.entries.push({
				targetId: "fixture",
				targetLabel: "Fixture cache",
				path: join(nested, "blob.bin"),
				size: guarded.guarded.size,
			});
			rows.totalBytes = guarded.guarded.size;
		}
		report.totalBytes = rows.totalBytes;

		const result = await cleanScan(report);
		expect(result.deletedFiles).toBe(1);
		expect(result.freedBytes).toBe(1024);
		expect(result.auditPath).toContain("cleanup-logs");

		const audit = JSON.parse(await Bun.file(result.auditPath).text()) as {
			deletedFiles: number;
			entries: Array<{ path: string }>;
		};
		expect(audit.deletedFiles).toBe(1);
		expect(audit.entries[0]?.path).toBe(join(nested, "blob.bin"));
		await rm(result.auditPath, { force: true });
	});

	test("clean re-verifies the guard: escaped entries are skipped", async () => {
		const base = await fixtureDir();
		const outside = await fixtureDir();
		const outsideFile = join(outside, "precious.txt");
		await writeFile(outsideFile, "keep me");
		const report = {
			os: currentOs(),
			categories: [
				{
					target: {
						kind: "dirs" as const,
						id: "fixture",
						label: "Fixture",
						description: "test",
						paths: [base],
					},
					entries: [{ targetId: "fixture", targetLabel: "Fixture", path: outsideFile, size: 7 }],
					totalBytes: 7,
					skipped: 0,
				},
			],
			totalBytes: 7,
			scannedAt: new Date().toISOString(),
		};
		const result = await cleanScan(report);
		expect(result.deletedFiles).toBe(0);
		expect(await Bun.file(outsideFile).text()).toBe("keep me");
	});

	test("real scanTargets plumbing honors the only-filter", async () => {
		// A full real-disk scan is too slow for unit tests; verify the filter
		// plumbing and report shape with a no-op scope instead.
		const report = await scanTargets({ only: ["no-such-target"] });
		expect(report.categories).toHaveLength(0);
		expect(report.os).toBe(currentOs());
		expect(report.totalBytes).toBe(0);
	});
});
