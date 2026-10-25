import { expect, test } from "bun:test";
import { encodeImage } from "./codecs";

test("explicit Fast image encoding uses native canvas without loading WASM", async () => {
	const previous = globalThis.OffscreenCanvas;
	let savedType = "";
	class Canvas {
		getContext() {
			return { putImageData: () => {} };
		}
		async convertToBlob(options: { type: string }) {
			savedType = options.type;
			return new Blob(["native"], { type: options.type });
		}
	}
	globalThis.OffscreenCanvas = Canvas as unknown as typeof OffscreenCanvas;
	try {
		const result = await encodeImage(
			{ width: 1, height: 1, data: new Uint8ClampedArray(4) } as ImageData,
			{ mode: "fast", format: "webp" },
		);
		expect(savedType).toBe("image/webp");
		expect(result.type).toBe("image/webp");
	} finally {
		globalThis.OffscreenCanvas = previous;
	}
});
