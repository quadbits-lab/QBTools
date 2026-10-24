/** iOS and Android app icon development kits: asset catalogs, adaptive XML, launcher PNGs. */
import { downloadZip } from "client-zip";
import { encodeImage } from "../image/codecs";
import { checkAbort, type ProcessingOptions, progress } from "../processing";
import { composeIconSvg } from "./compose";
import type { GraphicAssets } from "./fonts";
import { encodeRawPng } from "./rawpng";
import { renderSvg } from "./resvg";
import type {
	AppIconExportOptions,
	BackgroundSpec,
	DesignWarning,
	GeneratedAsset,
	GeneratedAssetSet,
	IconDesign,
} from "./types";

const IOS_SALES_PX = 1024;
const ANDROID_DENSITIES = [
	{ density: "mdpi", size: 108, legacy: 48 },
	{ density: "hdpi", size: 162, legacy: 72 },
	{ density: "xhdpi", size: 216, legacy: 96 },
	{ density: "xxhdpi", size: 324, legacy: 144 },
	{ density: "xxxhdpi", size: 432, legacy: 192 },
] as const;

/** Artwork inside the 66 dp safe area on the 108 dp canvas. */
const ANDROID_SAFE_INSET = 0.28;

function opaque(bg: BackgroundSpec, fallback = "#ffffff"): BackgroundSpec {
	return bg.type === "none" ? { type: "color", color: fallback } : bg;
}

/** Re-tint vector/icon artwork from the base foreground color to a variant color. */
export function recolorArtwork(art: IconDesign["artwork"]["source"], from: string, to: string) {
	if (!art || art.kind === "raster" || !from || !to || from === to) return art;
	if (!art.src.includes(from)) return art;
	return { ...art, src: art.src.split(from).join(to) };
}

function variantDesign(
	base: IconDesign,
	background: BackgroundSpec,
	foreground: string,
): IconDesign {
	return {
		...base,
		background,
		foreground,
		artwork: {
			...base.artwork,
			source: recolorArtwork(base.artwork.source, base.foreground, foreground),
		},
	};
}

interface IosVariant {
	name: string;
	design: IconDesign;
	appearances?: unknown[];
}

async function renderPngBlob(
	design: IconDesign,
	size: number,
	options: { processing: ProcessingOptions & { assets?: GraphicAssets }; pixels?: boolean },
): Promise<{ blob: Blob; pixels: Uint8ClampedArray | null }> {
	checkAbort(options.processing.signal);
	const { blob, pixels } = await renderSvg(
		{
			svg: composeIconSvg(design),
			width: size,
			height: size,
			format: "png",
			pixels: options.pixels,
		},
		options.processing,
	);
	return { blob, pixels: pixels ?? null };
}

function iosModernContents(variants: IosVariant[]): string {
	const images = variants.flatMap((variant) => {
		const base = {
			filename: `AppIcon${variant.name}.png`,
			idiom: "universal",
			platform: "ios",
			size: "1024x1024",
		};
		return variant.appearances ? [{ ...base, appearances: variant.appearances }] : [base];
	});
	return JSON.stringify({ images, info: { author: "xcode", version: 1 } }, null, 2);
}

/** Legacy iPhone/iPad/App Store slot table per Apple's asset catalog guidance. */
export function iosLegacySlots(): Array<{
	idiom: "iphone" | "ipad" | "ios-marketing";
	sizePt: string;
	scale: string;
	px: number;
	filename: string;
}> {
	const slots: Array<{
		idiom: "iphone" | "ipad" | "ios-marketing";
		sizePt: string;
		scale: string;
		px: number;
		filename: string;
	}> = [];
	const push = (idiom: "iphone" | "ipad", sizePt: number, scale: number) =>
		slots.push({
			idiom,
			sizePt: `${sizePt}x${sizePt}`,
			scale: `${scale}x`,
			px: Math.round(sizePt * scale),
			filename: `icon-${Math.round(sizePt * scale)}x${Math.round(sizePt * scale)}.png`,
		});
	for (const pt of [20, 29, 40, 60]) for (const scale of [2, 3]) push("iphone", pt, scale);
	for (const pt of [20, 29, 40, 76]) for (const scale of [1, 2]) push("ipad", pt, scale);
	push("ipad", 83.5, 2);
	slots.push({
		idiom: "ios-marketing",
		sizePt: "1024x1024",
		scale: "1x",
		px: IOS_SALES_PX,
		filename: "app-store-1024.png",
	});
	return slots;
}

