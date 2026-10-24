import type * as React from "react";
import { cn } from "../lib/utils";

/** ShadCN field: 40px tall, 6px radius, hairline `input` border, 2px ring on focus. */
export const inputClass =
	"h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 aria-invalid:border-destructive";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
	return <input type={type} className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			className={cn(inputClass, "h-auto min-h-32 resize-y py-2.5 leading-relaxed", className)}
			{...props}
		/>
	);
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
	return (
		<select
			className={cn(
				inputClass,
				"cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9 [&>option]:bg-popover [&>option]:text-popover-foreground",
				className,
			)}
			{...props}
		>
			{children}
		</select>
	);
}
