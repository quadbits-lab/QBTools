import { cn } from "@qbtools/ui/utils";
import { AlertTriangle, Info, XCircle } from "lucide-react";

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
				"flex gap-3 rounded-xl p-4 text-[0.95rem]",
				tone === "info" && "bg-primary-soft/60 text-foreground",
				tone === "caution" && "bg-caution-soft text-foreground",
				tone === "critical" && "bg-critical-soft text-foreground",
				className,
			)}
		>
			<Icon
				className={cn(
					"mt-0.5 size-5 shrink-0",
					tone === "info" && "text-primary",
					tone === "caution" && "text-caution",
					tone === "critical" && "text-critical",
				)}
			/>
			<div>{children}</div>
		</div>
	);
}
