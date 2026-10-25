declare module "gifenc" {
	export interface GIFEncoderInstance {
		writeFrame(
			index: Uint8Array | number[],
			width: number,
			height: number,
			opts?: {
				palette?: number[][];
				delay?: number;
				transparent?: boolean;
				transparentIndex?: number;
				dispose?: number;
			},
		): void;
		finish(): void;
		bytes(): Uint8Array;
		bytesView(): Uint8Array;
		reset(): void;
	}

	export function GIFEncoder(opts?: {
		initialCapacity?: number;
		auto?: boolean;
	}): GIFEncoderInstance;

	export function quantize(
		rgba: Uint8Array | Uint8ClampedArray | number[],
		maxColors?: number,
		opts?: {
			format?: "rgb565" | "rgb444" | "rgba4444";
			oneBitAlpha?: boolean | number;
			clearAlpha?: boolean;
			clearAlphaThreshold?: number;
			clearAlphaColor?: number;
		},
	): number[][];

	export function applyPalette(
		rgba: Uint8Array | Uint8ClampedArray | number[],
		palette: number[][],
		format?: "rgb565" | "rgb444" | "rgba4444",
	): Uint8Array;
}
