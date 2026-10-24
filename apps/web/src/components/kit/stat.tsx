import { cn } from "@qbtools/ui/utils";

export function Stat({
	label,
	value,
	hint,
	tone = "default",
	className,
}: {
	label: string;
	value: React.ReactNode;
	hint?: React.ReactNode;
	tone?: "default" | "primary" | "positive";
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-1 rounded-xl border border-border p-4",
				tone === "primary" && "border-primary/30 bg-primary-soft/50",
				tone === "positive" && "border-positive/30 bg-positive-soft/50",
				className,
			)}
		>
			<span className="text-sm font-medium text-muted-foreground">{label}</span>
			<span className={cn("font-mono text-2xl font-bold tracking-tight", tone === "primary" && "text-primary", tone === "positive" && "text-positive")}>
				{value}
			</span>
			{hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
		</div>
	);
}
