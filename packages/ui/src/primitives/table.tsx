import type * as React from "react";
import { cn } from "../lib/utils";

/** ShadCN table inside a scrollable, rounded card. */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
	return (
		<div className="w-full overflow-x-auto">
			<table className={cn("w-full caption-bottom text-sm", className)} {...props} />
		</div>
	);
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return <thead className={cn("bg-muted [&_tr]:border-b-0", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return <tbody className={cn("[&_tr:last-child]:border-b-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			className={cn("border-b border-border transition-colors hover:bg-accent/50", className)}
			{...props}
		/>
	);
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
	return (
		<th
			className={cn(
				"h-10 whitespace-nowrap px-4 text-left align-middle font-mono text-[0.625rem] font-medium uppercase tracking-[0.1em] text-subtle",
				className,
			)}
			{...props}
		/>
	);
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
	return <td className={cn("h-[60px] px-4 align-middle", className)} {...props} />;
}
