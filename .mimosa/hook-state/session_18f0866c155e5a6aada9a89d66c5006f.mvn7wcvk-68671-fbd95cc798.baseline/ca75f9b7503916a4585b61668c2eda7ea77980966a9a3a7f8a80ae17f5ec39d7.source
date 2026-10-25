/**
 * SVG composition for OG banners and icon artwork.
 *
 * All geometry is authored in canvas units; the final SVG declares the render
 * size in width/height attributes and resvg's fitTo scales the canvas, so
 * preview and export share one computation. Worker-safe: no DOM globals.
 */
import { measureTextWidth } from "./fonts";
import type {
	ArtworkData,
	ArtworkPlacement,
	BackgroundSpec,
	BadgeStyle,
	Box,
	DesignWarning,
	IconDesign,
	OgDesign,
	TextStyle,
} from "./types";

export function svgDataUrl(source: string): string {
	return `data:image/svg+xml,${encodeURIComponent(source)}`;
}

/** Resolved href for any artwork source. */
export function artworkHref(art: ArtworkData): string {
	return art.kind === "raster" ? art.src : svgDataUrl(art.src);
}

/** Escape text for inclusion in SVG markup. */
export function escapeXml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export interface GradientDef {
	id: string;
	from: string;
	to: string;
	/** CSS-like angle: 180 = to bottom, 90 = to right. */
	angle: number;
}

function gradientMarkup(defs: GradientDef[]): string {
	const parts = defs.map((g) => {
		const rad = ((g.angle - 90) * Math.PI) / 180;
		const x2 = Math.cos(rad) / 2;
		const y2 = Math.sin(rad) / 2;
		return (
			`<linearGradient id="${g.id}" x1="${(0.5 - x2).toFixed(4)}" y1="${(0.5 - y2).toFixed(4)}"` +
			` x2="${(0.5 + x2).toFixed(4)}" y2="${(0.5 + y2).toFixed(4)}">` +
			`<stop offset="0" stop-color="${g.from}"/><stop offset="1" stop-color="${g.to}"/></linearGradient>`
		);
	});
	return parts.length ? `<defs>${parts.join("")}</defs>` : "";
}

/** Resolve a background into its fill value, collecting gradient defs. */
export function backgroundFill(bg: BackgroundSpec, defs: GradientDef[]): string {
	switch (bg.type) {
		case "color":
			return bg.color;
		case "gradient": {
			const id = `bg-${defs.length}`;
			defs.push({ id, from: bg.from, to: bg.to, angle: bg.angle });
			return `url(#${id})`;
		}
		case "none":
			return "none";
	}
}

export { measureTextEmWidth, measureTextWidth } from "./fonts";

/** Wrap text into lines fitting maxWidth using shared glyph metrics. */
export function wrapTextLines(
	text: string,
	family: string,
	weight: number,
	size: number,
	maxWidth: number,
): string[] {
	const lines: string[] = [];
	for (const paragraph of text.split("\n")) {
		let line = "";
		for (const word of paragraph.split(" ")) {
			const candidate = line ? `${line} ${word}` : word;
			if (!line || !word || measureTextWidth(candidate, family, weight, size) <= maxWidth) {
				line = candidate;
			} else {
				lines.push(line);
				line = word;
			}
		}
		lines.push(line);
	}
	return lines;
}

/** Flag paragraphs that cannot fit the block width at all. */
export function textOverflowWarnings(
	text: string,
	family: string,
	weight: number,
	size: number,
	maxWidth: number,
): DesignWarning[] {
	for (const line of text.split("\n")) {
		if (measureTextWidth(line, family, weight, size) > maxWidth + size) {
			return [
				{ kind: "text-overflow", message: "Some text may overflow the visible area at this size." },
			];
		}
	}
	return [];
}

