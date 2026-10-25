import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

export function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn("flex flex-col gap-2", className)}
			{...props}
		/>
	);
}

/** ShadCN tabs list: muted pill container */
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn(
				"inline-flex h-10 items-center justify-center rounded-[10px] border border-border/60 bg-segment p-1 text-muted-foreground",
				className,
			)}
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
			data-slot="tabs-trigger"
			className={cn(
				"inline-flex min-h-8 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow,scale] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring enabled:active:motion-safe:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 data-[state=active]:bg-segment-active data-[state=active]:text-foreground data-[state=active]:shadow-card hover:text-foreground",
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
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn("mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
			{...props}
		/>
	);
}