function iosLegacyContents(slots: ReturnType<typeof iosLegacySlots>): string {
	const images = slots.map((slot) => {
		const base = {
			filename: slot.filename,
			idiom: slot.idiom,
			scale: slot.scale,
			size: slot.sizePt,
		};
		return slot.idiom === "ios-marketing" ? { ...base, scale: "1x" } : base;
	});
	return JSON.stringify({ images, info: { author: "xcode", version: 1 } }, null, 2);
}

function adaptiveXml(withMonochrome: boolean): string {
	const lines = [
		`<?xml version="1.0" encoding="utf-8"?>`,
		`<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">`,
		`    <background android:drawable="@mipmap/ic_launcher_background"/>`,
		`    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>`,
	];
	if (withMonochrome) {
		lines.push(`    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>`);
	}
	lines.push(`</adaptive-icon>`, "");
	return lines.join("\n");
}

function androidManifestInstructions(): string {
	return `# Android launcher icons (adaptive + legacy)

Copy the \`res/\` folder into your app module's \`src/main/,\` then rebuild:

- \`mipmap-anydpi-v26/ic_launcher.xml\`, \`ic_launcher_round.xml\`: adaptive icon references,
- \`mipmap-anydpi-v33/ic_launcher.xml\`: adds the themed (monochrome) layer for Android 13+,
- \`mipmap-mdpi..xxxhdpi/ic_launcher(_background/_foreground/_monochrome).png\`: adaptive layers (108–432 px),
- \`mipmap-*/ic_launcher.png\`, \`ic_launcher_round.png\`: legacy launcher icons for Android 7 and older,
- \`play-icon-512.png\`: Google Play listing icon (512×512 PNG, ≤1 MB).

## Manifest

\`android:icon="@mipmap/ic_launcher"\` and \`android:roundIcon="@mipmap/ic_launcher_round"\` on the \`application\` element are all that is required — the XMLs above are picked up automatically.

## Safe area

Adaptive foregrounds are rendered with all important content inside the 66 dp safe circle (on the 108 dp layer), so masks, circles and squircles never clip your artwork.
`;
}

function iOSInstructions(): string {
	return `# iOS app icon catalogs

- **AppIcon.appiconset** (modern): single 1024 px Any/Dark/Tinted images with \`Contents.json\` — Xcode 14+ renders every slot automatically.
- **AppIconLegacy.appiconset**: the full iPhone/iPad/App Store slot matrix for older targets.
- Corners are left square; iOS applies its own rounding at runtime. Preview masks are for appearance only.

Install: replace the folder in \`Assets.xcassets\` and build. The modern catalog's Dark and Tinted variants use your overrides.
`;
}

/** Android monochrome layer from source alpha or luminance threshold. */
export function monochromePixels(
	pixels: Uint8ClampedArray,
	mode: "alpha" | "luminance",
	threshold: number,
	width: number,
	height: number,
): { data: Uint8ClampedArray; width: number; height: number } {
	const out = new Uint8ClampedArray(pixels.length);
	for (let i = 0; i < pixels.length; i += 4) {
		const r = pixels[i] ?? 0;
		const g = pixels[i + 1] ?? 0;
		const b = pixels[i + 2] ?? 0;
		const a = pixels[i + 3] ?? 0;
		let keep = 0;
		if (mode === "alpha") {
			keep = a >= threshold ? 255 : 0;
		} else {
			const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			keep = a > 0 && lum >= threshold ? a : 0;
		}
		out[i] = 0;
		out[i + 1] = 0;
		out[i + 2] = 0;
		out[i + 3] = keep;
	}
	return { data: out, width, height };
}

/** Circular mask for legacy round launcher icons. */
function circleMask(pixels: Uint8ClampedArray, size: number): Uint8ClampedArray {
	const out = new Uint8ClampedArray(pixels);
	const r = size / 2;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const dx = x + 0.5 - r;
			const dy = y + 0.5 - r;
			if (Math.hypot(dx, dy) > r) out[(y * size + x) * 4 + 3] = 0;
		}
	}
	return out;
}