/**
 * Draw artwork into a box honoring fit/crop/scale/offset. Raster and vector
 * sources are embedded as <image preserveAspectRatio="none"> because all
 * fitting math happens here, keeping both source types consistent.
 */
export function artworkLayer(
	id: string,
	box: Box,
	placement: ArtworkPlacement,
	radius = 0,
): string {
	const art = placement.source;
	if (!art || box.w <= 1 || box.h <= 1) return "";
	const crop = placement.crop;
	const srcW = art.width * crop.w;
	const srcH = art.height * crop.h;
	if (!srcW || !srcH) return "";
	let sx: number;
	let sy: number;
	if (placement.fit === "cover") {
		sx = sy = Math.max(box.w / srcW, box.h / srcH);
	} else if (placement.fit === "contain") {
		sx = sy = Math.min(box.w / srcW, box.h / srcH);
	} else {
		sx = box.w / srcW;
		sy = box.h / srcH;
	}
	const dw = srcW * sx * placement.scale;
	const dh = srcH * sy * placement.scale;
	if (dw <= 0 || dh <= 0) return "";
	// Draw the full source so its cropped region lands on the box.
	const fw = dw / Math.max(crop.w, 0.001);
	const fh = dh / Math.max(crop.h, 0.001);
	const centerX = box.x + box.w / 2 + placement.offsetX * box.w;
	const centerY = box.y + box.h / 2 + placement.offsetY * box.h;
	const ix = centerX - (crop.x + crop.w / 2) * fw;
	const iy = centerY - (crop.y + crop.h / 2) * fh;
	const r = Math.max(0, Math.round(radius));
	const clipAttrs =
		`x="${box.x.toFixed(2)}" y="${box.y.toFixed(2)}" width="${box.w.toFixed(2)}"` +
		` height="${box.h.toFixed(2)}"${r ? ` rx="${r}"` : ""}`;
	const image =
		`<image href="${artworkHref(art)}" x="${ix.toFixed(2)}" y="${iy.toFixed(2)}"` +
		` width="${fw.toFixed(2)}" height="${fh.toFixed(2)}" preserveAspectRatio="none"/>`;
	return (
		`<defs><clipPath id="clip-${id}"><rect ${clipAttrs}/></clipPath></defs>` +
		`<g clip-path="url(#clip-${id})">${image}</g>`
	);
}

/**
 * Nest an SVG artwork source honoring the same fit/crop/scale/offset math as
 * artworkLayer, keeping the artwork as true vectors (used by favicon.svg).
 */
export function vectorNestedLayer(
	source: { svg: string; viewBox: { x: number; y: number; w: number; h: number } },
	box: Box,
	placement: ArtworkPlacement,
): string {
	const crop = placement.crop;
	const srcW = source.viewBox.w * crop.w;
	const srcH = source.viewBox.h * crop.h;
	if (!srcW || !srcH) return "";
	let sx: number;
	let sy: number;
	if (placement.fit === "cover") sx = sy = Math.max(box.w / srcW, box.h / srcH);
	else if (placement.fit === "contain") sx = sy = Math.min(box.w / srcW, box.h / srcH);
	else {
		sx = box.w / srcW;
		sy = box.h / srcH;
	}
	const dw = srcW * sx * placement.scale;
	const dh = srcH * sy * placement.scale;
	if (dw <= 0 || dh <= 0) return "";
	const centerX = box.x + box.w / 2 + placement.offsetX * box.w;
	const centerY = box.y + box.h / 2 + placement.offsetY * box.h;
	const x = centerX - dw / 2;
	const y = centerY - dh / 2;
	const vb = [
		(source.viewBox.x + source.viewBox.w * crop.x).toFixed(3),
		(source.viewBox.y + source.viewBox.h * crop.y).toFixed(3),
		(source.viewBox.w * crop.w).toFixed(3),
		(source.viewBox.h * crop.h).toFixed(3),
	].join(" ");
	return (
		`<svg x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${dw.toFixed(2)}" height="${dh.toFixed(2)}"` +
		` viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${source.svg}</svg>`
	);
}

