import type * as React from "react";
import { cn } from "../lib/utils";

/** Native range input with a large hit area and a mono value readout. */
export function Slider({
	className,
	label,
	valueLabel,
	id,
	...props
}: Omit<React.ComponentProps<"input">, "type"> & { label: string; valueLabel?: string }) {
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex items-center justify-between gap-3">
				<label htmlFor={id} className="label-mono">
					{label}
				</label>
				{valueLabel ? (
					<span className="font-mono text-sm text-foreground">{valueLabel}</span>
				) : null}
			</div>
			<input id={id} type="range" className="h-8 w-full cursor-pointer" {...props} />
		</div>
	);
}
