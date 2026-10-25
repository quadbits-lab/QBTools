/** Titled group inside an inspector panel with an optional eyebrow label. */
import { cn } from "@qbtools/ui/utils";

export function Section({
	title,
	eyebrow,
	className,
	children,
}: {
	title?: string;
	eyebrow?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<section className={cn("flex flex-col gap-3", className)}>
			{(title || eyebrow) && (
				<div className="flex items-baseline justify-between gap-2">
					{title && <h3 className="text-sm font-medium text-foreground">{title}</h3>}
					{eyebrow && <span className="label-mono text-subtle">{eyebrow}</span>}
				</div>
			)}
			{children}
		</section>
	);
}