/** Generate iOS/Android development kits. Platforms map to folder prefixes. */
export async function generateAppIconSet(
	base: IconDesign,
	options: AppIconExportOptions,
	processing: ProcessingOptions & { assets?: GraphicAssets } = {},
): Promise<GeneratedAssetSet> {
	const { assets } = processing;
	const warnings: DesignWarning[] = [];
	const files: Array<{ name: string; blob: Blob; mimeType: string }> = [];
	const io = { platforms: options.platforms };
	const prefixIos = options.platforms.includes("android") ? "ios/" : "";
	const prefixAndroid = options.platforms.includes("ios") ? "android/" : "";

	// iOS --------------------------------------------------------------
	if (options.platforms.includes("ios")) {
		progress(processing, "Rendering iOS app icons…");
		const variants: IosVariant[] = [
			{ name: "Light", design: variantDesign(base, opaque(base.background), base.foreground) },
		];
		if (options.iosDarkMode.enabled) {
			variants.push({
				name: "Dark",
				design: variantDesign(
					base,
					opaque(options.iosDarkMode.background, "#000000"),
					options.iosDarkMode.foreground,
				),
				appearances: [{ appearance: "luminosity", value: "dark" }],
			});
		}
		if (options.iosTintedMode.enabled) {
			variants.push({
				name: "Tinted",
				design: variantDesign(
					base,
					opaque(options.iosTintedMode.background, "#000000"),
					options.iosTintedMode.foreground,
				),
				appearances: [{ appearance: "contrast", value: "high" }],
			});
		}
		const legacyBg = opaque(base.background);
		for (const variant of variants) {
			checkAbort(processing.signal);
			const { blob } = await renderPngBlob(variant.design, IOS_SALES_PX, { processing });
			files.push({
				name: `${prefixIos}AppIcon.appiconset/AppIcon${variant.name}.png`,
				blob,
				mimeType: "image/png",
			});
		}
		files.push({
			name: `${prefixIos}AppIcon.appiconset/Contents.json`,
			blob: new Blob([iosModernContents(variants)], { type: "application/json" }),
			mimeType: "application/json",
		});

		progress(processing, "Rendering legacy iOS sizes…");
		const legacySlots = iosLegacySlots();
		const uniqueSizes = [...new Set(legacySlots.map((s) => s.px))];
		const legacyDesign = variantDesign(base, legacyBg, base.foreground);
		const rendered = new Map<number, Blob>();
		for (const size of uniqueSizes) {
			const { blob } = await renderPngBlob(legacyDesign, size, { processing });
			rendered.set(size, blob);
		}
		for (const slot of legacySlots) {
			files.push({
				name: `${prefixIos}AppIconLegacy.appiconset/${slot.filename}`,
				blob: rendered.get(slot.px) as Blob,
				mimeType: "image/png",
			});
		}
		files.push({
			name: `${prefixIos}AppIconLegacy.appiconset/Contents.json`,
			blob: new Blob([iosLegacyContents(legacySlots)], { type: "application/json" }),
			mimeType: "application/json",
		});
	}

	// Android ----------------------------------------------------------
	if (options.platforms.includes("android")) {
		progress(processing, "Rendering adaptive layers…");
		const foregroundDesign: IconDesign = {
			...base,
			background: { type: "none" },
			artwork: {
				...base.artwork,
				padding: Math.max(base.artwork.padding, ANDROID_SAFE_INSET),
			},
		};
		const backgroundDesign: IconDesign = {
			...base,
			background: opaque(base.background),
			artwork: { ...base.artwork, source: null },
		};
		for (const layer of ANDROID_DENSITIES) {
			checkAbort(processing.signal);
			const fg = await renderPngBlob(foregroundDesign, layer.size, { processing });
			const bg = await renderPngBlob(backgroundDesign, layer.size, { processing });
			files.push(
				{
					name: `${prefixAndroid}res/mipmap-${layer.density}/ic_launcher_foreground.png`,
					blob: fg.blob,
					mimeType: "image/png",
				},
				{
					name: `${prefixAndroid}res/mipmap-${layer.density}/ic_launcher_background.png`,
					blob: bg.blob,
					mimeType: "image/png",
				},
			);
			progress(processing, "Generating monochrome layer…");
			// Monochrome derives from the base artwork at the same layer size.
			const monoSource = await renderSvg(
				{
					svg: composeIconSvg(foregroundDesign),
					width: layer.size,
					height: layer.size,
					format: "png",
					pixels: true,
				},
				processing,
			);
			if (monoSource.pixels) {
				const mono = monochromePixels(
					monoSource.pixels,
					options.monochrome.mode,
					options.monochrome.threshold,
					layer.size,
					layer.size,
				);
				files.push({
					name: `${prefixAndroid}res/mipmap-${layer.density}/ic_launcher_monochrome.png`,
					blob: encodeRawPng(mono.data, mono.width, mono.height, { processing }),
					mimeType: "image/png",
				});
			}
		}

		progress(processing, "Writing adaptive XML…");
		for (const [name, withMono] of [
			["mipmap-anydpi-v26/ic_launcher.xml", false],
			["mipmap-anydpi-v26/ic_launcher_round.xml", false],
			["mipmap-anydpi-v33/ic_launcher.xml", true],
		] as const) {
			files.push({
				name: `${prefixAndroid}res/${name}`,
				blob: new Blob([adaptiveXml(withMono)], { type: "text/xml" }),
				mimeType: "text/xml",
			});
		}

		progress(processing, "Rendering legacy launchers…");
		const legacyDesign = variantDesign(base, opaque(base.background), base.foreground);
		for (const layer of ANDROID_DENSITIES) {
			checkAbort(processing.signal);
			const square = await renderPngBlob(legacyDesign, layer.legacy, { processing });
			const round = await renderSvg(
				{
					svg: composeIconSvg(legacyDesign),
					width: layer.legacy,
					height: layer.legacy,
					format: "png",
					pixels: true,
				},
				processing,
			);
			files.push(
				{
					name: `${prefixAndroid}res/mipmap-${layer.density}/ic_launcher.png`,
					blob: square.blob,
					mimeType: "image/png",
				},
				{
					name: `${prefixAndroid}res/mipmap-${layer.density}/ic_launcher_round.png`,
					blob: round.pixels
						? encodeRawPng(circleMask(round.pixels, layer.legacy), layer.legacy, layer.legacy, {
								processing,
							})
						: square.blob,
					mimeType: "image/png",
				},
			);
		}

		progress(processing, "Rendering Google Play icon…");
		const play = await renderPngBlob(legacyDesign, 512, { processing });
		if (play.blob.size > 1024 * 1024) {
			warnings.push({
				kind: "generic",
				message:
					"The Google Play icon exceeds the 1 MB limit — enable Optimize file sizes or simplify artwork.",
				skipped: true,
			});
		}
		files.push({
			name: `${prefixAndroid}play-icon-512.png`,
			blob: play.blob,
			mimeType: "image/png",
		});
	}

	progress(processing, "Writing instructions…");
	files.push({
		name: `${prefixAndroid}README-MANIFEST.md`,
		blob: new Blob([androidManifestInstructions()], { type: "text/markdown" }),
		mimeType: "text/markdown",
	});
	if (options.platforms.includes("ios")) {
		files.push({
			name: `${prefixIos}README-IOS.md`,
			blob: new Blob([iOSInstructions()], { type: "text/markdown" }),
			mimeType: "text/markdown",
		});
	}

	checkAbort(processing.signal);
	progress(processing, "Packing ZIP…");
	const zipBlob = await downloadZip(files.map((f) => ({ name: f.name, input: f.blob }))).blob();
	const platforms = options.platforms.join("-and-");
	return {
		files,
		zip: { name: `app-icons-${platforms}.zip`, blob: zipBlob },
		install: {
			kind: "markdown",
			text: [
				options.platforms.includes("ios") ? iOSInstructions() : "",
				options.platforms.includes("android") ? androidManifestInstructions() : "",
			]
				.filter(Boolean)
				.join("\n\n"),
		},
		warnings,
	};
}