/** Render a wrapped text block inside its frame. */
export function textLayer(style: TextStyle, frame: Box, maxLines = 24): string {
	if (style.show === false || !style.text.trim()) return "";
	const blockW = Math.max(style.width * frame.w, 40);
	const lines = wrapTextLines(style.text, style.font, style.fontWeight, style.size, blockW).slice(
		0,
		maxLines,
	);
	const lineHeight = style.size * style.lineHeight;
	const blockH = Math.max(style.size, lines.length * style.size * style.lineHeight);
	const anchor = style.align === "left" ? "start" : style.align === "right" ? "end" : "middle";
	const blockX = frame.x + style.x * Math.max(0, frame.w - blockW);
	const blockY = frame.y + style.y * Math.max(0, frame.h - blockH);
	const anchorX =
		anchor === "start" ? blockX : anchor === "middle" ? blockX + blockW / 2 : blockX + blockW;
	const tspanAttrs = `x="${anchorX.toFixed(2)}" text-anchor="${anchor}"`;
	const tspans = lines
		.map(
			(line, i) =>
				`<tspan ${tspanAttrs} y="${(blockY + style.size + i * lineHeight).toFixed(2)}">${escapeXml(line)}</tspan>`,
		)
		.join("");
	const outline =
		style.outline && style.outline.width > 0
			? ` stroke="${style.outline.color}" stroke-width="${style.outline.width.toFixed(2)}"` +
				` paint-order="stroke" stroke-linejoin="round"`
			: "";
	const text =
		`<text font-family="${style.font}" font-size="${style.size.toFixed(2)}" font-weight="${style.fontWeight}"` +
		` fill="${style.color}" letter-spacing="${style.letterSpacing.toFixed(2)}"${outline}>${tspans}</text>`;
	return withOpacity(text, style.opacity ?? 1);
}

/** Render a badge (pill, square or underline) sized to its label. */
export function badgeLayer(badge: BadgeStyle, frame: Box): string {
	if (!badge.show || !badge.text.trim()) return "";
	const textW = measureTextWidth(badge.text, "Inter", 700, badge.size);
	const padX = badge.size * 0.8;
	const padY = badge.size * 0.45;
	const w = textW + padX * 2;
	const h = badge.size + padY * 2;
	const x = frame.x + badge.x * Math.max(0, frame.w - w);
	const y = frame.y + badge.y * Math.max(0, frame.h - h - badge.size);
	const label = escapeXml(badge.text);
	if (badge.shape === "underline") {
		return (
			`<text font-family="Inter" font-size="${badge.size}" font-weight="700" fill="${badge.bg}"` +
			` letter-spacing="${(badge.size * 0.08).toFixed(2)}" text-anchor="middle">` +
			`<tspan x="${(x + w / 2).toFixed(2)}" y="${(y + badge.size).toFixed(2)}">${label}</tspan></text>` +
			`<rect x="${x.toFixed(2)}" y="${(y + badge.size * 1.3).toFixed(2)}"` +
			` width="${w.toFixed(2)}" height="${Math.max(2, badge.size * 0.09).toFixed(2)}"` +
			` rx="${(badge.size * 0.05).toFixed(2)}" fill="${badge.bg}"/>`
		);
	}
	const radius = badge.shape === "pill" ? h / 2 : badge.size * 0.12;
	return (
		`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}"` +
		` rx="${radius.toFixed(2)}" fill="${badge.bg}"/>` +
		`<text font-family="Inter" font-size="${badge.size}" font-weight="700" fill="${badge.color}" text-anchor="middle">` +
		`<tspan x="${(x + w / 2).toFixed(2)}" y="${(y + h / 2 + badge.size * 0.36).toFixed(2)}">${label}</tspan></text>`
	);
}

