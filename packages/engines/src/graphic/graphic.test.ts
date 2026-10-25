import { describe, expect, test } from "bun:test";
import { inflateSync } from "node:zlib";
import { generateAppIconSet, iosLegacySlots, monochromePixels } from "./appicon";
import {
	backgroundFill,
	badgeLayer,
	composeIconSvg,
	composeOgSvg,
	escapeXml,
	layoutOg,
	ogElementBoxes,
	svgDataUrl,
	textLayer,
	vectorNestedLayer,
	wrapTextLines,
} from "./compose";
import { defaultIconDesign, defaultOgDesign, OG_TEMPLATES } from "./defaults";
import { buildPlatformSnippets, generateFaviconSet } from "./favicon";
import { measureTextWidth } from "./fonts";
import { buildIcns, icnsChunkTypes } from "./icns";
import { buildIco, validateIco } from "./ico";
import { parseDesign, projectFileName, QBDESIGN_VERSION, serializeDesign } from "./projects";
import { encodeRawPng } from "./rawpng";
import { renderDesign } from "./render-design";
import type {
	ArtworkData,
	DesignProject,
	GeneratedAsset,
	IconDesign,
	OgDesign,
	TextFont,
	TextStyle,
} from "./types";

const repoRoot = `${import.meta.dir}/../../../..`;
const TEST_ASSETS = {
	fontUrls: {
		"inter-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2`,
		"inter-700": `file://${repoRoot}/apps/web/node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2`,
		"anton-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2`,
		"dmmono-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2`,
		"dmmono-500": `file://${repoRoot}/apps/web/node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2`,
		"bebas-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2`,
		"caveat-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/caveat/files/caveat-latin-400-normal.woff2`,
		"caveat-700": `file://${repoRoot}/apps/web/node_modules/@fontsource/caveat/files/caveat-latin-700-normal.woff2`,
		"playfair-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2`,
		"playfair-700": `file://${repoRoot}/apps/web/node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2`,
		"space-grotesk-400": `file://${repoRoot}/apps/web/node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff2`,
		"space-grotesk-700": `file://${repoRoot}/apps/web/node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2`,
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

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

interface PngChunk {
	type: string;
	data: Uint8Array;
	/** Bytes covered by the chunk CRC: the four type bytes followed by the data. */
	crcInput: Uint8Array;
	crc: number;
}

/** Parse PNG chunks, checking framing so CRC spans stay honest. */
function pngChunks(bytes: Uint8Array): PngChunk[] {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const chunks: PngChunk[] = [];
	let offset = PNG_SIGNATURE.length;
	while (offset + 12 <= bytes.byteLength) {
		const length = view.getUint32(offset);
		const end = offset + 12 + length;
		if (end > bytes.byteLength) throw new Error("Truncated PNG chunk");
		chunks.push({
			type: String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)),
			data: bytes.subarray(offset + 8, offset + 8 + length),
			crcInput: bytes.subarray(offset + 4, offset + 8 + length),
			crc: view.getUint32(offset + 8 + length),
		});
		offset = end;
	}
	expect(offset).toBe(bytes.byteLength);
	return chunks;
}

