import { cn } from "@qbtools/ui/utils";
import { AlertTriangle, Info, XCircle } from "lucide-react";

const LABEL = { info: "Note", caution: "Heads up", critical: "Error" } as const;

/** Hairline notice with a mono tag. Tone is carried by icon + label, errors also by color. */
export function Notice({
	tone = "info",
	children,
	className,
}: {
	tone?: "info" | "caution" | "critical";
	children: React.ReactNode;
	className?: string;
}) {
	const Icon = tone === "critical" ? XCircle : tone === "caution" ? AlertTriangle : Info;
	return (
		<div
			role={tone === "critical" ? "alert" : "status"}
			className={cn(
				"flex gap-3 border bg-surface-2 p-4 text-[0.9375rem] leading-relaxed",
				tone === "critical" ? "border-critical" : "border-input",
				className,
			)}
		>
			<Icon
				strokeWidth={1.5}
				className={cn(
					"mt-0.5 size-5 shrink-0",
					tone === "critical" ? "text-critical" : "text-foreground",
				)}
			/>
			<div className="flex flex-col gap-1">
				<span className={cn("label-mono", tone === "critical" && "text-critical")}>
					{LABEL[tone]}
				</span>
				<div className="text-muted-foreground [&_a]:text-foreground [&_a]:underline">
					{children}
				</div>
			</div>
		</div>
	);
}
