import { cn } from "../lib/utils";

/** Segmented control: rounded muted track with a lifted active option (radio group semantics). */
export function Segmented<T extends string>({
	value,
	onChange,
	options,
	label,
	size = "default",
	className,
}: {
	value: T;
	onChange: (value: T) => void;
	options: ReadonlyArray<{ value: T; label: string }>;
	label: string;
	/** `toolbar` matches the 40px height of selects and inputs in a filter bar. */
	size?: "default" | "toolbar";
	className?: string;
}) {
	return (
		<div
			role="radiogroup"
			aria-label={label}
			className={cn(
				"flex flex-wrap border border-border/60 bg-segment",
				size === "toolbar" ? "min-h-10 gap-1 rounded-[10px] p-[3px]" : "gap-1.5 rounded-xl p-1.5",
				className,
			)}
		>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={active}
						onClick={() => onChange(option.value)}
						className={cn(
							"flex flex-auto cursor-pointer items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow,scale] duration-150 ease-out enabled:active:motion-safe:scale-[0.96]",
							size === "toolbar" ? "h-8 rounded-md px-3" : "min-h-9 rounded-lg px-4",
							active
								? "bg-segment-active text-foreground shadow-card"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
