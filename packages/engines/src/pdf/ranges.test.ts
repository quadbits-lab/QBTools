import { expect, test } from "bun:test";
import { parsePageRanges } from "./ranges";

test("parses mixed ranges", () => {
	expect(parsePageRanges("1-3, 5", 10)).toEqual([0, 1, 2, 4]);
	expect(parsePageRanges("8-", 10)).toEqual([7, 8, 9]);
	expect(parsePageRanges("-2", 10)).toEqual([0, 1]);
	expect(parsePageRanges("3-1", 5)).toEqual([0, 1, 2]);
	expect(parsePageRanges("2 2 2", 5)).toEqual([1]);
});

test("rejects bad input", () => {
	expect(() => parsePageRanges("", 3)).toThrow();
	expect(() => parsePageRanges("abc", 3)).toThrow("isn't a page");
	expect(() => parsePageRanges("4", 3)).toThrow("3 pages");
});
