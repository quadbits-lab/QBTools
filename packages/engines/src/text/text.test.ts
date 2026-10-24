import { describe, expect, test } from "bun:test";
import { convertCase, formatDuration, textStats } from "./index";

describe("textStats", () => {
	test("counts", () => {
		const stats = textStats("Hello world. It's a test!\n\nSecond paragraph here?");
		expect(stats.words).toBe(8);
		expect(stats.sentences).toBe(3);
		expect(stats.paragraphs).toBe(2);
		expect(stats.characters).toBe(49);
		expect(stats.longestWord).toBe("paragraph");
	});

	test("empty text", () => {
		const stats = textStats("   ");
		expect(stats).toMatchObject({ words: 0, sentences: 0, paragraphs: 0 });
	});

	test("keywords ignore stopwords and singletons", () => {
		const stats = textStats("Image tools compress image files. The image is small. Tools rock.");
		expect(stats.topKeywords[0]).toMatchObject({ word: "image", count: 3 });
		expect(stats.topKeywords.map((k) => k.word)).toEqual(["image", "tools"]);
	});

	test("emoji counts as one character", () => {
		expect(textStats("hi 👋").characters).toBe(4);
	});

	test("formatDuration", () => {
		expect(formatDuration(0)).toBe("0 sec");
		expect(formatDuration(0.5)).toBe("30 sec");
		expect(formatDuration(3 + 1 / 3)).toBe("3 min 20 sec");
	});
});

describe("convertCase", () => {
	const input = "the lord of the rings: the return of the king";
	test("title keeps minor words lowercase except first and after colon", () => {
		expect(convertCase(input, "title")).toBe("The Lord of the Rings: The Return of the King");
	});
	test("sentence", () => {
		expect(convertCase("HELLO WORLD. i am HERE! ok", "sentence")).toBe(
			"Hello world. I am here! Ok",
		);
	});
	test("capitalized", () => {
		expect(convertCase("don't stop me", "capitalized")).toBe("Don't Stop Me");
	});
	test("identifier cases", () => {
		expect(convertCase("Hello world_fooBar", "camel")).toBe("helloWorldFooBar");
		expect(convertCase("hello world", "pascal")).toBe("HelloWorld");
		expect(convertCase("helloWorld HTTPServer", "snake")).toBe("hello_world_http_server");
		expect(convertCase("Hello World", "kebab")).toBe("hello-world");
		expect(convertCase("hello world", "constant")).toBe("HELLO_WORLD");
	});
	test("alternating and inverse", () => {
		expect(convertCase("hello world", "alternating")).toBe("hElLo WoRlD");
		expect(convertCase("Hello", "inverse")).toBe("hELLO");
	});
});
