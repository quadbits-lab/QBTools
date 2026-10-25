/** Favicon package generator: browser icons, manifest, snippet and README. */
import { downloadZip } from "client-zip";
import { checkAbort, type ProcessingOptions, progress } from "../processing";
import { artworkLayer, vectorNestedLayer } from "./compose";
import type { GraphicAssets } from "./fonts";
import { buildIco, type IcoFrame } from "./ico";
import { renderSvg } from "./resvg";
import { textToPathSvg } from "./textpaths";
import type {
	BackgroundSpec,
	Box,
	DesignWarning,
	FaviconExportOptions,
	GeneratedAsset,
	GeneratedAssetSet,
	IconDesign,
} from "./types";

const BROWSER_SIZES = [16, 32, 48] as const;
const WEB_SIZES = [192, 512] as const;

function joinPath(prefix: string, name: string): string {
	const clean = prefix.replace(/\/+$/, "");
	return clean ? `${clean}/${name}` : name;
}

/** Opaque background fallback for formats that need one (apple touch, tabs on light bg). */
function opaqueFallback(bg: BackgroundSpec, fallback = "#ffffff"): BackgroundSpec {
	return bg.type === "none" ? { type: "color", color: fallback } : bg;
}

function bgMarkup(w: number, h: number, bg: BackgroundSpec): string {
	if (bg.type === "gradient") {
		const rad = ((bg.angle - 90) * Math.PI) / 180;
		const x2 = Math.cos(rad) / 2;
		const y2 = Math.sin(rad) / 2;
		return (
			`<defs><linearGradient id="fbg" x1="${(0.5 - x2).toFixed(4)}" y1="${(0.5 - y2).toFixed(4)}"` +
			` x2="${(0.5 + x2).toFixed(4)}" y2="${(0.5 + y2).toFixed(4)}">` +
			`<stop offset="0" stop-color="${bg.from}"/><stop offset="1" stop-color="${bg.to}"/></linearGradient></defs>` +
			`<rect width="${w}" height="${h}" fill="url(#fbg)"/>`
		);
	}
	if (bg.type === "none") return "";
	return `<rect width="${w}" height="${h}" fill="${bg.color}"/>`;
}

interface Resolved {
	/** Pure-vector inner markup (nested svg) when the artwork is vector. */
	vector: string | null;
	/** Raster inner markup when the artwork is raster. */
	raster: string | null;
}

/** Resolve artwork to favicon.svg inner content, converting text to paths. */
export async function faviconArtworkInner(
	design: IconDesign,
	assets: GraphicAssets | undefined,
	options: ProcessingOptions,
): Promise<Resolved> {
	const size = design.canvas;
	const inset = size * Math.max(0, Math.min(0.45, design.artwork.padding));
	const box: Box = { x: inset, y: inset, w: size - 2 * inset, h: size - 2 * inset };
	const art = design.artwork.source;
	if (!art) return { vector: "", raster: null };
	if (art.kind === "raster") {
		return {
			vector: null,
			raster: artworkLayer("icon", box, design.artwork),
		};
	}
	if (art.kind === "svg" || art.kind === "icon") {
		return {
			vector: vectorNestedLayer(
				{ svg: art.src, viewBox: { x: 0, y: 0, w: art.width, h: art.height } },
				box,
				design.artwork,
			),
			raster: null,
		};
	}
	checkAbort(options.signal);
	const converted = await textToPathSvg(
		art.text ?? "",
		{
			family: art.fontFamily ?? "Inter",
			weight: art.fontWeight ?? 700,
			size: Math.max(8, art.width || box.h),
			color: art.color ?? design.foreground,
			letterSpacing: art.letterSpacing ?? 0,
		},
		assets,
		options,
	);
	return {
		vector: vectorNestedLayer(
			{ svg: converted.svg, viewBox: { x: 0, y: 0, w: converted.width, h: converted.height } },
			box,
			design.artwork,
		),
		raster: null,
	};
}

