import type * as React from "react";
import { cn } from "../lib/utils";

/** DM Mono uppercase label (Nina field label). */
export function Label({ className, ...props }: React.ComponentProps<"label">) {
	// biome-ignore lint/a11y/noLabelWithoutControl: htmlFor is passed through props
	return <label className={cn("label-mono", className)} {...props} />;
}

/** Label + control + optional hint/error, stacked. */
export function Field({
	label,
	htmlFor,
	hint,
	error,
	className,
	children,
}: {
	label: React.ReactNode;
	htmlFor?: string;
	hint?: React.ReactNode;
	error?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Label htmlFor={htmlFor}>{label}</Label>
			{children}
			{error ? (
				<p role="alert" className="text-critical text-sm">
					{error}
				</p>
			) : hint ? (
				<p className="text-muted-foreground text-sm">{hint}</p>
			) : null}
		</div>
	);
}
