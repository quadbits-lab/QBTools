/** High-level design rendering entry points shared by all three editors. */
import { checkAbort, type ProcessingOptions, progress } from "../processing";
import { composeIconSvg, composeOgSvg } from "./compose";
import type { GraphicAssets } from "./fonts";
import { renderSvg } from "./resvg";
import type { DesignSettings, IconDesign, OgDesign, RenderedDesign, RenderOptions } from "./types";

/** Collect font families referenced by a design for resvg. */
export function designFontFamilies(settings: DesignSettings): Array<{
	family: string;
	weight: number;
}> {
	const families = new Map<string, number>();
	if (settings.tool === "og-banner") {
		for (const style of [settings.design.title, settings.design.subtitle]) {
			families.set(style.font, Math.max(families.get(style.font) ?? 0, style.fontWeight));
		}
	} else {
		const art = settings.design.artwork.source;
		if (art && (art.kind === "initials" || art.kind === "text")) {
			families.set(
				art.fontFamily ?? "Inter",
				Math.max(families.get(art.fontFamily ?? "Inter") ?? 0, art.fontWeight ?? 700),
			);
		}
	}
	return [...families].map(([family, weight]) => ({ family, weight }));
}

/** Compose + rasterize one design at the requested size/format. */
export async function renderDesign(
	settings: DesignSettings,
	renderOptions: RenderOptions,
	options: ProcessingOptions & { assets?: GraphicAssets } = {},
): Promise<RenderedDesign> {
	checkAbort(options.signal);
	const composed =
		settings.tool === "og-banner"
			? composeOgSvg(settings.design as OgDesign)
			: { svg: composeIconSvg(settings.design as IconDesign), warnings: [] };
	if (settings.tool === "og-banner" && renderOptions.preview) {
		// Full validation runs on export; previews surface layout warnings only.
	}
	progress(options, renderOptions.preview ? "Updating preview…" : "Rendering design…", null);
	const { blob, width, height } = await renderSvg(
		{
			svg: composed.svg,
			width: renderOptions.width,
			height: renderOptions.height,
			format: renderOptions.format,
			quality: renderOptions.quality,
			optimize: false,
			families: designFontFamilies(settings),
		},
		options,
	);
	return {
		blob,
		mimeType: renderOptions.format,
		width,
		height,
		warnings: composed.warnings,
	};
}

/** SVG sources for direct reuse by generators. */
export function composeDesignSvg(settings: DesignSettings): string {
	return settings.tool === "og-banner"
		? composeOgSvg(settings.design as OgDesign).svg
		: composeIconSvg(settings.design as IconDesign);
}
