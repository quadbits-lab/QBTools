/** Shared design contracts for OG banners, favicons and app icons. */

export type GraphicToolKind = "og-banner" | "favicon" | "app-icon";

export type BackgroundSpec =
	| { type: "color"; color: string }
	| { type: "gradient"; from: string; to: string; angle: number }
	| { type: "none" };

export type ArtworkKind = "raster" | "svg" | "icon" | "initials" | "text";

/** Normalized artwork stored inside a design. Raster is a PNG data URL; svg/icon is sanitized SVG source. */
export interface ArtworkData {
	kind: ArtworkKind;
	/** PNG data URL (raster) or sanitized SVG source (svg/icon). */
	src: string;
	/** Rendered or intrinsic aspect-ratio source dimensions. */
	width: number;
	height: number;
	/** Original raster pixel size, used for low-resolution warnings. */
	intrinsicWidth?: number;
	intrinsicHeight?: number;
	name?: string;
	/** Foreground color for icon / initials / text artwork. */
	color?: string;
	fontFamily?: string;
	fontWeight?: number;
	letterSpacing?: number;
	/** Contents for initials/text artwork. */
	text?: string;
}

export interface ArtworkCrop {
	/** Normalized crop on the source artwork, 0..1. */
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface ArtworkPlacement {
	source: ArtworkData | null;
	fit: "cover" | "contain" | "fill";
	/** Padding from the icon edge as a fraction of the canvas. */
	padding: number;
	/** Offset from center as a fraction of the canvas. */
	offsetX: number;
	offsetY: number;
	scale: number;
	crop: ArtworkCrop;
}

export type TextFont = "Inter" | "Anton" | "DM Mono";

export interface TextStyle {
	text: string;
	font: TextFont;
	/** Font size in design pixels. */
	size: number;
	color: string;
	fontWeight: number;
	letterSpacing: number;
	lineHeight: number;
	align: "left" | "center" | "right";
	/** Normalized position 0..1 inside the safe content frame. */
	x: number;
	y: number;
	width: number;
}

export type BadgeShape = "pill" | "square" | "underline";

export interface BadgeStyle {
	text: string;
	color: string;
	bg: string;
	shape: BadgeShape;
	size: number;
	x: number;
	y: number;
	show: boolean;
}

export type OgTemplate =
	| "minimal"
	| "gradient"
	| "split-image"
	| "photo-overlay"
	| "editorial"
	| "product-card"
	| "event"
	| "logo-focus";

export interface OgDesign {
	tool: "og-banner";
	template: OgTemplate;
	canvas: { width: number; height: number };
	background: BackgroundSpec;
	/** Dark scrim over photo backgrounds/hero images, 0..1. */
	overlay: number;
	padding: number;
	logo: { source: ArtworkData | null; height: number; x: number; y: number };
	hero: {
		source: ArtworkData | null;
		placement: ArtworkPlacement;
		opacity: number;
		x: number;
		width: number;
	};
	title: TextStyle;
	subtitle: TextStyle;
	badge: BadgeStyle;
}

export interface MonochromeSpec {
	mode: "alpha" | "luminance";
	/** Threshold 0..255 for alpha coverage or luminance brightness. */
	threshold: number;
}

export interface IconDesign {
	tool: "favicon" | "app-icon";
	canvas: number;
	background: BackgroundSpec;
	artwork: ArtworkPlacement;
	/** Foreground color applied to icon/initials artwork. */
	foreground: string;
	/** Android monochrome generation. */
	monochrome: MonochromeSpec;
	/** Independent variants for iOS app icons. */
	dark?: { background: BackgroundSpec; foreground: string };
	tinted?: { background: BackgroundSpec; foreground: string };
}

export type DesignSettings =
	| { tool: "og-banner"; design: OgDesign }
	| { tool: "favicon" | "app-icon"; design: IconDesign };

/** A rectangular layout area in canvas units. */
export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** Versioned, serialized project saved as `.qbdesign.json`. */
export interface DesignProject {
	device: GraphicToolKind;
	version: number;
	settings: DesignSettings;
	meta: { name: string; savedAt: string };
}

export interface DesignWarning {
	kind: "text-overflow" | "low-resolution" | "generic";
	message: string;
	skipped?: boolean;
}

export interface RenderOptions {
	width: number;
	height: number;
	/** Preview render; caps work and skips heavy validation. */
	preview: boolean;
	format: "png" | "jpeg" | "webp";
	quality: number;
	/** Extra OxiPNG compression for the output bytes. */
	optimize?: boolean;
}

export interface RenderedDesign {
	blob: Blob;
	mimeType: string;
	width: number;
	height: number;
	warnings: DesignWarning[];
}

export interface GeneratedAsset {
	name: string;
	blob: Blob;
	mimeType: string;
}

export type InstallInstructions = { kind: "markdown"; text: string };

export interface GeneratedAssetSet {
	files: GeneratedAsset[];
	/** Ready-made ZIP of every file, when generators can produce one. */
	zip?: { name: string; blob: Blob };
	install: InstallInstructions;
	warnings: DesignWarning[];
}

export interface FaviconExportOptions {
	appName: string;
	shortName: string;
	themeColor: string;
	bgColor: string;
	startUrl: string;
	assetPath: string;
	transparentBrowserIcon: boolean;
	webpBrowserIcons: boolean;
	optimize: boolean;
}

export type AppIconPlatform = "ios" | "android";

export interface AppIconExportOptions {
	platforms: AppIconPlatform[];
	iosDarkMode: { enabled: boolean; background: BackgroundSpec; foreground: string };
	iosTintedMode: { enabled: boolean; background: BackgroundSpec; foreground: string };
	monochrome: MonochromeSpec;
	optimize: boolean;
}
