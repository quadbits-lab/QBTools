/** Factory defaults and the eight OG templates. */
import type { IconDesign, OgDesign, OgTemplate, TextFont } from "./types";

export const OG_CANVAS_PRESETS = [
	{ slug: "og", label: "1200 × 630", width: 1200, height: 630 },
	{ slug: "square", label: "1080 × 1080", width: 1080, height: 1080 },
	{ slug: "banner", label: "1500 × 500", width: 1500, height: 500 },
] as const;

export const GRADIENTS: { name: string; from: string; to: string; angle: number }[] = [
	{ name: "Indigo", from: "#4f46e5", to: "#9333ea", angle: 135 },
	{ name: "Ocean", from: "#0ea5e9", to: "#22c55e", angle: 120 },
	{ name: "Sunset", from: "#f59e0b", to: "#ef4444", angle: 150 },
	{ name: "Slate", from: "#0f172a", to: "#334155", angle: 160 },
	{ name: "Berry", from: "#db2777", to: "#7c3aed", angle: 140 },
];

export const SOLIDS = [
	{ name: "Ink", color: "#0f172a" },
	{ name: "Paper", color: "#f8fafc" },
	{ name: "Forest", color: "#064e3b" },
	{ name: "Magenta", color: "#be185d" },
	{ name: "Cardinal", color: "#991b1b" },
];

export const OG_TEMPLATES: OgTemplate[] = [
	"minimal",
	"gradient",
	"split-image",
	"photo-overlay",
	"editorial",
	"product-card",
	"event",
	"logo-focus",
];

function textStyle(
	text: string,
	font: TextFont,
	size: number,
	color: string,
	x: number,
	y: number,
	width: number,
	align: "left" | "center" | "right",
	weight = 700,
): OgDesign["title"] {
	return {
		text,
		font,
		size,
		color,
		fontWeight: weight,
		letterSpacing: font === "Anton" || font === "Bebas Neue" ? 0.5 : 0,
		lineHeight: font === "Anton" || font === "Bebas Neue" ? 1.05 : 1.25,
		align,
		x,
		y,
		width,
		show: true,
		opacity: 1,
		outline: null,
	};
}

interface OgTemplateDefaults {
	title: {
		text: string;
		font: TextFont;
		size: number;
		color: string;
		x: number;
		y: number;
		width: number;
		align: "left" | "center" | "right";
	};
	subtitle: {
		text: string;
		color: string;
		size: number;
		x: number;
		y: number;
		width: number;
		align: "left" | "center" | "right";
		font: TextFont;
	};
	badge: {
		text: string;
		color: string;
		bg: string;
		shape: "pill" | "square" | "underline";
		size: number;
		x: number;
		y: number;
		show: boolean;
	};
	background: OgDesign["background"];
	overlay: number;
	padding: number;
	heroX: number;
	heroWidth: number;
	heroOpacity: number;
	heroFit: "cover" | "contain";
	logoHeight: number;
	logoX: number;
	logoY: number;
}