/** Content frame inside canvas padding. */
export function contentFrame(w: number, h: number, pad: number): Box {
	const px = Math.min(w, h) * Math.max(0, Math.min(0.25, pad));
	return { x: px, y: px * 0.7, w: Math.max(8, w - 2 * px), h: Math.max(8, h - 1.4 * px) };
}

/** Wrap markup in an opacity group. */
function withOpacity(svg: string, opacity: number): string {
	return opacity === 1
		? svg
		: `<g opacity="${Math.max(0, Math.min(1, opacity)).toFixed(3)}">${svg}</g>`;
}

/** Full-bleed background rect. */
function bgRect(w: number, h: number, bg: BackgroundSpec): string {
	const defs: GradientDef[] = [];
	const fill = backgroundFill(bg, defs);
	return (
		gradientMarkup(defs) +
		(fill === "none" ? "" : `<rect width="${w}" height="${h}" fill="${fill}"/>`)
	);
}

/** Low-resolution raster warning against the box it is drawn into. */
function lowResWarning(art: ArtworkData, box: Box, scale = 2): DesignWarning[] {
	if (art.kind !== "raster" || !art.intrinsicWidth || !art.intrinsicHeight) return [];
	const wanted = box.w * box.h * scale * scale;
	if (art.intrinsicWidth * art.intrinsicHeight < wanted * 0.5) {
		return [
			{
				kind: "low-resolution",
				message: "The image is smaller than the full-size export, so it may look soft.",
			},
		];
	}
	return [];
}

/** Resolved geometry for one OG design — the single source of layout truth. */
export interface OgLayout {
	/** Content frame inside the canvas padding. */
	frame: Box;
	/** Frame the title/subtitle/badge position within (template-dependent). */
	textFrame: Box;
	hero: Box | null;
	/** True when the hero covers the whole canvas (full-bleed scrim). */
	heroFullBleed: boolean;
	heroRadius: number;
	/** White card drawn behind the hero (product-card template). */
	heroCard: Box | null;
	/** Dark scrim over the hero, resolved from the overlay slider. */
	scrim: { box: Box; opacity: number } | null;
	title: Box | null;
	subtitle: Box | null;
	badge: Box | null;
	logo: Box | null;
}

/**
 * Compute every element box for an OG design exactly once. composeOgSvg draws
 * from this layout and ogElementBoxes surfaces it to the editor, so canvas
 * overlays always match the rendered output.
 */
