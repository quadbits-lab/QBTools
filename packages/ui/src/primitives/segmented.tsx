import { cn } from "../lib/utils";

/** Big, touch-friendly single-choice control (radio group semantics). */
export function Segmented<T extends string>({
	value,
	onChange,
	options,
	label,
	className,
}: {
	value: T;
	onChange: (value: T) => void;
	options: ReadonlyArray<{ value: T; label: string }>;
	label: string;
	className?: string;
}) {
	return (
		<div
			role="radiogroup"
			aria-label={label}
			className={cn("flex flex-wrap gap-1 rounded-xl bg-muted p-1", className)}
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
							"min-h-11 flex-1 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors",
							active
								? "bg-surface text-foreground shadow-sm"
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
