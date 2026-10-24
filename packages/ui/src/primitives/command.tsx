import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/utils";

export function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
	return <CommandPrimitive className={cn("flex flex-col overflow-hidden", className)} {...props} />;
}

export function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div className="flex items-center gap-3 border-b border-input px-4">
			<SearchIcon className="size-5 text-muted-foreground" />
			<CommandPrimitive.Input
				className={cn(
					"h-14 w-full bg-transparent text-lg outline-none placeholder:text-subtle",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

export function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			className={cn("max-h-[60vh] overflow-y-auto p-2", className)}
			{...props}
		/>
	);
}

export function CommandEmpty(props: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return <CommandPrimitive.Empty className="py-8 text-center text-muted-foreground" {...props} />;
}

export function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			className={cn(
				"[&_[cmdk-group-heading]]:label-mono [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2.5",
				className,
			)}
			{...props}
		/>
	);
}

export function CommandItem({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			className={cn(
				"flex min-h-12 cursor-pointer items-center gap-3 px-3 text-base data-[selected=true]:bg-muted",
				className,
			)}
			{...props}
		/>
	);
}