export function layoutOg(design: OgDesign): OgLayout {
	const W = design.canvas.width;
	const H = design.canvas.height;
	const frame = contentFrame(W, H, design.padding);
	const hero = design.hero.placement.source;

	let heroBox: Box | null = null;
	let heroFullBleed = false;
	let heroRadius = 0;
	let heroCard: Box | null = null;
	if (hero) {
		switch (design.template) {
			case "split-image": {
				const x = design.hero.x * (W - frame.x * 2);
				heroBox = { x: frame.x + x, y: 0, w: Math.max(W * 0.12, design.hero.width * W), h: H };
				break;
			}
			case "event": {
				const h = Math.max(H * 0.12, design.hero.width * H);
				heroBox = { x: 0, y: H - h, w: W, h };
				break;
			}
			case "product-card": {
				const cardW = Math.min(W * 0.92, Math.max(W * 0.34, W * design.hero.width * 0.7));
				const cardH = H * 0.86;
				const cardX = (W - cardW) / 2 + design.hero.x * (W - cardW) * 0.4;
				const cardY = (H - cardH) / 2;
				const inset = cardW * 0.05;
				heroCard = { x: cardX, y: cardY, w: cardW, h: cardH };
				heroRadius = cardW * 0.04;
				heroBox = { x: cardX + inset, y: cardY + inset, w: cardW - 2 * inset, h: cardH * 0.58 };
				break;
			}
			default:
				heroFullBleed = true;
				heroBox = { x: 0, y: 0, w: W, h: H };
		}
	}

	let textFrame = frame;
	if (hero && heroBox && design.template === "split-image") {
		textFrame = {
			x: frame.x,
			y: frame.y,
			w: Math.max(60, heroBox.x - frame.x - W * 0.04),
			h: frame.h,
		};
	} else if (hero && heroBox && design.template === "product-card") {
		const inset = Math.max(8, heroBox.w * 0.06);
		const left = heroBox.x - inset;
		const right = heroBox.x + heroBox.w + inset;
		textFrame = {
			x: left,
			y: heroBox.y + heroBox.h + inset * 0.8,
			w: Math.max(60, right - left),
			h: Math.max(40, frame.y + frame.h - (heroBox.y + heroBox.h)),
		};
	} else if (hero && heroBox && design.template === "event") {
		textFrame = { x: frame.x, y: frame.y, w: frame.w, h: Math.max(40, heroBox.y - frame.y) };
	}

	const blockBox = (style: TextStyle): Box | null => {
		if (style.show === false || !style.text.trim()) return null;
		const blockW = Math.max(style.width * textFrame.w, 40);
		const lines = wrapTextLines(style.text, style.font, style.fontWeight, style.size, blockW).slice(
			0,
			24,
		);
		const blockH = Math.max(style.size, lines.length * style.size * style.lineHeight);
		return {
			x: textFrame.x + style.x * Math.max(0, textFrame.w - blockW),
			y: textFrame.y + style.y * Math.max(0, textFrame.h - blockH),
			w: blockW,
			h: blockH,
		};
	};

	let logoBox: Box | null = null;
	if (design.logo.source) {
		const art = design.logo.source;
		const logoH = design.logo.height * H * 0.4;
		const logoW = logoH * (art.width / Math.max(art.height, 1));
		const width = Math.min(logoW, frame.w * 0.8);
		const height = width * (art.height / Math.max(art.width, 1));
		logoBox = {
			x: frame.x + design.logo.x * (frame.w - width),
			y: frame.y + design.logo.y * (frame.h - height),
			w: width,
			h: height,
		};
	}

	let badge: Box | null = null;
	if (design.badge.show && design.badge.text.trim()) {
		const badgeW =
			measureTextWidth(design.badge.text, "Inter", 700, design.badge.size) +
			design.badge.size * 1.6;
		const badgeH = design.badge.size * 1.9;
		badge = {
			x: textFrame.x + design.badge.x * Math.max(0, textFrame.w - badgeW),
			y: textFrame.y + design.badge.y * Math.max(0, textFrame.h - badgeH - design.badge.size),
			w: badgeW,
			h: badgeH,
		};
	}

	const scrim =
		hero && heroBox && design.overlay > 0
			? heroFullBleed
				? { box: { x: 0, y: 0, w: W, h: H }, opacity: design.overlay * 0.8 }
				: { box: heroBox, opacity: design.overlay * 0.5 }
			: null;

	return {
		frame,
		textFrame,
		hero: heroBox,
		heroFullBleed,
		heroRadius,
		heroCard,
		scrim,
		title: blockBox(design.title),
		subtitle: blockBox(design.subtitle),
		badge,
		logo: logoBox,
	};
}

/**
 * Element boxes in canvas units for editor overlays — derived from the same
 * layout the composer draws from, so handles always match the render.
 */
export function ogElementBoxes(design: OgDesign): {
	title: Box | null;
	subtitle: Box | null;
	badge: Box | null;
	logo: Box | null;
	hero: Box | null;
} {
	const layout = layoutOg(design);
	return {
		title: layout.title,
		subtitle: layout.subtitle,
		badge: layout.badge,
		logo: layout.logo,
		hero: layout.hero,
	};
}

/** Content frame used by editors for numeric-position labels. */
export function ogContentFrame(design: OgDesign): Box {
	return contentFrame(design.canvas.width, design.canvas.height, design.padding);
}

