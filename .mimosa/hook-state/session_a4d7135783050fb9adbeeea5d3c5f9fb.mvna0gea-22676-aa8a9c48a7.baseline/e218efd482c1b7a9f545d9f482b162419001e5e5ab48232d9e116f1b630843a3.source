import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/utils";

/**
 * Pill badge. Tones: neutral (secondary), primary (default), outline,
 * positive (success), caution (warning), critical (destructive).
 * Status tones always pair color with text (and ideally an icon).
 */
export const badgeVariants = cva(
	"inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-xs leading-none [&_svg]:size-3",
	{
		variants: {
			tone: {
				neutral: "border-transparent bg-secondary text-secondary-foreground",
				primary: "border-transparent bg-primary text-primary-foreground",
				outline: "border-border bg-transparent text-foreground",
				positive: "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-fg",
				caution: "border-cat-amber-border bg-cat-amber-bg text-cat-amber-fg",
				critical: "border-cat-rose-border bg-cat-rose-bg text-cat-rose-fg",
			},
		},
		defaultVariants: { tone: "neutral" },
	},
);

export function Badge({
	className,
	tone,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
