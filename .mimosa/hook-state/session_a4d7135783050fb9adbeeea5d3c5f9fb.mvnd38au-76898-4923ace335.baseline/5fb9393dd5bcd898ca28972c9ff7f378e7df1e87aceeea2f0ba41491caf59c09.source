/** ICO container writer: PNG-embedded frames (Vista+ format, full transparency). */

export interface IcoFrame {
	size: number;
	/** Encoded PNG bytes for this frame. */
	png: Uint8Array;
}

const HEADER_SIZE = 6;
const ENTRY_SIZE = 16;

/** Build a valid .ico from ordered PNG frames. */
export function buildIco(frames: IcoFrame[]): Uint8Array {
	if (!frames.length) throw new Error("No favicon frames were rendered.");
	const total =
		HEADER_SIZE +
		ENTRY_SIZE * frames.length +
		frames.reduce((sum, frame) => sum + frame.png.byteLength, 0);
	const out = new Uint8Array(total);
	const view = new DataView(out.buffer);
	// ICONDIR: reserved, type 1 (icon), image count.
	view.setUint16(0, 0, true);
	view.setUint16(2, 1, true);
	view.setUint16(4, frames.length, true);
	let offset = HEADER_SIZE + ENTRY_SIZE * frames.length;
	frames.forEach((frame, index) => {
		const entry = HEADER_SIZE + index * ENTRY_SIZE;
		view.setUint8(entry, frame.size === 256 ? 0 : frame.size);
		view.setUint8(entry + 1, frame.size === 256 ? 0 : frame.size);
		view.setUint8(entry + 2, 0); // palette size
		view.setUint8(entry + 3, 0); // reserved
		view.setUint16(entry + 4, 1, true); // color planes
		view.setUint16(entry + 6, 32, true); // bits per pixel
		view.setUint32(entry + 8, frame.png.byteLength, true);
		view.setUint32(entry + 12, offset, true);
		out.set(frame.png, offset);
		offset += frame.png.byteLength;
	});
	return out;
}

/** Validate ICO structure: magic, count and frame offsets within bounds. */
export function validateIco(bytes: Uint8Array): { frames: number; offsets: number[] } | null {
	if (bytes.byteLength < HEADER_SIZE) return null;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1) return null;
	const count = view.getUint16(4, true);
	const offsets: number[] = [];
	for (let i = 0; i < count; i++) {
		const entry = HEADER_SIZE + i * ENTRY_SIZE;
		const dataOffset = view.getUint32(entry + 12, true);
		const size = view.getUint32(entry + 8, true);
		if (dataOffset + size > bytes.byteLength) return null;
		const pngMagic = bytes.slice(dataOffset, dataOffset + 4);
		if (
			pngMagic[0] !== 0x89 ||
			pngMagic[1] !== 0x50 ||
			pngMagic[2] !== 0x4e ||
			pngMagic[3] !== 0x47
		)
			return null;
		offsets.push(dataOffset);
	}
	return { frames: count, offsets };
}
