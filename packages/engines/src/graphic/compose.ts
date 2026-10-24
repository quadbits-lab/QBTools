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
	if (!style.text.trim()) return "";
	const blockW = Math.max(style.width * frame.w, 40);
	const lines = wrapTextLines(style.text, style.font, style.fontWeight, style.size, blockW).slice(
		0,
		maxLines,
	);
	const lineHeight = style.size * style.lineHeight;
	const anchor = style.align === "left" ? "start" : style.align === "right" ? "end" : "middle";
	const blockX = frame.x + style.x * Math.max(0, frame.w - blockW);
	const blockY = frame.y + style.y * Math.max(0, frame.h - style.size);
	const anchorX =
		anchor === "start" ? blockX : anchor === "middle" ? blockX + blockW / 2 : blockX + blockW;
	const tspanAttrs = `x="${anchorX.toFixed(2)}" text-anchor="${anchor}"`;
	const tspans = lines
		.map(
			(line, i) =>
				`<tspan ${tspanAttrs} y="${(blockY + style.size + i * lineHeight).toFixed(2)}">${escapeXml(line)}</tspan>`,
		)
		.join("");
	const family = style.font === "Inter" && style.fontWeight >= 600 ? "Inter Semi" : style.font;
	return (
		`<text font-family="${family}" font-size="${style.size.toFixed(2)}" font-weight="${style.fontWeight}"` +
		` fill="${style.color}" letter-spacing="${style.letterSpacing.toFixed(2)}">${tspans}</text>`
	);
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

/**
 * Element boxes in canvas units — the exact math used by composeOgSvg, so
 * editor drag handles line up with the rendered output.
 */
