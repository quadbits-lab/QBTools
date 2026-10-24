import type * as React from "react";
import { cn } from "../lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("rounded-lg border border-border bg-card text-card-foreground", className)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
	return <h3 className={cn("text-xl font-semibold tracking-[-0.02em]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
	return <p className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}