describe("rawpng", () => {
	test("encodes RGBA pixels as a valid PNG", async () => {
		const width = 3;
		const height = 2;
		const pixels = new Uint8Array([
			255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 17, 34, 51, 255, 68, 85, 102, 255, 119, 136,
			153, 255,
		]);
		const blob = await encodeRawPng(pixels, width, height);
		expect(blob.type).toBe("image/png");
		const bytes = new Uint8Array(await blob.arrayBuffer());
		expect([...bytes.subarray(0, 8)]).toEqual(PNG_SIGNATURE);

		const chunks = pngChunks(bytes);
		expect(chunks.map((chunk) => chunk.type)).toEqual(["IHDR", "IDAT", "IEND"]);
		// Bun's CRC-32 is an independent implementation of the chunk checksum.
		for (const chunk of chunks) expect(chunk.crc).toBe(Bun.hash.crc32(chunk.crcInput));

		const ihdr = must(chunks[0], "IHDR");
		const ihdrView = new DataView(ihdr.data.buffer, ihdr.data.byteOffset, ihdr.data.byteLength);
		expect(ihdr.data.length).toBe(13);
		expect(ihdrView.getUint32(0)).toBe(width);
		expect(ihdrView.getUint32(4)).toBe(height);
		// bit depth 8, colour type 6 (RGBA), deflate, filter 0, no interlace.
		expect([...ihdr.data.subarray(8)]).toEqual([8, 6, 0, 0, 0]);

		const idat = must(chunks[1], "IDAT");
		expect(idat.data[0]).toBe(0x78); // zlib header, not a raw deflate stream
		const raw = new Uint8Array(inflateSync(idat.data));
		const stride = width * 4 + 1;
		expect(raw.length).toBe(stride * height);
		for (let y = 0; y < height; y++) {
			expect(raw[y * stride]).toBe(0);
			expect([...raw.subarray(y * stride + 1, (y + 1) * stride)]).toEqual([
				...pixels.subarray(y * width * 4, (y + 1) * width * 4),
			]);
		}

		const iend = must(chunks[2], "IEND");
		expect(iend.data.length).toBe(0);
	});

	test("is deterministic for identical pixels", async () => {
		const pixels = new Uint8Array(16 * 16 * 4).map((_, i) => (i * 37) % 256);
		const first = new Uint8Array(await (await encodeRawPng(pixels, 16, 16)).arrayBuffer());
		const second = new Uint8Array(await (await encodeRawPng(pixels, 16, 16)).arrayBuffer());
		expect(second).toEqual(first);
	});

	test("rejects invalid dimensions and payload sizes", async () => {
		await expect(encodeRawPng(new Uint8Array(0), 0, 0)).rejects.toThrow("positive whole numbers");
		await expect(encodeRawPng(new Uint8Array(4), 1.5, 2)).rejects.toThrow("positive whole numbers");
		await expect(encodeRawPng(new Uint8Array(3), 1, 1)).rejects.toThrow(
			"Expected 4 RGBA bytes for a 1×1 image, received 3",
		);
	});

	test("honours an aborted signal", async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(
			encodeRawPng(new Uint8Array(4), 1, 1, { processing: { signal: controller.signal } }),
		).rejects.toThrow("Cancelled");
	});
});

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

