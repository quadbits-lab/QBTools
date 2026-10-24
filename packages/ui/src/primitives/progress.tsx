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
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex justify-between gap-3">
				<span className="label-mono">{label}</span>
				{pct !== null ? (
					<span className="font-mono text-sm text-foreground">{pct.toFixed(0)}%</span>
				) : null}
			</div>
			<div
				role="progressbar"
				aria-label={label}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={pct ?? undefined}
				className="h-1.5 overflow-hidden bg-muted"
			>
				<div
					className={cn(
						"h-full bg-foreground transition-[width] duration-300",
						pct === null && "w-1/3 animate-pulse",
					)}
					style={pct === null ? undefined : { width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
