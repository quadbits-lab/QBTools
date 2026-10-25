/**
 * Apple ICNS container writer. Modern ICNS files wrap PNG-encoded images in
 * typed chunks (supported by macOS 10.7+); sizes below cover every slot an
 * asset catalog would generate via iconutil.
 */

export interface IcnsEntry {
	/** Four-character chunk type, e.g. "ic10". */
	type: string;
	png: Uint8Array;
}

/** Chunk types by pixel size — 256/512 px appear twice (1x and 2x slots). */
export const ICNS_ENTRIES: Array<{ type: string; size: number }> = [
	{ type: "ic11", size: 32 },
	{ type: "ic12", size: 64 },
	{ type: "ic07", size: 128 },
	{ type: "ic13", size: 256 },
	{ type: "ic08", size: 256 },
	{ type: "ic14", size: 512 },
	{ type: "ic09", size: 512 },
	{ type: "ic10", size: 1024 },
];

const MAGIC = 0x69636e73; // "icns"

/** Pack PNG renders into a valid .icns byte stream. */
export function buildIcns(entries: IcnsEntry[]): Uint8Array {
	const total = 8 + entries.reduce((n, e) => n + 8 + e.png.length, 0);
	const out = new Uint8Array(total);
	const view = new DataView(out.buffer);
	view.setUint32(0, MAGIC, false);
	view.setUint32(4, total, false);
	let offset = 8;
	for (const entry of entries) {
		if (entry.type.length !== 4) throw new Error("ICNS chunk types must be 4 characters.");
		for (let i = 0; i < 4; i++) out[offset + i] = entry.type.charCodeAt(i) ?? 0;
		view.setUint32(offset + 4, 8 + entry.png.length, false);
		out.set(entry.png, offset + 8);
		offset += 8 + entry.png.length;
	}
	return out;
}

/** Quick structural validation for tests and callers. */
export function icnsChunkTypes(bytes: Uint8Array): string[] {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (bytes.byteLength < 8 || view.getUint32(0, false) !== MAGIC) return [];
	const total = view.getUint32(4, false);
	if (total !== bytes.byteLength) return [];
	const types: string[] = [];
	let offset = 8;
	while (offset + 8 <= bytes.byteLength) {
		const length = view.getUint32(offset + 4, false);
		if (length < 8 || offset + length > bytes.byteLength) return [];
		types.push(String.fromCharCode(...bytes.subarray(offset, offset + 4)));
		offset += length;
	}
	return types;
}
