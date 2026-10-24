import { describe, expect, test } from "bun:test";
import { generateAppIconSet, iosLegacySlots, monochromePixels } from "./appicon";
import {
	backgroundFill,
	badgeLayer,
	composeIconSvg,
	composeOgSvg,
	escapeXml,
	svgDataUrl,
	textLayer,
	vectorNestedLayer,
	wrapTextLines,
} from "./compose";
import { defaultIconDesign, defaultOgDesign } from "./defaults";
import { generateFaviconSet } from "./favicon";
import { buildIco, validateIco } from "./ico";
import { parseDesign, projectFileName, QBDESIGN_VERSION, serializeDesign } from "./projects";
import type { ArtworkData, DesignProject, IconDesign, OgDesign } from "./types";

const repoRoot = `${import.meta.dir}/../../../..`;
const TEST_ASSETS = {
	fontUrls: {
		"inter-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2`,
		"inter-700": `file://${repoRoot}/apps/web/node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2`,
		"anton-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2`,
		"dmmono-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2`,
		"dmmono-500": `file://${repoRoot}/apps/web/node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2`,
	},
	pathFontUrls: {
		"inter-700": `file://${repoRoot}/apps/web/node_modules/@fontsource/inter/files/inter-latin-700-normal.woff`,
	},
	wasmUrl: `file://${Bun.resolveSync("@resvg/resvg-wasm/index_bg.wasm", import.meta.dir)}`,
};

/** Narrow a possibly-missing generated file with a clear failure. */
function must<T>(value: T | null | undefined, label: string): T {
	if (value == null) throw new Error(`${label} missing from the generated set`);
	return value;
}

describe("ico", () => {
	test("round-trips frames with valid offsets", () => {
		const frame = (n: number, _size: number) =>
			new Uint8Array(n).map((_, i) => i % 255) &&
			new Uint8Array([
				0x89,
				0x50,
				0x4e,
				0x47,
				0x0d,
				0x0a,
				0x1a,
				0x0a,
				...crypto.getRandomValues(new Uint8Array(n - 8)),
			]);
		const bytes = buildIco([
			{ size: 16, png: frame(20, 16) },
			{ size: 32, png: frame(30, 32) },
			{ size: 48, png: frame(40, 48) },
		]);
		const view = new DataView(bytes.buffer);
		expect(view.getUint16(0, true)).toBe(0);
		expect(view.getUint16(2, true)).toBe(1);
		expect(view.getUint16(4, true)).toBe(3);
		const validated = validateIco(bytes);
		expect(validated).not.toBeNull();
		expect(validated?.frames).toBe(3);
		expect(validated?.offsets[0]).toBe(6 + 3 * 16);
		// Entry fields: 32BPP, one plane.
		expect(view.getUint16(6 + 4, true)).toBe(1);
		expect(view.getUint16(6 + 6, true)).toBe(32);
	});

	test("rejects truncated ICO", () => {
		expect(validateIco(new Uint8Array([1, 2, 3, 4]))).toBeNull();
	});
});

