import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

/**
 * Nina boxed button: hairline box, DM Mono uppercase label, square corners,
 * presses to 0.96 over 150ms. `arrow` adds the boxed arrow cell.
 */
export const buttonVariants = cva(
	"inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2.5 whitespace-nowrap border font-mono uppercase tracking-[0.12em] transition-[transform,background-color,border-color,color,opacity] duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				primary: "border-primary bg-primary text-primary-foreground hover:bg-primary/85",
				secondary: "border-input bg-transparent text-foreground hover:border-foreground",
				outline: "border-input bg-transparent text-foreground hover:border-foreground",
				ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
				critical:
					"border-critical bg-transparent text-critical hover:bg-critical hover:text-background",
				link: "h-auto border-0 border-b border-input px-0 pb-1 text-foreground hover:border-foreground active:scale-100",
			},
			size: {
				sm: "h-10 px-3.5 text-[0.6875rem]",
				md: "h-12 px-5 text-xs",
				lg: "h-14 px-6 text-[0.8125rem]",
				icon: "size-12 tracking-normal",
				"icon-sm": "size-10 tracking-normal",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);

export type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		/** Append the boxed → cell (primary calls to action). */
		arrow?: boolean;
	};

function ArrowCell() {
	return (
		<span
			aria-hidden="true"
			className="flex w-12 items-center justify-center self-stretch border-l border-current"
		>
			<ArrowRight />
		</span>
	);
}

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
		<Comp
			className={cn(buttonVariants({ variant, size }), arrow && "gap-5 py-0 pr-0", className)}
			{...props}
		>
			{asChild ? (
				<Slot.Slottable>{children}</Slot.Slottable>
			) : arrow ? (
				<span className="flex items-center gap-2.5">{children}</span>
			) : (
				children
			)}
			{arrow ? <ArrowCell /> : null}
		</Comp>
	);
}
