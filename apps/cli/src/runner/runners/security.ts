/** Security runners: hashing, file encryption, text encryption. */

import type { DigestAlgorithm } from "@qbtools/engines/hash";
import { files, requireString, str, type ToolRunner } from "../types";
import { formatBytes, writeOutput } from "../files";

export const hashGenerator: ToolRunner = {
	slug: "hash-generator",
	availability: "local",
	fields: [
		{ name: "text", label: "Text to hash", kind: "textarea" },
		{ name: "in", label: "File to hash instead", kind: "file" },
		{
			name: "algorithms",
			label: "Algorithms (comma separated)",
			kind: "text",
			default: "SHA-256,SHA-512,SHA-1",
			help: "Any of SHA-256, SHA-512, SHA-1, BLAKE3, SHA3-256",
		},
	],
	async run({ values, onProgress, signal }) {
		const { computeHashes, HASH_ALGORITHMS, DEFAULT_HASH_ALGORITHMS } = await import(
			"@qbtools/engines/hash"
		);
		const requested = str(values, "algorithms")
			.split(",")
			.map((part) => part.trim())
			.filter(Boolean) as DigestAlgorithm[];
		const invalid = requested.filter((name) => !HASH_ALGORITHMS.includes(name));
		if (invalid.length)
			throw new Error(`Unknown algorithms: ${invalid.join(", ")}. Valid: ${HASH_ALGORITHMS.join(", ")}`);
		const algorithms = requested.length ? requested : DEFAULT_HASH_ALGORITHMS;
		const [input] = files(values, "in");
		const source = input ?? str(values, "text").trim();
		if (!source) throw new Error("Provide text via --text or a file via --in.");
		const hashes = await computeHashes(input ?? source, algorithms, { onProgress, signal });
		const label = input ? input.name : "text input";
		return {
			summary: Object.entries(hashes)
				.map(([algorithm, digest]) => `${algorithm} ${digest?.slice(0, 12)}…`)
				.join(" · "),
			outputs: [
				{ type: "text", text: `Source: ${label}` },
				{
					type: "table",
					columns: ["Algorithm", "Digest (hex)"],
					rows: Object.entries(hashes).map(([algorithm, digest]) => [algorithm, digest ?? ""]),
				},
			],
			data: hashes,
		};
	},
};

export const fileEncryptor: ToolRunner = {
	slug: "file-encryptor",
	availability: "local",
	fields: [
		{ name: "in", label: "File", kind: "file", required: true },
		{ name: "password", label: "Password", kind: "text", required: true },
		{
			name: "mode",
			label: "Action",
			kind: "select",
			default: "encrypt",
			options: [
				{ label: "Encrypt", value: "encrypt" },
				{ label: "Decrypt (.enc)", value: "decrypt" },
			],
		},
	],
	async run({ values, outDir, outPath, onProgress }) {
		const { encryptFile, decryptFile } = await import("@qbtools/engines/crypto");
		const [input] = files(values, "in");
		if (!input) throw new Error("Provide a file via --in <file>.");
		const password = requireString(values, "password", "password");
		if (str(values, "mode", "encrypt") === "decrypt") {
			const result = await decryptFile(input, password, (fraction) =>
				onProgress?.({ stage: "processing", fraction, label: "Decrypting…" }),
			);
			const saved = await writeOutput(
				{ outDir, outPath, suggestedName: result.filename || "decrypted.bin" },
				new Uint8Array(await result.blob.arrayBuffer()),
			);
			return {
				summary: `Decrypted → ${saved.path}`,
				outputs: [],
				data: { path: saved.path, originalType: result.type },
			};
		}
		const result = await encryptFile(input, password, (fraction) =>
			onProgress?.({ stage: "processing", fraction, label: "Encrypting…" }),
		);
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: result.filename },
			new Uint8Array(await result.blob.arrayBuffer()),
		);
		return {
			summary: `Encrypted ${formatBytes(result.originalSize)} → ${saved.path}`,
			outputs: [],
			data: { path: saved.path },
		};
	},
};

export const textEncryptor: ToolRunner = {
	slug: "text-encryptor",
	availability: "local",
	stdinField: "text",
	fields: [
		{ name: "text", label: "Text", kind: "textarea", required: true },
		{ name: "password", label: "Password", kind: "text", required: true },
		{
			name: "mode",
			label: "Action",
			kind: "select",
			default: "encrypt",
			options: [
				{ label: "Encrypt", value: "encrypt" },
				{ label: "Decrypt", value: "decrypt" },
			],
		},
	],
	async run({ values }) {
		const { encryptText, decryptText } = await import("@qbtools/engines/crypto");
		const password = requireString(values, "password", "password");
		const text = requireString(values, "text", "text");
		const result =
			str(values, "mode", "encrypt") === "decrypt"
				? await decryptText(text, password)
				: await encryptText(text, password);
		return {
			summary: str(values, "mode", "encrypt") === "decrypt" ? "Decrypted text" : "Encrypted ciphertext",
			outputs: [{ type: "code", text: result }],
			data: { result },
		};
	},
};

export const securityRunners: ToolRunner[] = [hashGenerator, fileEncryptor, textEncryptor];