describe("compose", () => {
	test("escapes XML entities", () => {
		expect(escapeXml("<b>")).toBe("&lt;b&gt;");
		expect(escapeXml("&\"'")).toBe("&amp;&quot;&#39;");
	});

	test("wraps long lines by words", () => {
		const lines = wrapTextLines("the quick brown fox jumps", "Inter", 700, 40, 200);
		expect(lines.length).toBeGreaterThan(1);
		const joined = lines.join(" ");
		expect(joined).toContain("quick");
	});

	test("background fills resolve gradient ids", () => {
		const defs: import("./compose").GradientDef[] = [];
		const fill = backgroundFill({ type: "gradient", from: "#111", to: "#222", angle: 180 }, defs);
		expect(fill).toBe("url(#bg-0)");
		expect(defs).toHaveLength(1);
	});

	test("text layer contains tspan lines and family", () => {
		const style = {
			text: "Hello\nWorld",
			font: "Inter" as const,
			size: 48,
			color: "#fff",
			fontWeight: 700,
			letterSpacing: 0,
			lineHeight: 1.2,
			align: "left" as const,
			x: 0,
			y: 0.2,
			width: 0.8,
		};
		const svg = textLayer(style, { x: 0, y: 0, w: 1000, h: 500 });
		expect(svg).toContain("font-family=");
		expect(svg).toContain("tspan");
		expect((svg.match(/tspan/g) ?? []).length).toBeGreaterThanOrEqual(2);
	});

	test("badge layer sizes pill shape", () => {
		const svg = badgeLayer(
			{ text: "NEW", color: "#fff", bg: "#e11", shape: "pill", size: 40, x: 0, y: 0, show: true },
			{ x: 0, y: 0, w: 1200, h: 630 },
		);
		expect(svg).toContain("<rect");
		expect(svg).toContain("NEW");
	});

	test("vector nested layer crops the viewBox", () => {
		const markup = vectorNestedLayer(
			{ svg: "<svg xmlns='http://www.w3.org/2000/svg'/>", viewBox: { x: 0, y: 0, w: 24, h: 24 } },
			{ x: 0, y: 0, w: 100, h: 100 },
			{
				source: null,
				fit: "contain",
				padding: 0,
				offsetX: 0,
				offsetY: 0,
				scale: 1,
				crop: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
			},
		);
		expect(markup).toContain('viewBox="6.000 6.000 12.000 12.000"');
		expect(markup).toContain('width="100.00"');
	});

	test("svg data url encodes source", () => {
		expect(svgDataUrl("<svg/>")).toBe(`data:image/svg+xml,${encodeURIComponent("<svg/>")}`);
	});

	test("OG templates produce svg with fonts and canvas", () => {
		const design: OgDesign = defaultOgDesign("minimal");
		design.title.text = "QB Tools";
		const { svg, warnings } = composeOgSvg(design);
		expect(svg).toContain(`viewBox="0 0 1200 630"`);
		expect(svg).toContain("QB Tools");
		expect(svg).toContain("font-family=");
		expect(Array.isArray(warnings)).toBe(true);
	});

	test("split-image template clips artwork", () => {
		const design = defaultOgDesign("split-image");
		design.hero.placement.source = fakeRaster();
		const { svg } = composeOgSvg(design);
		expect(svg).toContain("clip-path");
		expect(svg).toContain("<image");
	});

	test("icon compose keeps square corners", () => {
		const design: IconDesign = defaultIconDesign("favicon");
		design.artwork.source = fakeRaster();
		const svg = composeIconSvg(design);
		expect(svg).not.toContain("rx=");
		expect(svg).toContain('<rect width="1024"');
	});
});

function fakeRaster(): ArtworkData {
	return {
		kind: "raster",
		src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGP8z8DAx/ALDAAOzwHxhLZ/4wAAAABJRU5ErkJggg==",
		width: 2,
		height: 2,
		intrinsicWidth: 2,
		intrinsicHeight: 2,
	};
}

describe("projects", () => {
	test("serialize → parse round trip for every tool", async () => {
		for (const tool of ["og-banner", "favicon", "app-icon"] as const) {
			const project: DesignProject = {
				device: tool,
				version: QBDESIGN_VERSION,
				settings:
					tool === "og-banner"
						? { tool, design: defaultOgDesign("gradient") }
						: { tool, design: defaultIconDesign(tool) },
				meta: { name: "Test", savedAt: "2026-01-01T00:00:00Z" },
			};
			const blob = serializeDesign(project);
			const parsed = await parseDesign(blob);
			expect(parsed.device).toBe(tool);
			expect(parsed.meta.name).toBe("Test");
			expect(parsed.version).toBe(QBDESIGN_VERSION);
		}
	});

	test("rejects foreign payloads and oversized files", async () => {
		await expect(parseDesign(new Blob(["{ not a qb file }"]))).rejects.toThrow();
		await expect(parseDesign(new Blob(["{}"]))).rejects.toThrow();
		const big = new Blob([new Uint8Array(50 * 1024 * 1024 + 1)]);
		await expect(parseDesign(big)).rejects.toThrow("50 MB");
	});

	test("rejects future versions", async () => {
		const project = {
			format: "qbdesign",
			version: QBDESIGN_VERSION + 1,
			tool: "favicon",
			settings: { tool: "favicon", design: defaultIconDesign("favicon") },
			meta: { name: "x", savedAt: "" },
		};
		await expect(parseDesign(new Blob([JSON.stringify(project)]))).rejects.toThrow("newer version");
	});

	test("file name slugifies", () => {
		expect(projectFileName("og-banner", "My Post!! Banner")).toBe(
			"my-post-banner-og-banner.qbdesign.json",
		);
	});
});

