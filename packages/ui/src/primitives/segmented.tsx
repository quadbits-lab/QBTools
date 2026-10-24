import { cn } from "../lib/utils";

/** Segmented control: rounded muted track with a lifted active option (radio group semantics). */
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
			className={cn("flex flex-wrap gap-1 rounded-lg bg-muted p-1", className)}
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
							"min-h-9 flex-1 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors duration-150",
							active
								? "bg-card text-foreground shadow-card"
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
