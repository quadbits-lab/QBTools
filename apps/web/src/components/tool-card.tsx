import type { Category, ToolDef } from "@qbtools/registry";
import { Badge } from "@qbtools/ui/badge";
import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { categoryTone, iconFor } from "#/lib/icons";

export function ToolIcon({
	tool,
	size = "md",
}: {
	tool: Pick<ToolDef, "icon" | "category">;
	size?: "sm" | "md" | "lg";
}) {
	const Icon = iconFor(tool.icon);
	return (
		<span
			className={cn(
				"grid shrink-0 place-items-center rounded-xl",
				categoryTone[tool.category],
				size === "sm" && "size-9 [&_svg]:size-4",
				size === "md" && "size-12 [&_svg]:size-6",
				size === "lg" && "size-16 rounded-2xl [&_svg]:size-8",
			)}
		>
			<Icon />
		</span>
	);
}

export function ToolCard({ tool, className }: { tool: ToolDef; className?: string }) {
	return (
		<Link
			to="/tools/$slug"
			params={{ slug: tool.slug }}
			className={cn(
				"group flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg sm:p-5",
				className,
			)}
		>
			<ToolIcon tool={tool} />
			<span className="flex min-w-0 flex-col gap-1">
				<span className="flex items-center gap-2 font-bold text-[1.05rem] group-hover:text-primary">
					{tool.name}
					{tool.runtime === "server-ai" && (
						<Badge tone="primary">
							<Sparkles /> AI
						</Badge>
					)}
				</span>
				<span className="text-[0.95rem] leading-snug text-muted-foreground">{tool.tagline}</span>
			</span>
		</Link>
	);
}

export function CategoryCard({ category, count }: { category: Category; count: number }) {
	const Icon = iconFor(category.icon);
	return (
		<Link
			to="/categories/$category"
			params={{ category: category.id }}
			className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg sm:p-6"
		>
			<span
				className={cn("grid size-14 place-items-center rounded-2xl", categoryTone[category.id])}
			>
				<Icon className="size-7" />
			</span>
			<span className="flex flex-col gap-1">
				<span className="text-lg font-bold group-hover:text-primary">{category.name}</span>
				<span className="text-muted-foreground">{category.tagline}</span>
			</span>
			<span className="mt-auto flex items-center gap-1 text-sm font-semibold text-primary">
				{count} tools{" "}
				<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
			</span>
		</Link>
	);
}
