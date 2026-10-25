import { describe, expect, test } from "bun:test";
import { tools } from "@qbtools/registry";
import { availabilityFor, RUNNERS, WEB_ONLY_TOOLS } from "./map";
import { CLI_GRAPHIC_ASSETS } from "./graphic-assets";

describe("runner coverage parity", () => {
	test("every registry slug resolves to a runner or an explicit web-only entry", () => {
		const registrySlugs = tools.map((tool) => tool.slug);
		expect(registrySlugs.length).toBeGreaterThan(0);
		for (const slug of registrySlugs) {
			const covered = RUNNERS.has(slug) || WEB_ONLY_TOOLS.has(slug);
			expect(covered).toBeTrue();
		}
	});

	test("runners map 1:1 to registry slugs (no orphans, no duplicates)", () => {
		const registrySlugs = new Set(tools.map((tool) => tool.slug));
		for (const slug of RUNNERS.keys()) {
			expect(registrySlugs.has(slug)).toBeTrue();
		}
	});

	test("web-only tools never have a runner", () => {
		for (const slug of WEB_ONLY_TOOLS) {
			expect(RUNNERS.has(slug)).toBeFalse();
		}
	});

	test("web-only count matches the plan (5 browser-bound tools)", () => {
		expect(WEB_ONLY_TOOLS.size).toBe(5);
	});

	test("availability labels exist for every availability class", async () => {
		const { AVAILABILITY_LABELS } = await import("./map");
		for (const slug of tools.map((tool) => tool.slug)) {
			const availability = availabilityFor(slug);
			expect(AVAILABILITY_LABELS[availability]).toBeString();
		}
	});
});

describe("graphic assets", () => {
	test("every font URL resolves to a real file", async () => {
		expect(CLI_GRAPHIC_ASSETS.fontUrls).toBeDefined();
		for (const url of Object.values(CLI_GRAPHIC_ASSETS.fontUrls ?? {})) {
			const response = await fetch(url);
			expect(response.ok).toBeTrue();
		}
	});

	test("resvg wasmUrl points at a file:// wasm binary", () => {
		expect(CLI_GRAPHIC_ASSETS.wasmUrl?.startsWith("file://")).toBeTrue();
	});
});
