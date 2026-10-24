import { assetBase } from "../assets";
import { checkAbort, LIMITS, type ProcessingOptions, progress } from "../processing";

export type Codec = "gzip" | "deflate" | "brotli" | "zstd";
export interface BenchmarkRow {
	id: string;
	codec: Codec;
	/** Human label such as "Brotli, quality 11". */
	label: string;
	/** File extension for the compressed download. */
	extension: string;
	bytes: number;
	/** Compressed size as a share of the original, 0–1+. */
	ratio: number;
	/** Time to compress, in milliseconds. */
	ms: number;
	/** The result was decompressed and matches the original byte for byte. */
	verified: boolean;
	blob: Blob;
}
interface BrotliModule {
	compress(buf: Uint8Array, options?: { quality?: number }): Uint8Array;
	decompress(buf: Uint8Array): Uint8Array;
}
interface ZstdModule {
	compress(buf: Uint8Array, level?: number): Uint8Array;
	decompress(buf: Uint8Array): Uint8Array;
}
/** Tests supply the codecs directly instead of loading them from /wasm/. */
export const loaders: {
	brotli: () => Promise<BrotliModule>;
	zstd: () => Promise<ZstdModule>;
} = {
	brotli: async () => {
		const base = await assetBase("brotli");
		const lib = (await import(/* @vite-ignore */ `${base}/brotli_wasm.js`)) as BrotliModule & {
			default: (url: string) => Promise<unknown>;
		};
		await lib.default(`${base}/brotli_wasm_bg.wasm`);
		return lib;
	},
	zstd: async () => {
		const lib = await import("@bokuweb/zstd-wasm");
		// The browser build takes the wasm URL; TypeScript resolves the Node typings.
		await (lib.init as (url?: string) => Promise<void>)(`${await assetBase("zstd")}/zstd.wasm`);
		return lib;
	},
};
let brotli: Promise<BrotliModule> | null = null;
let zstd: Promise<ZstdModule> | null = null;
const loadBrotli = () => {
	brotli ??= loaders.brotli().catch((error) => {
		brotli = null;
		throw error;
	});
	return brotli;
};
const loadZstd = () => {
	zstd ??= loaders.zstd().catch((error) => {
		zstd = null;
		throw error;
	});
	return zstd;
};
/** Forget loaded codecs so a test can swap the loaders. */
export function resetCodecs() {
	brotli = null;
	zstd = null;
}
async function viaStream(
	format: "gzip" | "deflate",
	direction: "compress" | "decompress",
	bytes: Uint8Array,
) {
	const stream = new Blob([bytes as BlobPart]).stream();
	const transform =
		direction === "compress" ? new CompressionStream(format) : new DecompressionStream(format);
	return new Uint8Array(await new Response(stream.pipeThrough(transform)).arrayBuffer());
}
interface Case {
	id: string;
	codec: Codec;
	label: string;
	extension: string;
	/** Largest input this case runs on, because high levels are slow. */
	maxBytes?: number;
	compress(bytes: Uint8Array): Promise<Uint8Array>;
	decompress(bytes: Uint8Array): Promise<Uint8Array>;
}
const MIB = 1024 ** 2;
export const CASES: Case[] = [
	{
		id: "gzip",
		codec: "gzip",
		label: "Gzip, browser default",
		extension: "gz",
		compress: (bytes) => viaStream("gzip", "compress", bytes),
		decompress: (bytes) => viaStream("gzip", "decompress", bytes),
	},
	{
		id: "deflate",
		codec: "deflate",
		label: "Deflate (zlib), browser default",
		extension: "zlib",
		compress: (bytes) => viaStream("deflate", "compress", bytes),
		decompress: (bytes) => viaStream("deflate", "decompress", bytes),
	},
	...[5, 9, 11].map(
		(quality): Case => ({
			id: `brotli-${quality}`,
			codec: "brotli",
			label: `Brotli, quality ${quality}`,
			extension: "br",
			maxBytes: quality === 11 ? 8 * MIB : undefined,
			compress: async (bytes) => (await loadBrotli()).compress(bytes, { quality }),
			decompress: async (bytes) => (await loadBrotli()).decompress(bytes),
		}),
	),
	...[3, 10, 19].map(
		(level): Case => ({
			id: `zstd-${level}`,
			codec: "zstd",
			label: `Zstandard, level ${level}`,
			extension: "zst",
			maxBytes: level === 19 ? 16 * MIB : undefined,
			compress: async (bytes) => (await loadZstd()).compress(bytes, level),
			decompress: async (bytes) => (await loadZstd()).decompress(bytes),
		}),
	),
];
const same = (a: Uint8Array, b: Uint8Array) => {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
};
/** Compress one file with every codec and report size, time and a round-trip check. */
export async function benchmarkFile(
	file: File,
	options: ProcessingOptions = {},
): Promise<BenchmarkRow[]> {
	if (file.size === 0) throw new Error("Choose a file with some content in it.");
	if (file.size > LIMITS.benchmarkBytes)
		throw new Error("The benchmark supports files up to 50 MiB.");
	progress(options, "Reading file…", null, "loading");
	const original = new Uint8Array(await file.arrayBuffer());
	const cases = CASES.filter((item) => !item.maxBytes || original.length <= item.maxBytes);
	const rows: BenchmarkRow[] = [];
	for (const [index, item] of cases.entries()) {
		checkAbort(options.signal);
		progress(
			options,
			`${item.label}…`,
			index / cases.length,
			index === 0 ? "loading" : "processing",
		);
		const started = performance.now();
		const packed = await item.compress(original);
		const ms = performance.now() - started;
		checkAbort(options.signal);
		const verified = same(await item.decompress(packed), original);
		rows.push({
			id: item.id,
			codec: item.codec,
			label: item.label,
			extension: item.extension,
			bytes: packed.length,
			ratio: packed.length / original.length,
			ms,
			verified,
			blob: new Blob([packed as BlobPart], { type: "application/octet-stream" }),
		});
	}
	progress(options, "Done", 1);
	return rows;
}
