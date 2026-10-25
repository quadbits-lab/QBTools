declare module "gifenc" {
	export interface GIFEncoderOptions {
		auto?: boolean;
		initialCapacity?: number;
	}

	export interface WriteFrameOptions {
		palette?: number[][];
		delay?: number;
		repeat?: number;
		dispose?: number;
		transparent?: boolean;
		transparentIndex?: number;
	}

	export interface GIFEncoderInstance {
		writeFrame(
			index: Uint8Array | number[],
			width: number,
			height: number,
			options?: WriteFrameOptions,
		): void;
		finish(): void;
		bytes(): Uint8Array;
		bytesView(): Uint8Array;
		reset(): void;
	}

	export function GIFEncoder(options?: GIFEncoderOptions): GIFEncoderInstance;
	export function quantize(rgba: Uint8ClampedArray | Uint8Array, maxColors?: number): number[][];
	export function applyPalette(
		rgba: Uint8ClampedArray | Uint8Array,
		palette: number[][],
		format?: string,
	): Uint8Array;
}
