import { cn } from "../lib/utils";

/** Row of boxed cells sharing hairlines (radio group semantics). */
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
			className={cn("flex flex-wrap pt-px pl-px", className)}
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
							"-mt-px -ml-px min-h-11 flex-1 cursor-pointer border px-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors duration-150",
							active
								? "relative z-10 border-foreground bg-primary text-primary-foreground"
								: "border-input text-muted-foreground hover:text-foreground",
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
