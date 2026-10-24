import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

export const Tabs = TabsPrimitive.Root;

/** Nina "method ruler": hairline over each tab, the active one solid. */
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List className={cn("flex flex-wrap gap-x-6 gap-y-2", className)} {...props} />
	);
}

export function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				"inline-flex min-h-11 cursor-pointer items-start gap-2 border-t border-input pt-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground",
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
