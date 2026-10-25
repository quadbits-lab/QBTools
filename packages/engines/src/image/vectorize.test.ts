import { describe, expect, test } from "bun:test";
import { inspectSvg, vectorizeBytes, vectorizeRgba } from "./vectorize";

describe("image vectorizer (VTracer WASM)", () => {
	test("vectorizes raw RGBA bitmap into valid SVG", async () => {
		// 4x4 red square
		const rgba = new Uint8Array(4 * 4 * 4);
		for (let i = 0; i < rgba.length; i += 4) {
			rgba[i] = 255; // R
			rgba[i + 1] = 0; // G
			rgba[i + 2] = 0; // B
			rgba[i + 3] = 255; // A
		}

		const result = await vectorizeRgba(rgba, 4, 4, { mode: "spline" });
		expect(result.svg).toContain("<svg");
		expect(result.svg).toContain("</svg>");
		expect(result.svg.toLowerCase()).toContain("#ff0000");
		expect(result.width).toBe(4);
		expect(result.height).toBe(4);
		expect(result.pathsCount).toBeGreaterThanOrEqual(1);
	});

	test("vectorizes multi-color pixel bitmap with distinct colors", async () => {
		// 4x4 with 2 colors: red top half, blue bottom half
		const rgba = new Uint8Array(4 * 4 * 4);
		for (let y = 0; y < 4; y++) {
			for (let x = 0; x < 4; x++) {
				const idx = (y * 4 + x) * 4;
				if (y < 2) {
					rgba[idx] = 255; // Red
					rgba[idx + 1] = 0;
					rgba[idx + 2] = 0;
					rgba[idx + 3] = 255;
				} else {
					rgba[idx] = 0;
					rgba[idx + 1] = 0;
					rgba[idx + 2] = 255; // Blue
					rgba[idx + 3] = 255;
				}
			}
		}

		const result = await vectorizeRgba(rgba, 4, 4, {
			mode: "polygon",
			filterSpeckle: 0,
		});

		expect(result.svg).toContain("<svg");
		expect(result.pathsCount).toBeGreaterThanOrEqual(2);
		expect(result.colorsCount).toBeGreaterThanOrEqual(2);
	});

	test("inspectSvg extracts dimensions and metrics correctly", () => {
		const sampleSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100" height="200">
			<path d="M0,0 L10,10" fill="#ff0000"/>
			<path d="M20,20 L30,30" fill="#00ff00"/>
			<path d="M40,40 L50,50" fill="none"/>
		</svg>`;

		const metrics = inspectSvg(sampleSvg);
		expect(metrics.width).toBe(100);
		expect(metrics.height).toBe(200);
		expect(metrics.pathsCount).toBe(3);
		expect(metrics.colorsCount).toBe(2);
	});

	test("handles black and white preset with adaptive thresholding", async () => {
		// 4x4 checkered pattern
		const rgba = new Uint8Array(4 * 4 * 4);
		for (let i = 0; i < 16; i++) {
			const val = i % 2 === 0 ? 0 : 255;
			const idx = i * 4;
			rgba[idx] = val;
			rgba[idx + 1] = val;
			rgba[idx + 2] = val;
			rgba[idx + 3] = 255;
		}

		const result = await vectorizeRgba(rgba, 4, 4, {
			preset: "bw",
			filterSpeckle: 0,
		});

		expect(result.svg).toContain("<svg");
		expect(result.pathsCount).toBeGreaterThanOrEqual(1);
	});

	test("vectorizes encoded image bytes", async () => {
		// 1x1 valid PNG
		const pngBase64 =
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
		const bytes = Uint8Array.from(Buffer.from(pngBase64, "base64"));
		const result = await vectorizeBytes(bytes);
		expect(result.svg).toContain("<svg");
		expect(result.svg).toContain("</svg>");
	});
});
