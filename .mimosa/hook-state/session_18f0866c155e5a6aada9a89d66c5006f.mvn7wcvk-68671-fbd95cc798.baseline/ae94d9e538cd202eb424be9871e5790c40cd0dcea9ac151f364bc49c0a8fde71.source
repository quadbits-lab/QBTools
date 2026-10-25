/**
 * Template picker with live thumbnails. Thumbnails are the composed SVG of
 * each template's defaults injected inline (not via <img>) so they render
 * with the same fonts as the real canvas; the fontsource CSS imported here
 * loads those families into the document.
 */

import type { OgDesign, OgTemplate } from "@qbtools/engines/graphic";
import { composeOgSvg, defaultOgDesign, OG_TEMPLATES } from "@qbtools/engines/graphic";
import { cn } from "@qbtools/ui/utils";

import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/anton/400.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/caveat/400.css";
import "@fontsource/caveat/700.css";

const TEMPLATE_LABELS: Record<OgTemplate, string> = {
	minimal: "Minimal",
	gradient: "Gradient",
	"split-image": "Split Image",
	"photo-overlay": "Photo Overlay",
	editorial: "Editorial",
	"product-card": "Product Card",
	event: "Event",
	"logo-focus": "Logo Focus",
};

/** Composed default designs per template — computed once per session. */
const TEMPLATE_SVGS: Record<OgTemplate, string> = Object.fromEntries(
	OG_TEMPLATES.map((t) => [t, composeOgSvg(defaultOgDesign(t)).svg]),
) as Record<OgTemplate, string>;

export function TemplatePicker({
	design,
	onApply,
}: {
	design: OgDesign;
	onApply: (template: OgTemplate) => void;
}) {
	return (
		<div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Template">
			{OG_TEMPLATES.map((t) => (
				<button
					key={t}
					type="button"
					role="radio"
					aria-checked={design.template === t}
					onClick={() => onApply(t)}
					title={TEMPLATE_LABELS[t]}
					className={cn(
						// Outer radius (xl, 12px) = inner thumbnail (md, 6px) + 6px padding.
						"flex cursor-pointer flex-col gap-1.5 rounded-xl p-1.5 text-left transition-[box-shadow,transform,background-color] duration-150 ease-out [-webkit-tap-highlight-color:transparent] motion-safe:enabled:active:scale-[0.96]",
						design.template === t
							? "bg-emerald-500/10 ring-2 ring-emerald-500"
							: "ring-1 ring-border hover:bg-muted/60",
					)}
				>
					<span
						className="block w-full overflow-hidden rounded-md bg-surface-2 outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 [&_svg]:size-full"
						// Engine-composed markup with escaped text; inline so document fonts apply.
						dangerouslySetInnerHTML={{ __html: TEMPLATE_SVGS[t] as string }}
						style={{ aspectRatio: "1200 / 630" }}
						aria-hidden
					/>
					<span
						className={cn(
							"truncate px-0.5 text-[11px] font-medium",
							design.template === t ? "text-foreground" : "text-muted-foreground",
						)}
					>
						{TEMPLATE_LABELS[t]}
					</span>
				</button>
			))}
		</div>
	);
}