function iconSvg(size: number, bg: BackgroundSpec, inner: Resolved): string {
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
		bgMarkup(size, size, bg) +
		(inner.vector ?? inner.raster ?? "") +
		`</svg>`
	);
}

/** Render one PNG size of an SVG at the icon canvas coordinates. */
export async function renderIconPng(
	svg: string,
	size: number,
	options: ProcessingOptions & { assets?: GraphicAssets },
): Promise<Uint8Array> {
	const { blob } = await renderSvg({ svg, width: size, height: size, format: "png" }, options);
	return new Uint8Array(await blob.arrayBuffer());
}

async function renderIconBlob(
	svg: string,
	size: number,
	format: "png" | "webp" | "jpeg",
	options: ProcessingOptions & { assets?: GraphicAssets },
	optimize = false,
): Promise<Blob> {
	const { blob } = await renderSvg(
		{ svg, width: size, height: size, format, quality: 0.9, optimize },
		options,
	);
	return blob;
}

function buildManifest(options: FaviconExportOptions): string {
	const p = options.assetPath;
	const pngSizes = BROWSER_SIZES.map((s) => ({
		src: joinPath(p, `favicon-${s}x${s}.png`),
		sizes: `${s}x${s}`,
		type: "image/png",
	}));
	const anyIcons = [
		...pngSizes,
		...WEB_SIZES.map((s) => ({
			src: joinPath(p, `web-app-manifest-${s}x${s}.png`),
			sizes: `${s}x${s}`,
			type: "image/png",
			purpose: "any",
		})),
	];
	const maskable = WEB_SIZES.map((s) => ({
		src: joinPath(p, `web-app-manifest-${s}x${s}-maskable.png`),
		sizes: `${s}x${s}`,
		type: "image/png",
		purpose: "maskable",
	}));
	return JSON.stringify(
		{
			name: options.appName,
			short_name: options.shortName,
			start_url: options.startUrl || "/",
			theme_color: options.themeColor,
			background_color: options.bgColor,
			display: "standalone",
			icons: [...anyIcons, ...maskable],
		},
		null,
		2,
	);
}

export interface PlatformSnippet {
	id: string;
	name: string;
	file: string;
	language: string;
	description: string;
	code: string;
}

