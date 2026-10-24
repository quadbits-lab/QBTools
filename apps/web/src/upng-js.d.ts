declare module "upng-js" {
	const UPNG: {
		encode(
			buffers: ArrayBuffer[],
			width: number,
			height: number,
			cnum: number,
			dels?: number[],
			pals?: unknown,
			format?: unknown,
		): ArrayBuffer;
		decode(buffer: ArrayBuffer): {
			width: number;
			height: number;
			depth: number;
			ctype: number;
			bpp: number;
			frames: unknown[];
			tabs: Record<string, unknown>;
			data: Uint8Array;
		};
		toRGBA8(image: ReturnType<typeof UPNG.decode>): ArrayBuffer[];
	};
	export default UPNG;
}