export function ogElementBoxes(design: OgDesign): {
	title: Box;
	subtitle: Box;
	badge: Box;
	logo: Box | null;
	hero: Box | null;
} {
	const W = design.canvas.width;
	const H = design.canvas.height;
	const frame = contentFrame(W, H, design.padding);
	let heroBox: Box | null = null;
	if (design.hero.placement.source) {
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
				heroBox = { x: cardX + inset, y: cardY + inset, w: cardW - 2 * inset, h: cardH * 0.58 };
				break;
			}
			default:
				heroBox = { x: 0, y: 0, w: W, h: H };
		}
	}
	let textFrame = frame;
	if (design.hero.placement.source && design.template === "split-image" && heroBox) {
		textFrame = {
			x: frame.x,
			y: frame.y,
			w: Math.max(60, heroBox.x - frame.x - W * 0.04),
			h: frame.h,
		};
	} else if (design.hero.placement.source && design.template === "product-card" && heroBox) {
		const inset = Math.max(8, heroBox.w * 0.06);
		textFrame = {
			x: heroBox.x - inset,
			y: heroBox.y + heroBox.h + inset * 0.8,
			w: Math.max(60, heroBox.w + 2 * inset),
			h: Math.max(40, frame.y + frame.h - (heroBox.y + heroBox.h)),
		};
	} else if (design.hero.placement.source && design.template === "event" && heroBox) {
		textFrame = { x: frame.x, y: frame.y, w: frame.w, h: Math.max(40, heroBox.y - frame.y) };
	}
	const blockBox = (style: TextStyle): Box => {
		const blockW = Math.max(style.width * textFrame.w, 40);
		const lines = wrapTextLines(style.text, style.font, style.fontWeight, style.size, blockW).slice(
			0,
			24,
		);
		const blockX = textFrame.x + style.x * Math.max(0, textFrame.w - blockW);
		return {
			x: blockX,
			y: textFrame.y + style.y * Math.max(0, textFrame.h - style.size),
			w: blockW,
			h: Math.max(style.size, lines.length * style.size * style.lineHeight),
		};
	};
	let logoBox: Box | null = null;
	if (design.logo.source) {
		const art = design.logo.source;
		const logoH = design.logo.height * H * 0.4;
		const logoW = logoH * (art.width / Math.max(art.height, 1));
		const maxLogoW = frame.w * 0.8;
		const width = Math.min(logoW, maxLogoW);
		const height = width * (art.height / Math.max(art.width, 1));
		logoBox = {
			x: frame.x + design.logo.x * (frame.w - width),
			y: frame.y + design.logo.y * (frame.h - height),
			w: width,
			h: height,
		};
	}
	const badgeW =
		measureTextWidth(design.badge.text, "Inter", 700, design.badge.size) + design.badge.size * 1.6;
	const badgeH = design.badge.size * 1.9;
	return {
		title: blockBox(design.title),
		subtitle: blockBox(design.subtitle),
		badge: {
			x: textFrame.x + design.badge.x * Math.max(0, textFrame.w - badgeW),
			y: textFrame.y + design.badge.y * Math.max(0, textFrame.h - badgeH - design.badge.size),
			w: badgeW,
			h: badgeH,
		},
		logo: logoBox,
		hero: heroBox,
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
	const frame = contentFrame(W, H, design.padding);
	const parts: string[] = [];
	const warnings: DesignWarning[] = [];

	// 1. Hero layer per template.
	const hero = design.hero.placement.source;
	let heroBox: Box | null = null;
	let heroRadius = 0;
	let scrimArea: Box | null = null;
	if (hero) {
		switch (design.template) {
			case "split-image": {
				const x = design.hero.x * (W - frame.x * 2);
				const w = Math.max(W * 0.12, design.hero.width * W);
				heroBox = { x: frame.x + x, y: 0, w: w, h: H };
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
				heroBox = { x: cardX + inset, y: cardY + inset, w: cardW - 2 * inset, h: cardH * 0.58 };
				heroRadius = cardW * 0.04;
				scrimArea = heroBox;
				// Text sits below the hero inside the card.
				parts.push(
					bgRect(W, H, design.background) +
						`<rect x="${cardX.toFixed(2)}" y="${cardY.toFixed(2)}" width="${cardW.toFixed(2)}"` +
						` height="${cardH.toFixed(2)}" rx="${heroRadius.toFixed(2)}" fill="#ffffff"/>`,
				);
				break;
			}
			default:
				heroBox = { x: 0, y: 0, w: W, h: H };
		}
		if (heroBox) {
			if (design.template !== "product-card") {
				parts.push(bgRect(W, H, design.background));
			}
			parts.push(
				withOpacity(
					artworkLayer("hero", heroBox, design.hero.placement, heroRadius),
					design.hero.opacity,
				),
			);
			if (design.template === "photo-overlay") {
				parts.push(
					`<rect width="${W}" height="${H}" fill="#000000" opacity="${(design.overlay * 0.8).toFixed(3)}"/>`,
				);
			} else if (scrimArea) {
				parts.push(
					`<rect x="${scrimArea.x.toFixed(2)}" y="${scrimArea.y.toFixed(2)}"` +
						` width="${scrimArea.w.toFixed(2)}" height="${scrimArea.h.toFixed(2)}"` +
						` fill="#000000" opacity="${(design.overlay * 0.5).toFixed(3)}"/>`,
				);
			}
		}
	} else {
		parts.push(bgRect(W, H, design.background));
	}

	// 2. Text frame depends on template.
	let textFrame = frame;
	if (hero && design.template === "split-image" && heroBox) {
		textFrame = {
			x: frame.x,
			y: frame.y,
			w: Math.max(60, heroBox.x - frame.x - W * 0.04),
			h: frame.h,
		};
	}
	if (hero && design.template === "product-card" && heroBox) {
		const inset = Math.max(8, heroBox.w * 0.06);
		const cardRight = heroBox.x + heroBox.w + inset;
		const left = heroBox.x - inset;
		textFrame = {
			x: left,
			y: heroBox.y + heroBox.h + inset * 0.8,
			w: Math.max(60, cardRight - left),
			h: Math.max(40, frame.y + frame.h - (heroBox.y + heroBox.h)),
		};
	}
	if (hero && design.template === "event" && heroBox) {
		textFrame = { x: frame.x, y: frame.y, w: frame.w, h: Math.max(40, heroBox.y - frame.y) };
	}

	// 3. Logo.
	if (design.logo.source) {
		const art = design.logo.source;
		const logoH = design.logo.height * H * 0.4;
		const logoW = logoH * (art.width / Math.max(art.height, 1));
		const maxLogoW = frame.w * 0.8;
		const width = Math.min(logoW, maxLogoW);
		const height = width * (art.height / Math.max(art.width, 1));
		const lx = frame.x + design.logo.x * (frame.w - width);
		const ly = frame.y + design.logo.y * (frame.h - height);
		parts.push(
			`<image href="${artworkHref(art)}" x="${lx.toFixed(2)}" y="${ly.toFixed(2)}"` +
				` width="${width.toFixed(2)}" height="${height.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`,
		);
	}

	// 4. Badge + text.
	parts.push(badgeLayer(design.badge, textFrame));
	parts.push(textLayer(design.title, textFrame));
	parts.push(textLayer(design.subtitle, textFrame));

	// 5. Warnings.
	const t = design.title;
	const s = design.subtitle;
	warnings.push(
		...textOverflowWarnings(
			t.text,
			t.font,
			t.fontWeight,
			t.size,
			Math.max(40, t.width * textFrame.w),
		),
		...textOverflowWarnings(
			s.text,
			s.font,
			s.fontWeight,
			s.size,
			Math.max(40, s.width * textFrame.w),
		),
	);
	if (hero) warnings.push(...lowResWarning(hero, heroBox ?? { x: 0, y: 0, w: W, h: H }));

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