export function buildPlatformSnippets(options: FaviconExportOptions): PlatformSnippet[] {
	const p = options.assetPath;
	const ico = joinPath(p, "favicon.ico");
	const svg = joinPath(p, "favicon.svg");
	const png32 = joinPath(p, "favicon-32x32.png");
	const appleTouch = joinPath(p, "apple-touch-icon.png");
	const manifest = joinPath(p, "site.webmanifest");
	const themeColor = options.themeColor;

	return [
		{
			id: "html",
			name: "HTML",
			file: "index.html",
			language: "html",
			description: "Standard HTML5 tags to paste inside the <head> element of your HTML pages.",
			code: [
				`<link rel="icon" href="${ico}" sizes="48x48">`,
				`<link rel="icon" type="image/svg+xml" href="${svg}">`,
				`<link rel="icon" type="image/png" sizes="32x32" href="${png32}">`,
				`<link rel="apple-touch-icon" href="${appleTouch}">`,
				`<link rel="manifest" href="${manifest}">`,
				`<meta name="theme-color" content="${themeColor}">`,
				`<meta name="mobile-web-app-capable" content="yes">`,
			].join("\n"),
		},
		{
			id: "vite",
			name: "Vite",
			file: "index.html",
			language: "html",
			description:
				"Place icons inside public/ and paste these tags in your root index.html <head>.",
			code: [
				`<!-- Place icon files in public/ and add to index.html <head> -->`,
				`<link rel="icon" href="${ico}" sizes="48x48" />`,
				`<link rel="icon" type="image/svg+xml" href="${svg}" />`,
				`<link rel="icon" type="image/png" sizes="32x32" href="${png32}" />`,
				`<link rel="apple-touch-icon" href="${appleTouch}" />`,
				`<link rel="manifest" href="${manifest}" />`,
				`<meta name="theme-color" content="${themeColor}" />`,
			].join("\n"),
		},
		{
			id: "react",
			name: "React",
			file: "App.tsx / Helmet",
			language: "tsx",
			description: "JSX tags for React Helmet, Head component, or custom root layout.",
			code: [
				`<>`,
				`\t<link rel="icon" href="${ico}" sizes="48x48" />`,
				`\t<link rel="icon" type="image/svg+xml" href="${svg}" />`,
				`\t<link rel="icon" type="image/png" sizes="32x32" href="${png32}" />`,
				`\t<link rel="apple-touch-icon" href="${appleTouch}" />`,
				`\t<link rel="manifest" href="${manifest}" />`,
				`\t<meta name="theme-color" content="${themeColor}" />`,
				`</>`,
			].join("\n"),
		},
		{
			id: "tanstack-start",
			name: "TanStack Start",
			file: "app/routes/__root.tsx",
			language: "typescript",
			description:
				"Configure head metadata and icon links in your root route createRootRoute definition.",
			code: [
				`// app/routes/__root.tsx`,
				`import { createRootRoute } from "@tanstack/react-router";`,
				``,
				`export const Route = createRootRoute({`,
				`\thead: () => ({`,
				`\t\tmeta: [`,
				`\t\t\t{ name: "theme-color", content: "${themeColor}" },`,
				`\t\t\t{ name: "mobile-web-app-capable", content: "yes" },`,
				`\t\t],`,
				`\t\tlinks: [`,
				`\t\t\t{ rel: "icon", href: "${ico}", sizes: "48x48" },`,
				`\t\t\t{ rel: "icon", type: "image/svg+xml", href: "${svg}" },`,
				`\t\t\t{ rel: "icon", type: "image/png", sizes: "32x32", href: "${png32}" },`,
				`\t\t\t{ rel: "apple-touch-icon", href: "${appleTouch}" },`,
				`\t\t\t{ rel: "manifest", href: "${manifest}" },`,
				`\t\t],`,
				`\t}),`,
				`});`,
			].join("\n"),
		},
		{
			id: "nextjs",
			name: "Next.js",
			file: "app/layout.tsx",
			language: "typescript",
			description: "Export metadata and viewport objects in app/layout.tsx (App Router).",
			code: [
				`// app/layout.tsx (Next.js App Router)`,
				`import type { Metadata, Viewport } from "next";`,
				``,
				`export const viewport: Viewport = {`,
				`\tthemeColor: "${themeColor}",`,
				`};`,
				``,
				`export const metadata: Metadata = {`,
				`\tmanifest: "${manifest}",`,
				`\ticons: {`,
				`\t\ticon: [`,
				`\t\t\t{ url: "${ico}", sizes: "48x48" },`,
				`\t\t\t{ url: "${svg}", type: "image/svg+xml" },`,
				`\t\t\t{ url: "${png32}", sizes: "32x32", type: "image/png" },`,
				`\t\t],`,
				`\t\tapple: [`,
				`\t\t\t{ url: "${appleTouch}" },`,
				`\t\t],`,
				`\t},`,
				`};`,
			].join("\n"),
		},
		{
			id: "solidjs",
			name: "SolidJS",
			file: "src/app.tsx",
			language: "tsx",
			description: "Add tags using @solidjs/meta Link and Meta components in your root component.",
			code: [
				`// src/app.tsx (SolidStart / SolidJS)`,
				`import { Link, Meta } from "@solidjs/meta";`,
				``,
				`export default function App() {`,
				`\treturn (`,
				`\t\t<>`,
				`\t\t\t<Link rel="icon" href="${ico}" sizes="48x48" />`,
				`\t\t\t<Link rel="icon" type="image/svg+xml" href="${svg}" />`,
				`\t\t\t<Link rel="icon" type="image/png" sizes="32x32" href="${png32}" />`,
				`\t\t\t<Link rel="apple-touch-icon" href="${appleTouch}" />`,
				`\t\t\t<Link rel="manifest" href="${manifest}" />`,
				`\t\t\t<Meta name="theme-color" content="${themeColor}" />`,
				`\t\t</>`,
				`\t);`,
				`}`,
			].join("\n"),
		},
		{
			id: "astro",
			name: "Astro",
			file: "src/layouts/Layout.astro",
			language: "astro",
			description: "Include favicon link tags in your root Astro layout head section.",
			code: [
				`---`,
				`// src/layouts/Layout.astro`,
				`---`,
				`<!doctype html>`,
				`<html lang="en">`,
				`\t<head>`,
				`\t\t<meta charset="UTF-8" />`,
				`\t\t<link rel="icon" href="${ico}" sizes="48x48" />`,
				`\t\t<link rel="icon" type="image/svg+xml" href="${svg}" />`,
				`\t\t<link rel="icon" type="image/png" sizes="32x32" href="${png32}" />`,
				`\t\t<link rel="apple-touch-icon" href="${appleTouch}" />`,
				`\t\t<link rel="manifest" href="${manifest}" />`,
				`\t\t<meta name="theme-color" content="${themeColor}" />`,
				`\t</head>`,
				`\t<body>`,
				`\t\t<slot />`,
				`\t</body>`,
				`</html>`,
			].join("\n"),
		},
		{
			id: "sveltekit",
			name: "SvelteKit",
			file: "src/routes/+layout.svelte",
			language: "svelte",
			description: "Use <svelte:head> inside your root layout or add directly to src/app.html.",
			code: [
				`<!-- src/routes/+layout.svelte -->`,
				`<svelte:head>`,
				`\t<link rel="icon" href="${ico}" sizes="48x48" />`,
				`\t<link rel="icon" type="image/svg+xml" href="${svg}" />`,
				`\t<link rel="icon" type="image/png" sizes="32x32" href="${png32}" />`,
				`\t<link rel="apple-touch-icon" href="${appleTouch}" />`,
				`\t<link rel="manifest" href="${manifest}" />`,
				`\t<meta name="theme-color" content="${themeColor}" />`,
				`</svelte:head>`,
				``,
				`<slot />`,
			].join("\n"),
		},
		{
			id: "nuxt",
			name: "Nuxt",
			file: "nuxt.config.ts",
			language: "typescript",
			description: "Define head links and meta in your nuxt.config.ts app configuration.",
			code: [
				`// nuxt.config.ts`,
				`export default defineNuxtConfig({`,
				`\tapp: {`,
				`\t\thead: {`,
				`\t\t\tlink: [`,
				`\t\t\t\t{ rel: "icon", href: "${ico}", sizes: "48x48" },`,
				`\t\t\t\t{ rel: "icon", type: "image/svg+xml", href: "${svg}" },`,
				`\t\t\t\t{ rel: "icon", type: "image/png", sizes: "32x32", href: "${png32}" },`,
				`\t\t\t\t{ rel: "apple-touch-icon", href: "${appleTouch}" },`,
				`\t\t\t\t{ rel: "manifest", href: "${manifest}" },`,
				`\t\t\t],`,
				`\t\t\tmeta: [`,
				`\t\t\t\t{ name: "theme-color", content: "${themeColor}" },`,
				`\t\t\t],`,
				`\t\t},`,
				`\t},`,
				`});`,
			].join("\n"),
		},
		{
			id: "remix",
			name: "Remix",
			file: "app/root.tsx",
			language: "typescript",
			description: "Export links and meta functions in your root route (app/root.tsx).",
			code: [
				`// app/root.tsx`,
				`import type { LinksFunction, MetaFunction } from "@remix-run/node";`,
				``,
				`export const links: LinksFunction = () => [`,
				`\t{ rel: "icon", href: "${ico}", sizes: "48x48" },`,
				`\t{ rel: "icon", type: "image/svg+xml", href: "${svg}" },`,
				`\t{ rel: "icon", type: "image/png", sizes: "32x32", href: "${png32}" },`,
				`\t{ rel: "apple-touch-icon", href: "${appleTouch}" },`,
				`\t{ rel: "manifest", href: "${manifest}" },`,
				`];`,
				``,
				`export const meta: MetaFunction = () => [`,
				`\t{ name: "theme-color", content: "${themeColor}" },`,
				`];`,
			].join("\n"),
		},
	];
}

