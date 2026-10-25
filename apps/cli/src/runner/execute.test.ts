import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "../headless/args";
import { executeRunner, primaryStdoutPayload } from "../headless/cmd/run";
import type { CommandIO } from "../headless/command";

const SILENT_IO: CommandIO = { out: () => {}, err: () => {} };

async function tempConfigDir(): Promise<string> {
	return mkdtemp(join(tmpdir(), "qbtools-cli-test-"));
}

const savedEnv = { ...process.env };

afterEach(async () => {
	// Reset env between tests so QBTOOLS_CONFIG_DIR doesn't leak state.
	for (const key of Object.keys(process.env)) {
		if (!(key in savedEnv)) delete process.env[key];
	}
	Object.assign(process.env, savedEnv);
});

describe("executeRunner", () => {
	test("word-counter counts text", async () => {
		const { code, result } = await executeRunner(
			"word-counter",
			parseArgs(["word-counter", "--text", "one two three four five"]),
			{ io: SILENT_IO },
		);
		expect(code).toBe(0);
		expect(result?.summary).toContain("5 words");
	});

	test("unknown slug exits 1", async () => {
		const { code } = await executeRunner("not-a-tool", parseArgs(["not-a-tool"]), {
			io: SILENT_IO,
		});
		expect(code).toBe(1);
	});

	test("web-only slug exits with the unavailable code and a hint", async () => {
		const errLines: string[] = [];
		const { code } = await executeRunner("redact-pdf", parseArgs(["redact-pdf"]), {
			io: { out: () => {}, err: (line) => errLines.push(line ?? "") },
		});
		expect(code).toBe(2);
		expect(errLines.join("\n")).toContain("qbtools open redact-pdf");
	});

	test("case converter uppercases", async () => {
		const { result } = await executeRunner(
			"case-converter",
			parseArgs(["case-converter", "--text", "hello world", "--mode", "upper"]),
			{ io: SILENT_IO },
		);
		expect(result?.outputs[0]).toEqual({ type: "text", text: "HELLO WORLD" });
	});

	test("hash generator hashes a file", async () => {
		const dir = await tempConfigDir();
		const input = join(dir, "input.txt");
		await Bun.write(input, "qbtools");
		const { code, result } = await executeRunner(
			"hash-generator",
			parseArgs(["hash-generator", "--in", input, "--algorithms", "SHA-256"]),
			{ io: SILENT_IO },
		);
		expect(code).toBe(0);
		const expected = new Bun.CryptoHasher("sha256").update("qbtools").digest("hex");
		expect(JSON.stringify(result?.data)).toContain(expected);
		await rm(dir, { recursive: true, force: true });
	});

	test("password generator honors defaults without flags", async () => {
		const { code, result } = await executeRunner(
			"password-generator",
			parseArgs(["password-generator"]),
			{
				io: SILENT_IO,
			},
		);
		expect(code).toBe(0);
		const data = result?.data as { passwords: string[] };
		expect(data.passwords.length).toBe(1);
		expect(data.passwords[0]?.length).toBe(16);
	});

	test("qr generator writes a PNG to the output dir", async () => {
		const dir = await tempConfigDir();
		process.env.QBTOOLS_CONFIG_DIR = dir;
		const { code, result } = await executeRunner(
			"qr-code-generator",
			parseArgs(["qr-code-generator", "--text", "hello", "--outdir", join(dir, "out")]),
			{ io: SILENT_IO },
		);
		expect(code).toBe(0);
		const path = (result?.data as { path: string }).path;
		const bytes = await readFile(path);
		// PNG signature
		expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
		await rm(dir, { recursive: true, force: true });
	});

	test("--stdout payload picks bytes before text", () => {
		const imagePayload = primaryStdoutPayload({
			summary: "",
			outputs: [
				{ type: "text", text: "summary line" },
				{
					type: "image",
					bytes: new Uint8Array([1, 2, 3]),
					mimeType: "image/png",
					suggestedName: "x.png",
				},
			],
		});
		expect(imagePayload?.bytes).toEqual(new Uint8Array([1, 2, 3]));
		const textPayload = primaryStdoutPayload({
			summary: "",
			outputs: [{ type: "code", text: "formatted();" }],
		});
		expect(textPayload?.text).toBe("formatted();");
		const none = primaryStdoutPayload({ summary: "", outputs: [] });
		expect(none).toBeNull();
	});

	test("cancellation via aborted signal surfaces as an error exit", async () => {
		const { code } = await executeRunner(
			"merge-pdf",
			parseArgs(["merge-pdf", "--in", "/does/not/exist.pdf"]),
			{ io: SILENT_IO },
		);
		expect(code).toBe(1);
	});
});
