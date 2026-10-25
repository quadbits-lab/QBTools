import { applyPalette, GIFEncoder, quantize } from "gifenc";
export interface GifFrame {
	data: Uint8ClampedArray;
	width: number;
	height: number;
	delay: number;
}
/** Kept in the engine package so its codec dependency is bundled in production workers. */
export class GifSession {
	private encoder = GIFEncoder();
	addFrame(frame: GifFrame) {
		const palette = quantize(frame.data, 256);
		const index = applyPalette(frame.data, palette);
		this.encoder.writeFrame(index, frame.width, frame.height, { palette, delay: frame.delay });
	}
	finish(): Blob {
		this.encoder.finish();
		return new Blob([this.encoder.bytes() as BlobPart], { type: "image/gif" });
	}
}