function buildHtmlSnippet(options: FaviconExportOptions): string {
	const p = options.assetPath;
	return [
		`<link rel="icon" href="${joinPath(p, "favicon.ico")}" sizes="48x48">`,
		`<link rel="icon" type="image/svg+xml" href="${joinPath(p, "favicon.svg")}">`,
		`<link rel="icon" type="image/png" sizes="32x32" href="${joinPath(p, "favicon-32x32.png")}">`,
		`<link rel="apple-touch-icon" href="${joinPath(p, "apple-touch-icon.png")}">`,
		`<link rel="manifest" href="${joinPath(p, "site.webmanifest")}">`,
		`<meta name="theme-color" content="${options.themeColor}">`,
		`<meta name="mobile-web-app-capable" content="yes">`,
	].join("\n");
}

function buildReadme(options: FaviconExportOptions): string {
	return `# Favicon package

Generated by QBTools — Favicon Generator. All assets were produced locally and may be served from any static path.

## Files

| File | Purpose |
|---|---|
| \`favicon.ico\` | Legacy browser favicon (16, 32, 48 px frames) |
| \`favicon-16/32/48.png\` | Modern PNG favicon${options.transparentBrowserIcon ? " (transparent background)" : ""} |
| \`favicon.svg\` | Vector favicon for modern browsers${options.webpBrowserIcons ? ", plus WebP variants" : ""} |
| \`apple-touch-icon.png\` | iOS home-screen icon (opaque 180×180) |
| \`web-app-manifest-192x192.png\`, \`...512x512.png\` | Web app / PWA icons |
| \`*-maskable.png\` | Android adaptive (maskable) icons, content inside the safe circle |
| \`site.webmanifest\` | Web app manifest referencing the icons above |
| \`html-snippet.txt\` | Tags to paste into \`<head>\` |

## Install

1. Copy this folder to your server at \`${options.assetPath || "/icons/"}\` (any static path works).
2. Paste \`html-snippet.txt\` content inside \`<head>\` of your pages. Update paths if you renamed the folder.
3. Edit \`site.webmanifest\` \`name\`, \`short_name\` and \`start_url\` for your site.
4. Verify: open the deployed site, refresh hard \`Ctrl+Shift+R\` / \`⌘⇧R\`, and check the tab icon in light and dark browser themes.

## Browser icon vs installable PWA

These files make your site **look right** in browsers, bookmarks and home screens.

Making a site **installable as a PWA** additionally requires:

- \`site.webmanifest\` served over **HTTPS** with \`name\`, \`start_url\` and at least a 192×192 \`purpose: "any"\` icon (included above),
- a registered **service worker** at your site scope,
- and, for Chrome's richer install UI, \`display: "standalone"\` or \`"fullscreen"\` (already set).

Without the service worker the site simply will not pass installability checks; the icons above are already manifest-ready.
`;
}

