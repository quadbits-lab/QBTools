import type * as React from "react";
import { cn } from "../lib/utils";

export const inputClass =
	"h-12 w-full min-w-0 rounded-lg border border-input bg-surface px-4 text-base placeholder:text-muted-foreground/80 transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:opacity-50 aria-invalid:border-critical";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
	return <input type={type} className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			className={cn(inputClass, "h-auto min-h-32 resize-y py-3 leading-relaxed", className)}
			{...props}
		/>
	);
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
	return (
		<select
			className={cn(
				inputClass,
				"appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10",
				className,
			)}
			{...props}
		>
			{children}
		</select>
	);
}
