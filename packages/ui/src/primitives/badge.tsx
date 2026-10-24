import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/utils";

const badgeVariants = cva(
	"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5",
	{
		variants: {
			tone: {
				neutral: "bg-muted text-muted-foreground",
				primary: "bg-primary-soft text-primary",
				positive: "bg-positive-soft text-positive",
				caution: "bg-caution-soft text-caution",
				critical: "bg-critical-soft text-critical",
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