describe("favicon generation", () => {
	test("produces full package with valid ico and manifest", async () => {
		const design = defaultIconDesign("favicon");
		design.artwork.source = fakeRaster();
		const result = await generateFaviconSet(
			design,
			{
				appName: "Weather",
				shortName: "Weather",
				themeColor: "#111827",
				bgColor: "#ffffff",
				startUrl: "/",
				assetPath: "/icons/",
				transparentBrowserIcon: true,
				// WebP encode needs a browser canvas; validated by browser conformance tests.
				webpBrowserIcons: false,
				optimize: false,
			},
			{ assets: TEST_ASSETS },
		);
		const names = result.files.map((f) => f.name);
		for (const required of [
			"favicon.ico",
			"favicon-16x16.png",
			"favicon-32x32.png",
			"favicon-48x48.png",
			"favicon.svg",
			"apple-touch-icon.png",
			"web-app-manifest-192x192.png",
			"web-app-manifest-512x512.png",
			"web-app-manifest-192x192-maskable.png",
			"web-app-manifest-512x512-maskable.png",
			"site.webmanifest",
			"html-snippet.txt",
			"README.md",
		])
			expect(names).toContain(required);
		const ico = must(
			result.files.find((f) => f.name === "favicon.ico"),
			"favicon.ico",
		);
		const validated = validateIco(new Uint8Array(await ico.blob.arrayBuffer()));
		expect(validated?.frames).toBe(3);
		const manifestJson = JSON.parse(
			await must(
				result.files.find((f) => f.name === "site.webmanifest"),
				"site.webmanifest",
			).blob.text(),
		) as { icons: Array<{ src: string }> };
		expect(manifestJson.icons.length).toBeGreaterThanOrEqual(5);
		for (const icon of manifestJson.icons) {
			const fileName = icon.src.split("/").pop();
			expect(fileName).toBeDefined();
			if (fileName) expect(names).toContain(fileName);
		}
		const zip = must(result.zip, "favicon zip");
		expect(zip.blob.size).toBeGreaterThan(1000);
		// PWA distinction: README explains the service worker requirement.
		const readme = must(
			result.files.find((f) => f.name === "README.md"),
			"README.md",
		);
		expect(await readme.blob.text()).toContain("service worker");
	}, 30000);

	test("initials artwork converts text to paths in svg", async () => {
		const design = defaultIconDesign("favicon");
		design.artwork.source = {
			kind: "initials",
			src: "",
			width: 256,
			height: 256,
			text: "QB",
			color: "#ffffff",
			fontFamily: "Inter",
			fontWeight: 700,
		};
		const result = await generateFaviconSet(
			design,
			{
				appName: "X",
				shortName: "X",
				themeColor: "#000000",
				bgColor: "#000000",
				startUrl: "/",
				assetPath: "",
				transparentBrowserIcon: false,
				webpBrowserIcons: false,
				optimize: false,
			},
			{ assets: TEST_ASSETS },
		);
		const svg = await must(
			result.files.find((f) => f.name === "favicon.svg"),
			"favicon.svg",
		).blob.text();
		expect(svg).toContain("<path d=");
		// Text elements must not leak into the standalone svg.
		expect(svg).not.toContain("<text");
	}, 30000);
});

describe("app icon generation", () => {
	test("legacy slot table covers the plan matrix", () => {
		const pxBySlot = iosLegacySlots();
		expect(
			pxBySlot
				.filter((s) => s.idiom === "iphone")
				.map((s) => s.px)
				.sort((a, b) => a - b),
		).toEqual([40, 58, 60, 80, 87, 120, 120, 180]);
		expect(
			pxBySlot
				.filter((s) => s.idiom === "ipad")
				.map((s) => s.px)
				.sort((a, b) => a - b),
		).toEqual([20, 29, 40, 40, 58, 76, 80, 152, 167]);
	});

	test("monochrome pixels honor alpha threshold", () => {
		const px = new Uint8ClampedArray([255, 0, 0, 10, 0, 0, 0, 200, 128, 128, 128, 255]);
		const out = monochromePixels(px, "alpha", 100, 3, 1);
		expect(out.data[3]).toBe(0); // alpha 10 below 100
		expect(out.data[7]).toBe(255);
		expect(out.data[0]).toBe(0); // black layer
	});
});

