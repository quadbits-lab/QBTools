import { describe, expect, test } from "bun:test";
import {
	buildSearchIndex,
	categories,
	editDistance,
	registryPaths,
	tokenize,
	tools,
} from "./index";

const index = buildSearchIndex(tools);

describe("registry", () => {
	test("has 31 tools with unique slugs", () => {
		expect(tools).toHaveLength(31);
		expect(new Set(tools.map((t) => t.slug)).size).toBe(tools.length);
	});

	test("every category has tools and every tool has a known category", () => {
		for (const category of categories) {
			expect(tools.some((t) => t.category === category.id)).toBe(true);
		}
	});

	test("related slugs exist and never point to themselves", () => {
		const slugs = new Set(tools.map((t) => t.slug));
		for (const tool of tools) {
			for (const related of tool.related) {
				expect(slugs.has(related)).toBe(true);
				expect(related).not.toBe(tool.slug);
			}
		}
	});

	test("meta descriptions fit in search results", () => {
		for (const tool of tools) expect(tool.description.length).toBeLessThanOrEqual(170);
	});

	test("every tool has FAQs and 3 how-to steps", () => {
		for (const tool of tools) {
			expect(tool.faqs.length).toBeGreaterThanOrEqual(2);
			expect(tool.howTo).toHaveLength(3);
		}
	});

	test("sitemap paths are unique", () => {
		const paths = registryPaths();
		expect(new Set(paths).size).toBe(paths.length);
	});
});

describe("search", () => {
	test("tokenize splits numbers from units and drops stopwords", () => {
		expect(tokenize("Compress image to 100KB!")).toEqual(["compress", "image", "100", "kb"]);
	});

	test("editDistance", () => {
		expect(editDistance("compres", "compress", 1)).toBe(1);
		expect(editDistance("pdf", "png", 1)).toBe(2);
	});

	test("exact preset query ranks the preset first", () => {
		const [first] = index.search("compress image 100kb");
		expect(first?.href).toBe("/tools/compress-image/to-100kb");
	});

	test("short query finds the tool", () => {
		expect(index.search("merge")[0]?.tool.slug).toBe("merge-pdf");
		expect(index.search("qr")[0]?.tool.slug).toBe("qr-code-generator");
		expect(index.search("emi")[0]?.tool.slug).toBe("emi-calculator");
	});

	test("typos still match", () => {
		expect(index.search("pasword")[0]?.tool.slug).toBe("password-generator");
		expect(index.search("backgrund remove")[0]?.tool.slug).toBe("remove-background");
	});

	test("keywords match: heic", () => {
		expect(index.search("heic")[0]?.href).toBe("/tools/convert-image/heic-to-jpg");
	});

	test("empty or stopword-only query returns nothing", () => {
		expect(index.search("")).toEqual([]);
		expect(index.search("the free online")).toEqual([]);
	});
});
