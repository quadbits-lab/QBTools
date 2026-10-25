import { checkAbort, LIMITS, type ProcessingOptions, progress } from "../processing";
export const HASH_ALGORITHMS = ["SHA-256", "SHA-512", "SHA-1", "BLAKE3", "SHA3-256"] as const;
export type DigestAlgorithm = (typeof HASH_ALGORITHMS)[number];
export const DEFAULT_HASH_ALGORITHMS: DigestAlgorithm[] = ["SHA-256", "SHA-512", "SHA-1"];
export type Hashes = Partial<Record<DigestAlgorithm, string>>;
export async function computeHashes(
	input: Blob | string,
	algorithms: readonly DigestAlgorithm[] = DEFAULT_HASH_ALGORITHMS,
	options: ProcessingOptions = {},
): Promise<Hashes> {
	checkAbort(options.signal);
	progress(options, "Loading hash engine…", null, "loading");
	const { createSHA256, createSHA512, createSHA1, createBLAKE3, createSHA3 } = await import(
		"hash-wasm"
	);
	const factories = {
		"SHA-256": createSHA256,
		"SHA-512": createSHA512,
		"SHA-1": createSHA1,
		BLAKE3: () => createBLAKE3(256),
		"SHA3-256": () => createSHA3(256),
	};
	const selected = [...new Set(algorithms)];
	const hashers = await Promise.all(selected.map((algorithm) => factories[algorithm]()));
	for (const hasher of hashers) hasher.init();
	const file = typeof input === "string" ? new Blob([new TextEncoder().encode(input)]) : input;
	progress(options, "Hashing file", 0);
	for (let offset = 0; offset < file.size; offset += LIMITS.hashChunkBytes) {
		checkAbort(options.signal);
		const chunk = new Uint8Array(
			await file.slice(offset, offset + LIMITS.hashChunkBytes).arrayBuffer(),
		);
		checkAbort(options.signal);
		for (const hasher of hashers) hasher.update(chunk);
		progress(options, "Hashing file", Math.min(1, (offset + chunk.length) / file.size));
	}
	checkAbort(options.signal);
	const result: Hashes = {};
	for (const [i, algorithm] of selected.entries()) result[algorithm] = hashers[i]?.digest("hex");
	progress(options, "Hashes ready", 1);
	return result;
}
