import { expect, test } from "bun:test";
import { FFmpegSession } from "./media/ffmpeg";
import { extractText } from "./ocr";
import { optimizePdf } from "./pdf/optimize";
import { checkImageSize, LIMITS } from "./processing";

function oversized(size: number) {
	const file = new File([], "oversized.pdf");
	Object.defineProperty(file, "size", { value: size });
	file.arrayBuffer = () => {
		throw new Error("Input should not be read");
	};
	return file;
}
test("optimized image guard checks dimensions before encoder allocation", () => {
	expect(() => checkImageSize(6000, 4000)).not.toThrow();
	expect(() => checkImageSize(6000, 4001)).toThrow("24 megapixels");
});
test("file safeguards reject before reading inputs or loading engines", async () => {
	await expect(new FFmpegSession().probe(oversized(LIMITS.ffmpegBytes + 1))).rejects.toThrow(
		"128 MiB",
	);
	await expect(optimizePdf(oversized(LIMITS.pdfBytes + 1))).rejects.toThrow("100 MiB");
	await expect(extractText(oversized(LIMITS.ocrBytes + 1))).rejects.toThrow("50 MiB");
});
