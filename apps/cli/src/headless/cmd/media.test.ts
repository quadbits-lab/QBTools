/**
 * Media command tests with a mocked /api/media/* surface (no server).
 */

import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runHeadless } from "../run";

const savedEnv = { ...process.env };
let dir = "";
let calls: Array<{ url: string; method?: string; body?: unknown }> = [];
const originalFetch = globalThis.fetch;

async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	const url = String(input instanceof Request ? input.url : input);
	calls.push({ url, method: init?.method, body: init?.body });
	if (url.includes("/api/media/list")) {
		return Response.json({
			assets: [
				{
					id: "11111111-2222-3333-4444-555555555555",
					name: "hero.png",
					mime: "image/png",
					bytes: 2048,
					source_tool: null,
					created_at: "2026-10-25T00:00:00Z",
				},
			],
			more: false,
		});
	}
	if (url.endsWith("/api/media/uploads") && init?.method === "POST") {
		return Response.json(
			{ id: "abcdefab-2222-3333-4444-555555555555", state: "reserved" },
			{ status: 201 },
		);
	}
	if (url.endsWith("/content") && init?.method === "PUT") {
		return Response.json({ ok: true });
	}
	if (url.includes("/complete")) {
		return Response.json({ id: "abcdefab-2222-3333-4444-555555555555", name: "hero.png" });
	}
	if (url.endsWith("/content")) {
		return new Response(new Uint8Array([1, 2, 3]), {
			headers: { "Content-Type": "image/png" },
		});
	}
	return Response.json({ error: "NOT_FOUND" }, { status: 404 });
}

function setup(signedIn: boolean): void {
	dir = join(tmpdir(), `qbtools-media-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(dir, { recursive: true });
	process.env.QBTOOLS_CONFIG_DIR = dir;
	process.env.QBTOOLS_NO_UPDATE_CHECK = "1";
	calls = [];
	if (signedIn) {
		writeFileSync(
			join(dir, "auth.json"),
			JSON.stringify({
				version: 1,
				kind: "token",
				token: "qbk_test-token-value-0001",
				savedAt: new Date().toISOString(),
			}),
		);
	}
	globalThis.fetch = mockFetch as typeof globalThis.fetch;
}

afterEach(async () => {
	globalThis.fetch = originalFetch;
	for (const key of Object.keys(process.env)) {
		if (!(key in savedEnv)) delete process.env[key];
	}
	Object.assign(process.env, savedEnv);
	if (dir) await rm(dir, { recursive: true, force: true });
	dir = "";
});

describe("media command", () => {
	test("requires sign-in when no credentials stored", async () => {
		setup(false);
		const err: string[] = [];
		const code = await runHeadless(["media", "list"], {
			out: () => {},
			err: (line) => err.push(line ?? ""),
		});
		expect(code).toBe(2);
		expect(err.join("\n")).toContain("qbtools login --api-key");
	});

	test("list renders a table from the server payload", async () => {
		setup(true);
		const out: string[] = [];
		const code = await runHeadless(["media", "list"], {
			out: (line) => out.push(line ?? ""),
			err: () => {},
		});
		expect(code).toBe(0);
		const text = out.join("\n");
		expect(text).toContain("hero.png");
		expect(text).toContain("2.0 KiB");
	});

	test("get downloads content to the output dir", async () => {
		setup(true);
		const out: string[] = [];
		const code = await runHeadless(
			["media", "get", "11111111-2222-3333-4444-555555555555", "--out", join(dir, "dl")],
			{ out: (line) => out.push(line ?? ""), err: () => {} },
		);
		expect(code).toBe(0);
		const saved = out.join("\n").split("→ ")[1] ?? "";
		expect([...readFileSync(saved)]).toEqual([1, 2, 3]);
	});

	test("put runs reserve → content → complete", async () => {
		setup(true);
		const input = join(dir, "upload.txt");
		writeFileSync(input, "media payload");
		const out: string[] = [];
		const code = await runHeadless(["media", "put", input], {
			out: (line) => out.push(line ?? ""),
			err: () => {},
		});
		expect(code).toBe(0);
		const urls = calls.map((call) => call.url);
		expect(urls.some((url) => url.includes("/api/media/uploads"))).toBeTrue();
		expect(urls.some((url) => url.includes("/content"))).toBeTrue();
		expect(urls.some((url) => url.includes("/complete"))).toBeTrue();
		expect(out.join("\n")).toContain("Uploaded as hero.png");
	});
});
