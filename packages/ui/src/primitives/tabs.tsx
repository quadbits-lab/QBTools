import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

export const Tabs = TabsPrimitive.Root;

/** ShadCN tabs: muted pill list, the active trigger lifts onto the card color. */
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			className={cn("inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1", className)}
			{...props}
		/>
	);
}

export function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				"inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return <TabsPrimitive.Content className={cn("mt-6 outline-none", className)} {...props} />;
}
