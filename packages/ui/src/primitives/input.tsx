import type * as React from "react";
import { cn } from "../lib/utils";

/** Nina field: transparent, hairline border, 48px tall, square. */
export const inputClass =
	"h-12 w-full min-w-0 border border-input bg-transparent px-4 text-base text-foreground placeholder:text-subtle transition-colors focus-visible:border-foreground focus-visible:outline-none disabled:opacity-40 aria-invalid:border-critical";

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
				"appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%221.5%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10 [&>option]:bg-surface [&>option]:text-foreground",
				className,
			)}
			{...props}
		>
			{children}
		</select>
	);
}
