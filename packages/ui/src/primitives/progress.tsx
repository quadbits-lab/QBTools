import { cn } from "../lib/utils";

export function Progress({
	value,
	label,
	className,
}: {
	value: number | null;
	label: string;
	className?: string;
}) {
	const pct = value === null ? null : Math.max(0, Math.min(100, value));
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<div className="flex justify-between text-sm">
				<span className="font-medium">{label}</span>
				{pct !== null ? (
					<span className="font-mono text-muted-foreground">{pct.toFixed(0)}%</span>
				) : null}
			</div>
			<div
				role="progressbar"
				aria-label={label}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={pct ?? undefined}
				className="h-2.5 overflow-hidden rounded-full bg-muted"
			>
				<div
					className={cn(
						"h-full rounded-full bg-primary transition-[width]",
						pct === null && "w-1/3 animate-pulse",
					)}
					style={pct === null ? undefined : { width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