/** Generate the complete favicon ZIP package. */
export async function generateFaviconSet(
	design: IconDesign,
	options: FaviconExportOptions,
	processingOptions: ProcessingOptions & { assets?: GraphicAssets } = {},
): Promise<GeneratedAssetSet> {
	const warnings: DesignWarning[] = [];
	const files: GeneratedAsset[] = [];
	const art = design.artwork.source;
	if (art?.kind === "raster" && art.intrinsicWidth && art.intrinsicHeight) {
		if (art.intrinsicWidth < 512 || art.intrinsicHeight < 512) {
			warnings.push({
				kind: "low-resolution",
				message: "Artwork is under 512 px, so the 512 px web app icon may look soft.",
			});
		}
	}
	const { assets } = processingOptions;
	checkAbort(processingOptions.signal);

	progress(processingOptions, "Building favicon artwork…");
	const opaqueBg = opaqueFallback(design.background);
	const browserBg = options.transparentBrowserIcon ? ({ type: "none" } as const) : opaqueBg;
	const standard = await faviconArtworkInner(design, assets, processingOptions);
	const opaqueInner = await faviconArtworkInner(design, assets, processingOptions);
	const faviconSvg = iconSvg(design.canvas, browserBg, standard);

	progress(processingOptions, "Rendering browser icons…");
	const icoFrames: IcoFrame[] = [];
	for (const size of BROWSER_SIZES) {
		checkAbort(processingOptions.signal);
		const png = await renderIconPng(faviconSvg, size, processingOptions);
		icoFrames.push({ size, png });
		if (options.webpBrowserIcons) {
			files.push({
				name: `favicon-${size}x${size}.webp`,
				blob: await renderIconBlob(faviconSvg, size, "webp", processingOptions),
				mimeType: "image/webp",
			});
		}
	}
	files.push({
		name: "favicon.ico",
		blob: new Blob([buildIco(icoFrames) as BlobPart], { type: "image/x-icon" }),
		mimeType: "image/x-icon",
	});

	progress(processingOptions, "Rendering PNG favicons…");
	for (const size of BROWSER_SIZES) {
		checkAbort(processingOptions.signal);
		files.push({
			name: `favicon-${size}x${size}.png`,
			blob: await renderIconBlob(faviconSvg, size, "png", processingOptions, options.optimize),
			mimeType: "image/png",
		});
	}

	progress(processingOptions, "Rendering touch and app icons…");
	checkAbort(processingOptions.signal);
	files.push({
		name: "apple-touch-icon.png",
		blob: await renderIconBlob(
			iconSvg(design.canvas, opaqueBg, opaqueInner),
			180,
			"png",
			processingOptions,
			options.optimize,
		),
		mimeType: "image/png",
	});
	for (const size of WEB_SIZES) {
		const anySvg = iconSvg(design.canvas, opaqueBg, opaqueInner);
		const maskableSvg = iconSvg(
			design.canvas,
			opaqueBg,
			await faviconArtworkInner(
				{
					...design,
					artwork: {
						...design.artwork,
						// Keep content inside the maskable safe circle.
						padding: Math.max(design.artwork.padding, 0.26),
					},
				},
				assets,
				processingOptions,
			),
		);
		checkAbort(processingOptions.signal);
		files.push({
			name: `web-app-manifest-${size}x${size}.png`,
			blob: await renderIconBlob(anySvg, size, "png", processingOptions, options.optimize),
			mimeType: "image/png",
		});
		files.push({
			name: `web-app-manifest-${size}x${size}-maskable.png`,
			blob: await renderIconBlob(maskableSvg, size, "png", processingOptions, options.optimize),
			mimeType: "image/png",
		});
	}

	progress(processingOptions, "Writing manifest and instructions…");
	files.push({
		name: "favicon.svg",
		blob: new Blob([faviconSvg], { type: "image/svg+xml" }),
		mimeType: "image/svg+xml",
	});
	files.push({
		name: "site.webmanifest",
		blob: new Blob([buildManifest(options)], { type: "application/manifest+json" }),
		mimeType: "application/manifest+json",
	});
	files.push({
		name: "html-snippet.txt",
		blob: new Blob([buildHtmlSnippet(options)], { type: "text/plain" }),
		mimeType: "text/plain",
	});
	files.push({
		name: "README.md",
		blob: new Blob([buildReadme(options)], { type: "text/markdown" }),
		mimeType: "text/markdown",
	});

	checkAbort(processingOptions.signal);
	progress(processingOptions, "Packing ZIP…");
	const zip = await downloadZip(files.map((f) => ({ name: f.name, input: f.blob }))).blob();
	return {
		files,
		zip: {
			name: options.shortName ? `${slugify(options.shortName)}-favicons.zip` : "favicons.zip",
			blob: zip,
		},
		install: { kind: "markdown", text: buildReadme(options) },
		warnings,
	};
}

function slugify(value: string): string {
	return (
		value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "favicons"
	);
}