const T: Record<OgTemplate, OgTemplateDefaults> = {
	minimal: {
		title: {
			text: "Minimal, readable, fast",
			font: "Inter",
			size: 88,
			color: "#0f172a",
			x: 0,
			y: 0.42,
			width: 0.8,
			align: "left",
		},
		subtitle: {
			text: "Your product in one line",
			color: "#475569",
			size: 40,
			x: 0,
			y: 0.78,
			width: 0.7,
			align: "left",
			font: "Inter",
		},
		badge: {
			text: "",
			color: "#ffffff",
			bg: "#e2e8f0",
			shape: "pill",
			size: 30,
			x: 0,
			y: 0.06,
			show: false,
		},
		background: { type: "color", color: "#f8fafc" },
		overlay: 0.25,
		padding: 0.09,
		heroX: 0.6,
		heroWidth: 0.34,
		heroOpacity: 1,
		heroFit: "cover",
		logoHeight: 0.16,
		logoX: 0,
		logoY: 0,
	},
	gradient: {
		title: {
			text: "Ship your idea today",
			font: "Anton",
			size: 110,
			color: "#ffffff",
			x: 0,
			y: 0.42,
			width: 0.86,
			align: "left",
		},
		subtitle: {
			text: "qbtools.dev/build",
			color: "#e0e7ff",
			size: 38,
			x: 0,
			y: 0.8,
			width: 0.7,
			align: "left",
			font: "Inter",
		},
		badge: {
			text: "FEATURED",
			color: "#ffffff",
			bg: "#11182766",
			shape: "pill",
			size: 30,
			x: 0,
			y: 0.1,
			show: true,
		},
		background: { type: "gradient", from: "#4f46e5", to: "#9333ea", angle: 135 },
		overlay: 0.25,
		padding: 0.09,
		heroX: 0.65,
		heroWidth: 0.28,
		heroOpacity: 0.9,
		heroFit: "cover",
		logoHeight: 0.16,
		logoX: 0.74,
		logoY: 0,
	},
	"split-image": {
		title: {
			text: "Meet the new editor",
			font: "Inter",
			size: 84,
			color: "#111827",
			x: 0,
			y: 0.34,
			width: 0.9,
			align: "left",
		},
		subtitle: {
			text: "Layouts, colors and exports",
			color: "#64748b",
			size: 36,
			x: 0,
			y: 0.62,
			width: 0.9,
			align: "left",
			font: "Inter",
		},
		badge: {
			text: "UPDATE",
			color: "#ffffff",
			bg: "#2563eb",
			shape: "square",
			size: 28,
			x: 0,
			y: 0.08,
			show: true,
		},
		background: { type: "color", color: "#ffffff" },
		overlay: 0.2,
		padding: 0.09,
		heroX: 0.58,
		heroWidth: 0.42,
		heroOpacity: 1,
		heroFit: "cover",
		logoHeight: 0.14,
		logoX: 0,
		logoY: 0.88,
	},
	"photo-overlay": {
		title: {
			text: "Build in public",
			font: "Anton",
			size: 120,
			color: "#ffffff",
			x: 0,
			y: 0.56,
			width: 0.9,
			align: "left",
		},
		subtitle: {
			text: "Week 12 — the beta is live",
			color: "#f1f5f9",
			size: 40,
			x: 0,
			y: 0.78,
			width: 0.8,
			align: "left",
			font: "Inter",
		},
		badge: {
			text: "LIVE",
			color: "#ffffff",
			bg: "#dc2626",
			shape: "pill",
			size: 28,
			x: 0,
			y: 0.12,
			show: true,
		},
		background: { type: "color", color: "#0f172a" },
		overlay: 0.45,
		padding: 0.09,
		heroX: 0,
		heroWidth: 1,
		heroOpacity: 1,
		heroFit: "cover",
		logoHeight: 0.14,
		logoX: 0.78,
		logoY: 0.08,
	},
	editorial: {
		title: {
			text: "The long-form review",
			font: "Inter",
			size: 80,
			color: "#faf5e6",
			x: 0,
			y: 0.4,
			width: 0.86,
			align: "left",
		},
		subtitle: {
			text: "Issue 04 — March 2026",
			color: "#d6d3d1",
			size: 32,
			x: 0,
			y: 0.72,
			width: 0.7,
			align: "left",
			font: "DM Mono",
		},
		badge: {
			text: "Editor's pick",
			color: "#faf5e6",
			bg: "#a16207",
			shape: "underline",
			size: 26,
			x: 0,
			y: 0.1,
			show: true,
		},
		background: { type: "color", color: "#1c1917" },
		overlay: 0.25,
		padding: 0.1,
		heroX: 0.68,
		heroWidth: 0.3,
		heroOpacity: 0.85,
		heroFit: "cover",
		logoHeight: 0.18,
		logoX: 0.8,
		logoY: 0.06,
	},
	"product-card": {
		title: {
			text: "Studio One Pro",
			font: "Inter",
			size: 64,
			color: "#111827",
			x: 0,
			y: 0.06,
			width: 1,
			align: "center",
		},
		subtitle: {
			text: "$29 — lifetime license",
			color: "#6b7280",
			size: 32,
			x: 0,
			y: 0.56,
			width: 1,
			align: "center",
			font: "Inter",
		},
		badge: {
			text: "SALE",
			color: "#ffffff",
			bg: "#e11d48",
			shape: "pill",
			size: 26,
			x: 0.02,
			y: 0.12,
			show: true,
		},
		background: { type: "gradient", from: "#e0e7ff", to: "#c7d2fe", angle: 170 },
		overlay: 0.15,
		padding: 0.1,
		heroX: 0,
		heroWidth: 0.62,
		heroOpacity: 1,
		heroFit: "cover",
		logoHeight: 0.2,
		logoX: 0.02,
		logoY: 0.02,
	},
	event: {
		title: {
			text: "DEV CONF 2026",
			font: "Anton",
			size: 130,
			color: "#ffffff",
			x: 0,
			y: 0.16,
			width: 0.94,
			align: "center",
		},
		subtitle: {
			text: "DUBAI — 12 MARCH",
			color: "#fbbf24",
			size: 40,
			x: 0,
			y: 0.55,
			width: 1,
			align: "center",
			font: "DM Mono",
		},
		badge: {
			text: "",
			color: "#000000",
			bg: "#fbbf24",
			shape: "square",
			size: 30,
			x: 0.42,
			y: 0.02,
			show: false,
		},
		background: { type: "gradient", from: "#111827", to: "#312e81", angle: 180 },
		overlay: 0.3,
		padding: 0.08,
		heroX: 0,
		heroWidth: 0.3,
		heroOpacity: 0.95,
		heroFit: "cover",
		logoHeight: 0.2,
		logoX: 0,
		logoY: 0.02,
	},
	"logo-focus": {
		title: {
			text: "Northwind",
			font: "Inter",
			size: 72,
			color: "#f8fafc",
			x: 0,
			y: 0.78,
			width: 1,
			align: "center",
		},
		subtitle: {
			text: "",
			color: "#94a3b8",
			size: 32,
			x: 0,
			y: 0.9,
			width: 1,
			align: "center",
			font: "Inter",
		},
		badge: {
			text: "",
			color: "#ffffff",
			bg: "#0ea5e9",
			shape: "pill",
			size: 30,
			x: 0.4,
			y: 0.02,
			show: false,
		},
		background: { type: "gradient", from: "#0c4a6e", to: "#082f49", angle: 180 },
		overlay: 0.2,
		padding: 0.1,
		heroX: 0.4,
		heroWidth: 0.3,
		heroOpacity: 0.6,
		heroFit: "cover",
		logoHeight: 0.42,
		logoX: 0.5,
		logoY: 0.24,
	},
};

