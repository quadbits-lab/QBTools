import { beforeAll, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { MAX_TEXT_LENGTH, useWasmBinaries, WRITE_FORMATS, writeBarcodeImage } from "./index";

const require = createRequire(import.meta.url);
const load = (spec: string) => {
	const bytes = readFileSync(require.resolve(spec));
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};
beforeAll(() => {
	useWasmBinaries({
		reader: load("zxing-wasm/reader/zxing_reader.wasm"),
		writer: load("zxing-wasm/writer/zxing_writer.wasm"),
	});
});
test("every offered format creates a PNG and an SVG", async () => {
	const samples: Record<string, string> = {
		EAN13: "5901234123457",
		EAN8: "96385074",
		UPCA: "036000291452",
		ITF: "12345678",
		Code39: "HELLO-123",
	};
	for (const { value } of WRITE_FORMATS) {
		const image = await writeBarcodeImage(samples[value] ?? "QBTools 2026", { format: value });
		const head = new Uint8Array(await image.png.slice(0, 8).arrayBuffer());
		expect(Array.from(head.slice(1, 4))).toEqual([0x50, 0x4e, 0x47]);
		expect(image.svg).toContain("<svg");
	}
});
test("invalid input gives a readable error instead of a broken image", async () => {
	await expect(writeBarcodeImage("not digits", { format: "EAN13" })).rejects.toThrow(
		"can't be encoded",
	);
	await expect(writeBarcodeImage("   ", { format: "QRCode" })).rejects.toThrow("Type the text");
	await expect(
		writeBarcodeImage("x".repeat(MAX_TEXT_LENGTH + 1), { format: "QRCode" }),
	).rejects.toThrow("characters or fewer");
});
test("larger scale makes a larger image", async () => {
	const small = await writeBarcodeImage("QBTools", { format: "QRCode", scale: 2 });
	const large = await writeBarcodeImage("QBTools", { format: "QRCode", scale: 8 });
	expect(large.png.size).toBeGreaterThan(small.png.size);
});
