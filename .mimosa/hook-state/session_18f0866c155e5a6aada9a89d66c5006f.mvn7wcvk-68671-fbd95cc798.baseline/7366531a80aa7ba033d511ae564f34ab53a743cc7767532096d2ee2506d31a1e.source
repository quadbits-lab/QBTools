/** Main-thread design helpers: SVG sanitization and artwork normalization. */
import DOMPurify from "dompurify";
import { decodeImage } from "../image";
import type { ArtworkData, ArtworkPlacement } from "./types";

export const SVG_BYTES_LIMIT = 2 * 1024 * 1024;
export const RASTER_BYTES_LIMIT = 20 * 1024 * 1024;
export const MAX_RASTER_EDGE = 8192;

const EXTERNAL_URI = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const SAFE_DATA_URI = /^data:(?:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml)|font\/)/i;

/** Remove scripts, event handlers, embedded HTML and external resources. */
export function sanitizeSvgSource(source: string): string {
	const cleaned = DOMPurify.sanitize(source, {
		USE_PROFILES: { svg: true, svgFilters: true, html: false },
		FORBID_TAGS: [
			"script",
			"style",
			"foreignObject",
			"iframe",
			"object",
			"embed",
			"audio",
			"video",
			"canvas",
		],
		FORBID_CONTENTS: ["script", "style", "foreignObject"],
	});
	const doc = new DOMParser().parseFromString(cleaned, "image/svg+xml");
	if (doc.querySelector("parsererror")) {
		throw new Error("This SVG file could not be parsed.");
	}
	doc.querySelectorAll("*").forEach((node) => {
		const el = node as Element;
		for (const attr of [...el.attributes]) {
			const value = attr.value.trim();
			if (attr.name === "xmlns" || attr.name === "xmlns:xlink") continue;
			if (attr.name === "href" || attr.name === "xlink:href") {
				// Only data URIs and internal fragments survive resource rules.
				if (SAFE_DATA_URI.test(value) || value.startsWith("#")) continue;
				el.removeAttribute(attr.name);
				continue;
			}
			if (/^(?:on|src)/i.test(attr.name) && attr.name !== "srcset") {
				el.removeAttribute(attr.name);
				continue;
			}
			if (attr.name === "style" && EXTERNAL_URI.test(value.replace(/\s/g, ""))) {
				el.removeAttribute("style");
			}
		}
	});
	return new XMLSerializer().serializeToString(doc.documentElement);
}

/** Explicit, supported dimensions from markup; rejects unknown-size SVGs. */
function svgDimensions(source: string): { width: number; height: number } | null {
	const doc = new DOMParser().parseFromString(source, "image/svg+xml");
	const svg = doc.documentElement;
	const width = Number.parseFloat(svg.getAttribute("width") ?? "");
	const height = Number.parseFloat(svg.getAttribute("height") ?? "");
	if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
		return { width, height };
	}
	const viewBox = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
	if (viewBox.length === 4 && viewBox.every((n) => Number.isFinite(n))) {
		const [x, y, w, h] = viewBox as [number, number, number, number];
		return { width: Math.max(1, w - x), height: Math.max(1, h - y) };
	}
	return null;
}

/** Sanitize and normalize an uploaded or pasted SVG artwork source. */
export function normalizeSvgArtwork(source: string, name?: string): ArtworkData {
	const sanitized = sanitizeSvgSource(source);
	const dims = svgDimensions(sanitized);
	if (!dims) throw new Error("This SVG has no usable size (width, height or viewBox).");
	// Give every source explicit dimensions so fitting behaves like raster art.
	const doc = new DOMParser().parseFromString(sanitized, "image/svg+xml");
	const svg = doc.documentElement;
	svg.setAttribute("width", String(Math.max(1, Math.round(dims.width))));
	svg.setAttribute("height", String(Math.max(1, Math.round(dims.height))));
	const normalized = new XMLSerializer().serializeToString(svg);
	return {
		kind: "svg",
		src: normalized,
		width: dims.width,
		height: dims.height,
		name,
	};
}

/** Decode any browser-supported raster (incl. HEIC) into an embedded PNG artwork. */
export async function normalizeRasterArtwork(
	file: Blob & { name?: string; type?: string },
	options: { maxHeight?: number } = {},
): Promise<ArtworkData> {
	if (file.size > RASTER_BYTES_LIMIT) {
		throw new Error("Images are limited to 20 MB. Compress it first, then try again.");
	}
	const bitmap = await decodeImage(file);
	if (bitmap.width * bitmap.height > 24_000_000) {
		bitmap.close?.();
		throw new Error("This image exceeds 24 megapixels. Resize it first.");
	}
	const maxEdge = options.maxHeight ?? 4096;
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas is unavailable in this browser.");
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close?.();
	const src = canvas.toDataURL("image/png");
	return {
		kind: "raster",
		src,
		width,
		height,
		intrinsicWidth: width,
		intrinsicHeight: height,
		name: file.name,
	};
}

/** Build icon artwork from a lucide icon node (sanitized), baking the color. */
export function iconArtworkFromSource(
	source: string,
	viewBox: { w: number; h: number },
	color: string,
	name?: string,
): ArtworkData {
	const sanitized = sanitizeSvgSource(source);
	const doc = new DOMParser().parseFromString(sanitized, "image/svg+xml");
	const svg = doc.documentElement;
	// Remove fixed width/height, bake the requested color, keep the viewBox.
	svg.removeAttribute("width");
	svg.removeAttribute("height");
	svg.querySelectorAll("*").forEach((el) => {
		if (el.getAttribute("stroke") === "currentColor") el.setAttribute("stroke", color);
		if (el.getAttribute("fill") === "currentColor") el.setAttribute("fill", color);
	});
	if (svg.getAttribute("stroke") === "currentColor") svg.setAttribute("stroke", color);
	if (svg.getAttribute("fill") === "currentColor") svg.setAttribute("fill", color);
	svg.setAttribute("width", String(Math.round(viewBox.w)));
	svg.setAttribute("height", String(Math.round(viewBox.h)));
	const src = new XMLSerializer().serializeToString(svg);
	const hasColor = src.includes(color);
	if (!hasColor) {
		// No currentColor found (fill-based path): force fill/stroke attributes.
		const recolored = src.replace(/(<svg[^>]*?)>/, `$1 fill="${color}" stroke="${color}">`);
		return {
			kind: "icon",
			src: recolored,
			width: viewBox.w,
			height: viewBox.h,
			name,
		};
	}
	return {
		kind: "icon",
		src,
		width: viewBox.w,
		height: viewBox.h,
		name,
	};
}

export function defaultArtworkPlacement(): ArtworkPlacement {
	return {
		source: null,
		fit: "contain",
		padding: 0.14,
		offsetX: 0,
		offsetY: 0,
		scale: 1,
		crop: { x: 0, y: 0, w: 1, h: 1 },
	};
}