describe("app icon generation end to end", () => {
	test("ios and android kits contain catalogs, xml and play icon", async () => {
		const design = defaultIconDesign("app-icon");
		design.artwork.source = fakeRaster();
		const result = await generateAppIconSet(
			design,
			{
				platforms: ["ios", "android"],
				iosDarkMode: {
					enabled: true,
					background: { type: "color", color: "#111111" },
					foreground: "#ffffff",
				},
				iosTintedMode: {
					enabled: true,
					background: { type: "color", color: "#f4f4f5" },
					foreground: "#18181b",
				},
				monochrome: { mode: "alpha", threshold: 128 },
				optimize: false,
			},
			{ assets: TEST_ASSETS },
		);
		const names = result.files.map((f) => f.name);
		for (const required of [
			"ios/AppIcon.appiconset/AppIconLight.png",
			"ios/AppIcon.appiconset/AppIconDark.png",
			"ios/AppIcon.appiconset/AppIconTinted.png",
			"ios/AppIcon.appiconset/Contents.json",
			"ios/AppIconLegacy.appiconset/app-store-1024.png",
			"ios/AppIconLegacy.appiconset/Contents.json",
			"android/res/mipmap-anydpi-v26/ic_launcher.xml",
			"android/res/mipmap-anydpi-v33/ic_launcher.xml",
			"android/res/mipmap-xxxhdpi/ic_launcher_foreground.png",
			"android/res/mipmap-xxxhdpi/ic_launcher_monochrome.png",
			"android/res/mipmap-mdpi/ic_launcher.png",
			"android/res/mipmap-mdpi/ic_launcher_round.png",
			"android/play-icon-512.png",
		])
			expect(names).toContain(required);
		// Contents.json references only filenames that exist.
		const modern = JSON.parse(
			await must(
				result.files.find((f) => f.name === "ios/AppIcon.appiconset/Contents.json"),
				"modern Contents.json",
			).blob.text(),
		) as { images: Array<{ filename: string; idiom: string; platform: string; size: string }> };
		for (const image of modern.images) {
			expect(names.some((n) => n.endsWith(`AppIcon.appiconset/${image.filename}`))).toBe(true);
			expect(image.idiom).toBe("universal");
			expect(image.platform).toBe("ios");
			expect(image.size).toBe("1024x1024");
		}
		const legacy = JSON.parse(
			await must(
				result.files.find((f) => f.name === "ios/AppIconLegacy.appiconset/Contents.json"),
				"legacy Contents.json",
			).blob.text(),
		) as { images: Array<{ filename: string }> };
		for (const image of legacy.images) {
			expect(names.some((n) => n.endsWith(`AppIconLegacy.appiconset/${image.filename}`))).toBe(
				true,
			);
		}
		// 167px slot exists for iPad 83.5pt @2x.
		expect(names).toContain("ios/AppIconLegacy.appiconset/icon-167x167.png");
		// Android v33 XML references the monochrome drawable.
		const v33 = await must(
			result.files.find((f) => f.name === "android/res/mipmap-anydpi-v33/ic_launcher.xml"),
			"v33 adaptive xml",
		).blob.text();
		expect(v33).toContain(`<monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>`);
		const play = await must(
			result.files.find((f) => f.name.endsWith("play-icon-512.png")),
			"play icon",
		).blob.arrayBuffer();
		expect(play.byteLength).toBeGreaterThan(200);
		expect(play.byteLength).toBeLessThan(1024 * 1024);
		expect(result.zip).toBeDefined();
	}, 60000);

	test("ios-only set has no android folders", async () => {
		const design = defaultIconDesign("app-icon");
		const result = await generateAppIconSet(
			design,
			{
				platforms: ["ios"],
				iosDarkMode: { enabled: false, background: { type: "none" }, foreground: "#ffffff" },
				iosTintedMode: { enabled: false, background: { type: "none" }, foreground: "#ffffff" },
				monochrome: { mode: "alpha", threshold: 128 },
				optimize: false,
			},
			{ assets: TEST_ASSETS },
		);
		const names = result.files.map((f) => f.name);
		expect(names.some((n) => n.startsWith("AppIcon.appiconset/"))).toBe(true);
		expect(names.some((n) => n.includes("res/"))).toBe(false);
	}, 60000);
});
