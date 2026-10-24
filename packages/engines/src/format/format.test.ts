import { expect, test } from "bun:test";
import { LIMITS } from "../processing";
import { formatCode, friendlyError, languageForFilename, minifyJson } from "./index";

test("formats each language", async () => {
	expect(await formatCode("const a={b:1,c:[1,2]}", { language: "javascript" })).toBe(
		"const a = { b: 1, c: [1, 2] };\n",
	);
	expect(await formatCode("let x:number=1", { language: "typescript" })).toBe(
		"let x: number = 1;\n",
	);
	expect(await formatCode('{"a":1,"b":[1,2]}', { language: "json" })).toBe(
		'{ "a": 1, "b": [1, 2] }\n',
	);
	expect(await formatCode("a{color:red;margin:0}", { language: "css" })).toBe(
		"a {\n  color: red;\n  margin: 0;\n}\n",
	);
	expect(await formatCode("# Title\n\n\n* a\n* b", { language: "markdown" })).toContain("- a");
	expect(await formatCode("a:   1\nb:\n    - x", { language: "yaml" })).toBe("a: 1\nb:\n  - x\n");
	expect(await formatCode("<div><p>Hi</p></div>", { language: "html" })).toContain("<p>Hi</p>");
	expect(await formatCode("select a,b from t where x=1", { language: "sql" })).toBe(
		"SELECT\n  a,\n  b\nFROM\n  t\nWHERE\n  x = 1",
	);
});
test("options change the output", async () => {
	const source = "if(a){b('x')}";
	expect(
		await formatCode(source, { language: "javascript", semicolons: false, singleQuote: true }),
	).toBe("if (a) {\n  b('x')\n}\n");
	expect(await formatCode(source, { language: "javascript", indent: "tabs" })).toContain("\tb(");
	expect(await formatCode(source, { language: "javascript", tabWidth: 4 })).toContain("    b(");
});
test("syntax errors and empty input give one readable line", async () => {
	const error = await formatCode("const = ;", { language: "javascript" }).catch((e) => e as Error);
	expect((error as Error).message).toStartWith("This code couldn't be parsed:");
	expect((error as Error).message).not.toContain("\n");
	await expect(formatCode("  ", { language: "json" })).rejects.toThrow("Paste some code");
	await expect(formatCode("{bad json", { language: "json" })).rejects.toThrow("couldn't be parsed");
});
test("input size is capped", async () => {
	await expect(formatCode("x".repeat(LIMITS.formatChars + 1))).rejects.toThrow("1,000,000");
	expect(() => minifyJson(" ".repeat(LIMITS.formatChars + 1))).toThrow("1,000,000");
});
test("JSON minifies and detects invalid input", () => {
	expect(minifyJson('{\n  "a": 1,\n  "b": [1, 2]\n}')).toBe('{"a":1,"b":[1,2]}');
	expect(() => minifyJson("{nope")).toThrow("couldn't be parsed");
});
test("languages are detected from file names", () => {
	expect(languageForFilename("App.TSX")).toBe("typescript");
	expect(languageForFilename("data.json")).toBe("json");
	expect(languageForFilename("query.SQL")).toBe("sql");
	expect(languageForFilename("README")).toBeNull();
	expect(friendlyError("SyntaxError: Unexpected token (1:5)\n> 1 | x")).toBe(
		"This code couldn't be parsed: Unexpected token (1:5)",
	);
});
