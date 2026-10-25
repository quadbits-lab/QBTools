import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

/**
 * ShadCN button. Variants: default (alias primary), secondary, outline, ghost,
 * destructive (alias critical), link. `arrow` appends a 16px arrow.
 * Heights: sm 36, md 40, lg 48.
 */
export const buttonVariants = cva(
	"inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-sm font-medium transition-[transform,background-color,border-color,color,opacity] duration-150 ease-out [-webkit-tap-highlight-color:transparent] motion-safe:enabled:active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90",
				primary: "bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90",
				secondary:
					"border-border bg-secondary text-secondary-foreground control-raise hover:bg-accent",
				outline:
					"border-border bg-field text-foreground control-raise hover:border-foreground/25 hover:bg-accent",
				ghost: "text-foreground hover:bg-accent",
				destructive:
					"bg-destructive text-destructive-foreground shadow-2xs hover:bg-destructive/90",
				critical: "bg-destructive text-destructive-foreground shadow-2xs hover:bg-destructive/90",
				link: "h-auto rounded-none border-0 border-b border-input px-0 pb-0.5 text-foreground hover:border-foreground active:scale-100",
			},
			size: {
				sm: "h-9 px-3",
				md: "h-10 px-4",
				lg: "h-12 px-6",
				icon: "size-10",
				"icon-sm": "size-9",
			},
		},
		defaultVariants: { variant: "default", size: "md" },
	},
);

export type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		/** Append a trailing arrow (primary calls to action). */
		arrow?: boolean;
	};

export function Button({
	className,
	variant,
	size,
	asChild = false,
	arrow = false,
	children,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot.Root : "button";
	return (
		<Comp className={cn(buttonVariants({ variant, size }), className)} {...props}>
			{asChild ? (
				<Slot.Slottable>{children}</Slot.Slottable>
			) : (
				<>
					{children}
					{arrow ? <ArrowRight aria-hidden="true" /> : null}
				</>
			)}
		</Comp>
	);
}