describe("icns", () => {
	test("container header and chunk walk round-trip", () => {
		const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
		const bytes = buildIcns([
			{ type: "ic07", png },
			{ type: "ic10", png },
		]);
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		expect(view.getUint32(0, false)).toBe(0x69636e73);
		expect(view.getUint32(4, false)).toBe(bytes.byteLength);
		expect(bytes.byteLength).toBe(8 + 2 * (8 + png.length));
		expect(icnsChunkTypes(bytes)).toEqual(["ic07", "ic10"]);
	});

	test("rejects damaged containers", () => {
		expect(icnsChunkTypes(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]))).toEqual([]);
		const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
		const truncated = buildIcns([{ type: "ic07", png }]).subarray(0, 10);
		expect(icnsChunkTypes(truncated)).toEqual([]);
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

describe("og layout", () => {
	const baseStyle = {
		text: "Hello",
		font: "Inter" as TextFont,
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

	test("layout drives element boxes for every template", () => {
		for (const template of OG_TEMPLATES) {
			const design = defaultOgDesign(template);
			design.hero.placement.source = fakeRaster();
			const layout = layoutOg(design);
			const boxes = ogElementBoxes(design);
			expect(boxes.title).not.toBeNull();
			expect(boxes.hero).not.toBeNull();
			expect(boxes.title).toEqual(layout.title);
			expect(boxes.hero).toEqual(layout.hero);
		}
	});

	test("multi-line title anchors by full block height and stays inside the frame", () => {
		// A wrapping headline used to anchor on a single line's height, pushing
		// its last line over the subtitle in the default gradient design.
		const design = defaultOgDesign("gradient");
		const layout = layoutOg(design);
		const frame = layout.textFrame;
		const title = layout.title;
		expect(title).not.toBeNull();
		if (!title || !frame) return;
		expect(title.h).toBeGreaterThan(design.title.size); // wrapped past one line
		expect(title.y + title.h).toBeLessThanOrEqual(frame.y + frame.h + 0.5);
		// textLayer anchors identically to layoutOg.
		const { svg } = composeOgSvg(design);
		const firstBaseline = title.y + design.title.size;
		expect(svg).toContain(`y="${firstBaseline.toFixed(2)}"`);
	});

	test("default designs never overlap glyphs between title, subtitle and badge", () => {
		const ink = (style: TextStyle, tf: { x: number; y: number; w: number; h: number }) => {
			const blockW = Math.max(style.width * tf.w, 40);
			const lines = wrapTextLines(style.text, style.font, style.fontWeight, style.size, blockW);
			if (!lines.length) return null;
			const inkW = Math.max(
				...lines.map((l) => measureTextWidth(l, style.font, style.fontWeight, style.size)),
			);
			const blockH = Math.max(style.size, lines.length * style.size * style.lineHeight);
			const blockX = tf.x + style.x * Math.max(0, tf.w - blockW);
			const blockY = tf.y + style.y * Math.max(0, tf.h - blockH);
			const x =
				style.align === "center"
					? blockX + (blockW - inkW) / 2
					: style.align === "right"
						? blockX + blockW - inkW
						: blockX;
			return { x, y: blockY, w: inkW, h: blockH };
		};
		const overlap = (
			a: { x: number; y: number; w: number; h: number },
			b: { x: number; y: number; w: number; h: number },
		) =>
			Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) &&
			Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);

		for (const template of OG_TEMPLATES) {
			const design = defaultOgDesign(template);
			const layout = layoutOg(design);
			const title = ink(design.title, layout.textFrame);
			const sub = ink(design.subtitle, layout.textFrame);
			const badge = layout.badge;
			if (title && sub) expect(overlap(title, sub), `${template} title/subtitle`).toBe(false);
			if (title && badge) expect(overlap(title, badge), `${template} title/badge`).toBe(false);
			if (sub && badge) expect(overlap(sub, badge), `${template} subtitle/badge`).toBe(false);
		}
	});

	test("hidden elements produce no boxes and no markup", () => {
		const design = defaultOgDesign("gradient");
		design.subtitle = { ...design.subtitle, text: "Secret line", show: false };
		design.badge = { ...design.badge, text: "TAG", show: false };
		expect(ogElementBoxes(design).subtitle).toBeNull();
		expect(ogElementBoxes(design).badge).toBeNull();
		const { svg } = composeOgSvg(design);
		expect(svg).not.toContain("Secret line");
		expect(svg).not.toContain("TAG");
	});

	test("text outline uses paint-order stroke and opacity wraps a group", () => {
		const outlined = textLayer(
			{ ...baseStyle, outline: { color: "#000000", width: 4 } },
			{ x: 0, y: 0, w: 1000, h: 500 },
		);
		expect(outlined).toContain('paint-order="stroke"');
		expect(outlined).toContain('stroke="#000000"');

		const faded = textLayer({ ...baseStyle, opacity: 0.5 }, { x: 0, y: 0, w: 1000, h: 500 });
		expect(faded).toContain('<g opacity="0.500">');
	});

	test("split-image layout keeps the text frame left of the hero", () => {
		const design = defaultOgDesign("split-image");
		design.hero.placement.source = fakeRaster();
		const layout = layoutOg(design);
		expect(layout.hero).not.toBeNull();
		expect(layout.hero?.x).toBeGreaterThan(layout.textFrame.x + layout.textFrame.w);
	});

	test("overlay scrim is limited to the hero box for partial heroes", () => {
		const design = defaultOgDesign("event");
		design.hero.placement.source = fakeRaster();
		design.overlay = 0.4;
		const layout = layoutOg(design);
		expect(layout.scrim).not.toBeNull();
		expect(layout.scrim?.box).toEqual(layout.hero ?? undefined);
		expect(layout.scrim?.opacity).toBeCloseTo(0.2, 5);
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

	test("projects saved before text upgrades normalize safely", async () => {
		const design = defaultOgDesign("gradient");
		const legacyTitle = { ...design.title, font: "Ghost" as TextFont };
		delete legacyTitle.show;
		delete legacyTitle.opacity;
		delete legacyTitle.outline;
		const legacySubtitle = { ...design.subtitle };
		delete legacySubtitle.show;
		const payload = JSON.stringify({
			format: "qbdesign",
			version: 1,
			tool: "og-banner",
			settings: {
				tool: "og-banner",
				design: { ...design, title: legacyTitle, subtitle: legacySubtitle },
			},
			meta: { name: "old", savedAt: "" },
		});
		const parsed = await parseDesign(new Blob([payload]));
		const restored = (parsed.settings as { design: OgDesign }).design;
		expect(restored.title.show).toBe(true);
		expect(restored.title.opacity).toBe(1);
		expect(restored.title.outline).toBeNull();
		expect(restored.title.font).toBe("Inter");
		expect(restored.subtitle.show).toBe(true);
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

	test("buildPlatformSnippets generates snippets for all platforms with dynamic options", () => {
		const snippets = buildPlatformSnippets({
			appName: "Awesome App",
			shortName: "App",
			themeColor: "#3b82f6",
			bgColor: "#ffffff",
			startUrl: "/",
			assetPath: "/static/icons/",
			transparentBrowserIcon: false,
			webpBrowserIcons: true,
			optimize: true,
		});

		const platformIds = snippets.map((s) => s.id);
		expect(platformIds).toEqual([
			"html",
			"vite",
			"react",
			"tanstack-start",
			"nextjs",
			"solidjs",
			"astro",
			"sveltekit",
			"nuxt",
			"remix",
		]);

		for (const snippet of snippets) {
			expect(snippet.code).toContain("/static/icons/favicon.ico");
			expect(snippet.code).toContain("/static/icons/favicon.svg");
			expect(snippet.code).toContain("/static/icons/apple-touch-icon.png");
			expect(snippet.code).toContain("/static/icons/site.webmanifest");
			expect(snippet.code).toContain("#3b82f6");
		}

		const tanstack = snippets.find((s) => s.id === "tanstack-start");
		expect(tanstack?.code).toContain("createRootRoute");
		expect(tanstack?.file).toBe("app/routes/__root.tsx");

		const nextjs = snippets.find((s) => s.id === "nextjs");
		expect(nextjs?.code).toContain("Metadata");
		expect(nextjs?.code).toContain("viewport");

		const astro = snippets.find((s) => s.id === "astro");
		expect(astro?.file).toBe("src/layouts/Layout.astro");
	});
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
		// The 2px fake raster must trip the source-quality warning.
		expect(result.warnings.some((w) => w.kind === "low-resolution")).toBe(true);
	}, 60000);

	test("ios-only set has no android folders or stray readmes", async () => {
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
		expect(names.some((n) => n.startsWith("android/"))).toBe(false);
		expect(names).not.toContain("README-MANIFEST.md");
	}, 60000);

	test("macos-only kit contains the iconset and a valid icns", async () => {
		const design = defaultIconDesign("app-icon");
		design.artwork.source = fakeRaster();
		const result = await generateAppIconSet(
			design,
			{
				platforms: ["macos"],
				iosDarkMode: { enabled: false, background: { type: "none" }, foreground: "#ffffff" },
				iosTintedMode: { enabled: false, background: { type: "none" }, foreground: "#ffffff" },
				monochrome: { mode: "alpha", threshold: 128 },
				optimize: false,
			},
			{ assets: TEST_ASSETS },
		);
		const names = result.files.map((f) => f.name);
		expect(names).toContain("AppIcon.appiconset/icon_16x16.png");
		expect(names).toContain("AppIcon.appiconset/icon_512x512@2x.png");
		expect(names).toContain("AppIcon.appiconset/Contents.json");
		expect(names).toContain("AppIcon.icns");
		expect(names).toContain("README-MACOS.md");
		expect(
			names.some((n) => n.includes("res/") || n.startsWith("ios/") || n.includes("AppIconLegacy")),
		).toBe(false);
		const contents = JSON.parse(
			await must(
				result.files.find((f) => f.name === "AppIcon.appiconset/Contents.json") as GeneratedAsset,
				"macos Contents.json",
			).blob.text(),
		) as { images: Array<{ idiom: string; filename: string }> };
		expect(contents.images).toHaveLength(10);
		for (const image of contents.images) {
			expect(image.idiom).toBe("mac");
			expect(names).toContain(`AppIcon.appiconset/${image.filename}`);
		}
		const icnsBytes = new Uint8Array(
			await must(
				result.files.find((f) => f.name === "AppIcon.icns") as GeneratedAsset,
				"AppIcon.icns",
			).blob.arrayBuffer(),
		);
		expect(icnsChunkTypes(icnsBytes)).toEqual([
			"ic11",
			"ic12",
			"ic07",
			"ic13",
			"ic08",
			"ic14",
			"ic09",
			"ic10",
		]);
	}, 60000);

	test("renders designs using the extended font set", async () => {
		const design = defaultOgDesign("minimal");
		design.title = { ...design.title, font: "Space Grotesk" };
		design.subtitle = { ...design.subtitle, font: "Playfair Display" };
		const result = await renderDesign(
			{ tool: "og-banner", design },
			{ width: 240, height: 126, preview: true, format: "png", quality: 0.9 },
			{ assets: TEST_ASSETS },
		);
		expect(result.blob.size).toBeGreaterThan(100);
	}, 30000);
});