/**
 * Compose the OG banner SVG in canvas units plus layout warnings.
 * Callers render at any size via resvg fitTo.
 */
export function composeOgSvg(design: OgDesign): { svg: string; warnings: DesignWarning[] } {
	const W = design.canvas.width;
	const H = design.canvas.height;
	const layout = layoutOg(design);
	const parts: string[] = [];
	const warnings: DesignWarning[] = [];

	// 1. Background; product-card draws a white card over it for the hero.
	parts.push(bgRect(W, H, design.background));
	if (layout.heroCard) {
		parts.push(
			`<rect x="${layout.heroCard.x.toFixed(2)}" y="${layout.heroCard.y.toFixed(2)}"` +
				` width="${layout.heroCard.w.toFixed(2)}" height="${layout.heroCard.h.toFixed(2)}"` +
				` rx="${layout.heroRadius.toFixed(2)}" fill="#ffffff"/>`,
		);
	}

	// 2. Hero artwork + scrim.
	if (layout.hero && design.hero.placement.source) {
		parts.push(
			withOpacity(
				artworkLayer("hero", layout.hero, design.hero.placement, layout.heroRadius),
				design.hero.opacity,
			),
		);
	}
	if (layout.scrim) {
		const s = layout.scrim;
		parts.push(
			`<rect x="${s.box.x.toFixed(2)}" y="${s.box.y.toFixed(2)}" width="${s.box.w.toFixed(2)}"` +
				` height="${s.box.h.toFixed(2)}" fill="#000000" opacity="${s.opacity.toFixed(3)}"/>`,
		);
	}

	// 3. Logo.
	if (design.logo.source && layout.logo) {
		parts.push(
			`<image href="${artworkHref(design.logo.source)}" x="${layout.logo.x.toFixed(2)}"` +
				` y="${layout.logo.y.toFixed(2)}" width="${layout.logo.w.toFixed(2)}"` +
				` height="${layout.logo.h.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`,
		);
	}

	// 4. Badge + text layers (each skips itself when hidden or empty).
	parts.push(badgeLayer(design.badge, layout.textFrame));
	parts.push(textLayer(design.title, layout.textFrame));
	parts.push(textLayer(design.subtitle, layout.textFrame));

	// 5. Warnings.
	const t = design.title;
	const s = design.subtitle;
	if (t.show !== false)
		warnings.push(
			...textOverflowWarnings(
				t.text,
				t.font,
				t.fontWeight,
				t.size,
				Math.max(40, t.width * layout.textFrame.w),
			),
		);
	if (s.show !== false)
		warnings.push(
			...textOverflowWarnings(
				s.text,
				s.font,
				s.fontWeight,
				s.size,
				Math.max(40, s.width * layout.textFrame.w),
			),
		);
	if (design.hero.placement.source)
		warnings.push(
			...lowResWarning(design.hero.placement.source, layout.hero ?? { x: 0, y: 0, w: W, h: H }),
		);

	return {
		svg:
			`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
			parts.join("") +
			`</svg>`,
		warnings,
	};
}

/**
 * Compose a square icon (favicon, app icon). Background and artwork honor the
 * design padding; corners stay square — platform rounding is preview-only.
 */
export function composeIconSvg(design: IconDesign): string {
	const size = design.canvas;
	const inset = size * Math.max(0, Math.min(0.45, design.artwork.padding));
	const box: Box = { x: inset, y: inset, w: size - 2 * inset, h: size - 2 * inset };
	const defs: GradientDef[] = [];
	const bgFill = backgroundFill(design.background, defs);
	const layer = artworkLayer("icon", box, design.artwork);
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
		gradientMarkup(defs) +
		(bgFill === "none" ? "" : `<rect width="${size}" height="${size}" fill="${bgFill}"/>`) +
		layer +
		`</svg>`
	);
}
