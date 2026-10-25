import { Dialog as DialogPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

const BASE =
	"fixed z-50 overflow-hidden border border-border bg-popover text-popover-foreground shadow-popover outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0";

/**
 * Dialog surface. `variant="dialog"` is the centred modal; `variant="sheet"`
 * docks to the bottom edge for mobile flows and caps its height to the viewport.
 */
export function DialogContent({
	className,
	children,
	variant = "dialog",
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	variant?: "dialog" | "sheet";
}) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-veil backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
			<DialogPrimitive.Content
				className={cn(
					BASE,
					variant === "dialog"
						? "top-[12vh] left-1/2 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl data-[state=open]:slide-in-from-top-3"
						: "inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-2xl border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] data-[state=open]:slide-in-from-bottom-4 motion-reduce:animate-none",
					className,
				)}
				{...props}
			>
				{children}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}
