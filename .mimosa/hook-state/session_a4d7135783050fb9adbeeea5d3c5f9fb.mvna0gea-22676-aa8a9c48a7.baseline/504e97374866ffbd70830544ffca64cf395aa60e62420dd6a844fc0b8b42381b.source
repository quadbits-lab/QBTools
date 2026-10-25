import { expect, test } from "bun:test";
import { formatFromMime, scaleToFit } from "./index";

test("scaleToFit only shrinks and keeps the aspect ratio", () => {
	expect(scaleToFit(800, 600, 2048, 2048)).toEqual({ width: 800, height: 600 });
	expect(scaleToFit(4000, 3000, 2048, 2048)).toEqual({ width: 2048, height: 1536 });
	expect(scaleToFit(1000, 4000, 2048, 2048)).toEqual({ width: 512, height: 2048 });
	expect(scaleToFit(1000, 500, 300)).toEqual({ width: 300, height: 150 });
});

test("formatFromMime", () => {
	expect(formatFromMime("image/png")).toBe("png");
	expect(formatFromMime("image/webp")).toBe("webp");
	expect(formatFromMime("image/heic")).toBe("jpeg");
});
