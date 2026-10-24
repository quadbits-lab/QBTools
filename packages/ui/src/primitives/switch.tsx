import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			className={cn(
				"peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-input bg-muted p-0.5 transition-colors data-[state=checked]:border-transparent data-[state=checked]:bg-primary disabled:opacity-40",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full border border-input bg-background shadow-card transition-transform duration-150 data-[state=checked]:translate-x-4 data-[state=checked]:border-transparent data-[state=checked]:bg-primary-foreground" />
		</SwitchPrimitive.Root>
	);
}
