import type { CategoryId } from "@qbtools/registry";
import { cn } from "@qbtools/ui/utils";
import type * as React from "react";
import { categoryStyles } from "#/lib/icons";

/** Accent for non-category filters (Popular, Private, AI). Full class names so Tailwind sees them. */
const TONES = {
	amber: {
		dot: "bg-cat-amber-icon",
		active: "border-cat-amber-border bg-cat-amber-bg text-cat-amber-fg",
	},
	emerald: {
		dot: "bg-cat-emerald-icon",
		active: "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-fg",
	},
	violet: {
		dot: "bg-cat-violet-icon",
		active: "border-cat-violet-border bg-cat-violet-bg text-cat-violet-fg",
	},
} as const;

export type FilterTone = keyof typeof TONES;

/** Selected category chip: accent-tinted pill with a solid accent dot. */
const CATEGORY_ACTIVE: Record<CategoryId, string> = {
	image: "border-cat-emerald-icon/35 bg-cat-emerald-icon/12 text-foreground",
	pdf: "border-cat-rose-icon/35 bg-cat-rose-icon/12 text-foreground",
	text: "border-cat-indigo-icon/35 bg-cat-indigo-icon/12 text-foreground",
	calculators: "border-cat-amber-icon/35 bg-cat-amber-icon/12 text-foreground",
	generators: "border-cat-violet-icon/35 bg-cat-violet-icon/12 text-foreground",
	media: "border-cat-sky-icon/35 bg-cat-sky-icon/12 text-foreground",
	security: "border-cat-teal-icon/35 bg-cat-teal-icon/12 text-foreground",
	developer: "border-cat-violet-icon/35 bg-cat-violet-icon/12 text-foreground",
};

/**
 * Pill filter. With no `category`/`tone` it is neutral (the active state is solid);
 * otherwise a colored dot marks the discipline and the active state takes its accent.
 */
export function FilterChip({
	label,
	count,
	active = false,
	category,
	tone,
	className,
	...props
}: Omit<React.ComponentProps<"button">, "children"> & {
	label: string;
	count?: number;
	active?: boolean;
	category?: CategoryId;
	tone?: FilterTone;
}) {
	const dot = category ? categoryStyles[category].dot : tone ? TONES[tone].dot : undefined;
	const activeDot = category ? categoryStyles[category].iconColor : undefined;
	const activeClass = category
		? CATEGORY_ACTIVE[category]
		: tone
			? TONES[tone].active
			: "border-transparent bg-primary text-primary-foreground";
	return (
		<button
			type="button"
			aria-pressed={active}
			className={cn(
				"inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-[background-color,border-color,color,scale] duration-150 ease-out enabled:active:motion-safe:scale-[0.96]",
				active
					? activeClass
					: "border-field-border bg-field text-foreground hover:border-foreground/25 hover:bg-accent",
				className,
			)}
			{...props}
		>
			{dot ? (
				<span
					aria-hidden="true"
					className={cn(
						"size-2 rounded-full",
						active && activeDot ? cn("bg-current", activeDot) : dot,
					)}
				/>
			) : null}
			{label}
			{count !== undefined ? (
				<span
					className={cn("text-xs font-normal", active ? "opacity-80" : "text-muted-foreground")}
				>
					{count}
				</span>
			) : null}
		</button>
	);
}
