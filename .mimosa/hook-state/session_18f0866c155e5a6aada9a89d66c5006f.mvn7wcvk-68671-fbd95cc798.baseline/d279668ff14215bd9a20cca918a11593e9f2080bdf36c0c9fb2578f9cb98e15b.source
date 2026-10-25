import { expect, test } from "bun:test";
import { LIMITS } from "../processing";
import { computeHashes } from "./hash";

test("hashes exact UTF-8 input and known vectors, including empty input", async () => {
	const hashes = await computeHashes("abc", ["SHA-256", "SHA3-256", "BLAKE3"]);
	expect(hashes["SHA-256"]).toBe(
		"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
	);
	expect(hashes["SHA3-256"]).toBe(
		"3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532",
	);
	expect(hashes.BLAKE3).toBe("6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85");
	expect((await computeHashes(""))["SHA-256"]).toBe(
		"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
	);
	expect((await computeHashes(" "))["SHA-256"]).not.toBe((await computeHashes(""))["SHA-256"]);
});
test("reads one bounded chunk at a time and matches Web Crypto across boundaries", async () => {
	const bytes = new Uint8Array(LIMITS.hashChunkBytes + 17).fill(42);
	const blob = new Blob([bytes]);
	const reads: number[] = [];
	blob.arrayBuffer = () => {
		throw new Error("Full-file reads are forbidden");
	};
	const slice = blob.slice.bind(blob);
	blob.slice = (start, end, type) => {
		reads.push((end ?? blob.size) - (start ?? 0));
		return slice(start, end, type);
	};
	const observed: number[] = [];
	const result = await computeHashes(blob, undefined, {
		onProgress: (p) => {
			if (p.stage === "processing" && p.fraction !== null) observed.push(p.fraction);
		},
	});
	const expected = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)).toHex();
	expect(result["SHA-256"]).toBe(expected);
	expect(reads).toHaveLength(2);
	expect(reads.every((size) => size <= LIMITS.hashChunkBytes)).toBe(true);
	expect(observed.at(-1)).toBe(1);
	expect(observed).toEqual([...observed].sort((a, b) => a - b));
});
test("cancellation rejects without publishing a partial digest", async () => {
	const controller = new AbortController();
	await expect(
		computeHashes(new Blob([new Uint8Array(LIMITS.hashChunkBytes + 2)]), undefined, {
			signal: controller.signal,
			onProgress: (p) => {
				if (p.stage === "processing" && p.fraction && p.fraction < 1) controller.abort();
			},
		}),
	).rejects.toMatchObject({ name: "AbortError" });
});
