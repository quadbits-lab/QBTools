import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			className={cn(
				"peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center border border-input bg-transparent p-0.5 transition-colors data-[state=checked]:border-foreground data-[state=checked]:bg-primary disabled:opacity-40",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb className="pointer-events-none block size-5 bg-subtle transition-transform duration-150 data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary-foreground" />
		</SwitchPrimitive.Root>
	);
}
