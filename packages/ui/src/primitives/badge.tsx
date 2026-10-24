import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/utils";

/** Mono uppercase tag in a hairline box. Tone changes contrast, not hue. */
const badgeVariants = cva(
	"inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.6875rem] uppercase leading-none tracking-[0.12em] [&_svg]:size-3.5",
	{
		variants: {
			tone: {
				neutral: "border-input text-muted-foreground",
				primary: "border-foreground text-foreground",
				positive: "border-foreground text-foreground",
				caution: "border-foreground text-foreground",
				critical: "border-critical text-critical",
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
