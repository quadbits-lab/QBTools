import { beforeAll, expect, test } from "bun:test";
import { LIMITS } from "../processing";
import { benchmarkFile, CASES, loaders, resetCodecs } from "./index";

beforeAll(() => {
	loaders.brotli = async () => (await import("brotli-wasm")).default as never;
	loaders.zstd = async () => {
		const lib = await import("@bokuweb/zstd-wasm");
		await lib.init();
		return lib;
	};
	resetCodecs();
});
const text = (repeat: number) =>
	new File(["QBTools makes private, on-device file tools. ".repeat(repeat)], "sample.txt");
test("every codec round-trips and shrinks repetitive text", async () => {
	const file = text(4000);
	const rows = await benchmarkFile(file);
	expect(rows.map((row) => row.id)).toEqual(CASES.map((item) => item.id));
	for (const row of rows) {
		expect(row.verified).toBe(true);
		expect(row.bytes).toBeLessThan(file.size / 10);
		expect(row.ms).toBeGreaterThanOrEqual(0);
		expect(row.blob.size).toBe(row.bytes);
	}
});
test("higher brotli and zstd levels never produce a larger result on this input", async () => {
	const rows = await benchmarkFile(text(4000));
	const size = (id: string) => rows.find((row) => row.id === id)?.bytes ?? Number.NaN;
	expect(size("brotli-11")).toBeLessThanOrEqual(size("brotli-5"));
	expect(size("zstd-19")).toBeLessThanOrEqual(size("zstd-3"));
});
test("incompressible data is reported honestly", async () => {
	const noise = new Uint8Array(200_000);
	for (let i = 0; i < noise.length; i += 65_536)
		crypto.getRandomValues(noise.subarray(i, Math.min(i + 65_536, noise.length)));
	const rows = await benchmarkFile(new File([noise], "noise.bin"));
	expect(rows.every((row) => row.verified)).toBe(true);
	expect(rows.every((row) => row.ratio > 0.95)).toBe(true);
});
test("empty and oversized files are rejected before compressing", async () => {
	await expect(benchmarkFile(new File([], "empty.txt"))).rejects.toThrow("some content");
	const big = new File([], "big.bin");
	Object.defineProperty(big, "size", { value: LIMITS.benchmarkBytes + 1 });
	big.arrayBuffer = () => {
		throw new Error("Input should not be read");
	};
	await expect(benchmarkFile(big)).rejects.toThrow("50 MiB");
});
test("cancelling stops between codecs", async () => {
	const controller = new AbortController();
	controller.abort();
	await expect(benchmarkFile(text(10), { signal: controller.signal })).rejects.toThrow("Cancelled");
});
