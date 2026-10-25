import { describe, expect, test } from "bun:test";
import { getAll, getBool, getString, parseArgs } from "./args";

describe("parseArgs", () => {
	test("collects positional tokens in order", () => {
		const parsed = parseArgs(["a", "--flag", "value", "b"]);
		expect(parsed.positional).toEqual(["a", "b"]);
		expect(parsed.flags.get("flag")).toBe("value");
	});

	test("boolean flag", () => {
		const parsed = parseArgs(["--json"]);
		expect(parsed.flags.get("json")).toBe(true);
	});

	test("--flag=value form", () => {
		const parsed = parseArgs(["--out=merged.pdf"]);
		expect(parsed.flags.get("out")).toBe("merged.pdf");
	});

	test("flag consumes following value unless it is another flag", () => {
		const parsed = parseArgs(["--text", "--json"]);
		expect(parsed.flags.get("text")).toBe(true);
		expect(parsed.flags.get("json")).toBe(true);
	});

	test("repeated flags collect into arrays", () => {
		const parsed = parseArgs(["--in", "a.pdf", "--in", "b.pdf", "--in=c.pdf"]);
		expect(parsed.flags.get("in")).toEqual(["a.pdf", "b.pdf", "c.pdf"]);
	});

	test("double dash stops flag parsing", () => {
		const parsed = parseArgs(["--", "--not-a-flag", "positional"]);
		expect(parsed.positional).toEqual(["--not-a-flag", "positional"]);
		expect(parsed.flags.size).toBe(0);
	});

	test("negative numbers still count as values", () => {
		const parsed = parseArgs(["--delta", "-5"]);
		expect(parsed.flags.get("delta")).toBe("-5");
	});
});

describe("accessors", () => {
	test("getString returns last value of a repeated flag", () => {
		const parsed = parseArgs(["--out", "one.bin", "--out", "two.bin"]);
		expect(getString(parsed, "out")).toBe("two.bin");
	});

	test("getString is undefined for boolean flags", () => {
		const parsed = parseArgs(["--json"]);
		expect(getString(parsed, "json")).toBeUndefined();
	});

	test("getAll returns [] when flag missing or boolean", () => {
		expect(getAll(parseArgs([]), "in")).toEqual([]);
		expect(getAll(parseArgs(["--in"]), "in")).toEqual([]);
	});

	test("getBool parses explicit false", () => {
		expect(getBool(parseArgs(["--color=false"]), "color")).toBeFalse();
		expect(getBool(parseArgs(["--color"]), "color")).toBeTrue();
		expect(getBool(parseArgs([]), "color")).toBeFalse();
	});
});
