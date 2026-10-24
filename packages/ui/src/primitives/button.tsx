import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

export const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 cursor-pointer select-none",
	{
		variants: {
			variant: {
				primary: "bg-primary text-primary-foreground hover:bg-primary/90",
				secondary: "bg-surface-2 text-foreground border border-border hover:bg-muted",
				outline: "border border-input bg-surface hover:bg-muted",
				ghost: "hover:bg-muted",
				critical: "bg-critical text-white hover:bg-critical/90",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				sm: "h-10 px-3 text-sm",
				md: "h-12 px-5 text-base",
				lg: "h-14 px-7 text-lg",
				icon: "size-12",
				"icon-sm": "size-10",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);

export type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
	const Comp = asChild ? Slot.Root : "button";
	return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
