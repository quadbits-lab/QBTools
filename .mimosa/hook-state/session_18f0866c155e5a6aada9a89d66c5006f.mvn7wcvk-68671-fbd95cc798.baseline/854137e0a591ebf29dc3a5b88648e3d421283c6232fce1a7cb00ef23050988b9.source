import { cn } from "@qbtools/ui/utils";

/** Figure tile: mono label over a large mono value. `primary` inverts it. */
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
	const inverted = tone !== "default";
	return (
		<div
			className={cn(
				"flex flex-col gap-2 border p-4",
				inverted ? "border-primary bg-primary text-primary-foreground" : "border-border",
				className,
			)}
		>
			<span className={cn("label-mono", inverted && "text-primary-foreground/70")}>{label}</span>
			<span className="font-mono text-2xl font-medium tracking-[-0.02em]">{value}</span>
			{hint ? (
				<span
					className={cn(
						"text-xs",
						inverted ? "text-primary-foreground/70" : "text-muted-foreground",
					)}
				>
					{hint}
				</span>
			) : null}
		</div>
	);
}