/** Default OG design for a template, with a placeholder hero. */
export function defaultOgDesign(template: OgTemplate): OgDesign {
	const t = T[template];
	return {
		tool: "og-banner",
		template,
		canvas: { width: 1200, height: 630 },
		background: t.background,
		overlay: t.overlay,
		padding: t.padding,
		logo: {
			source: null,
			height: t.logoHeight,
			x: t.logoX,
			y: t.logoY,
		},
		hero: {
			source: null,
			placement: {
				source: null,
				fit: t.heroFit,
				padding: 0,
				offsetX: 0,
				offsetY: 0,
				scale: 1,
				crop: { x: 0, y: 0, w: 1, h: 1 },
			},
			opacity: t.heroOpacity,
			x: t.heroX,
			width: t.heroWidth,
		},
		title: textStyle(
			t.title.text,
			t.title.font,
			t.title.size,
			t.title.color,
			t.title.x,
			t.title.y,
			t.title.width,
			t.title.align,
		),
		subtitle: textStyle(
			t.subtitle.text,
			t.subtitle.font,
			t.subtitle.size,
			t.subtitle.color,
			t.subtitle.x,
			t.subtitle.y,
			t.subtitle.width,
			t.subtitle.align,
			500,
		),
		badge: { ...t.badge },
	};
}

/** Shared icon design defaults for favicon and app icon editors. */
export function defaultIconDesign(tool: "favicon" | "app-icon"): IconDesign {
	return {
		tool,
		canvas: 1024,
		background:
			tool === "favicon"
				? { type: "gradient", from: "#4f46e5", to: "#9333ea", angle: 135 }
				: { type: "color", color: "#0f172a" },
		artwork: {
			source: null,
			fit: "contain",
			padding: tool === "favicon" ? 0.16 : 0.14,
			offsetX: 0,
			offsetY: 0,
			scale: 1,
			crop: { x: 0, y: 0, w: 1, h: 1 },
		},
		foreground: "#ffffff",
		monochrome: { mode: "alpha", threshold: 128 },
		dark: { background: { type: "color", color: "#111827" }, foreground: "#ffffff" },
		tinted: { background: { type: "color", color: "#f4f4f5" }, foreground: "#18181b" },
	};
}
