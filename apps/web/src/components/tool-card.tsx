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
				"grid shrink-0 place-items-center",
				categoryTone[tool.category],
				size === "sm" && "size-9 [&_svg]:size-4",
				size === "md" && "size-12 [&_svg]:size-5",
				size === "lg" && "size-16 [&_svg]:size-7",
			)}
		>
			<Icon strokeWidth={1.5} />
		</span>
	);
}

/** Nina "go" cell: the boxed arrow at the end of a row. */
function GoCell() {
	return (
		<span
			aria-hidden="true"
			className="grid size-11 shrink-0 place-items-center border border-input transition-colors duration-150 group-hover:border-foreground group-hover:bg-primary group-hover:text-primary-foreground"
		>
			<ArrowRight className="size-4" />
		</span>
	);
}

export function ToolCard({
	tool,
	index,
	className,
}: {
	tool: ToolDef;
	index?: number;
	className?: string;
}) {
	return (
		<Link
			to="/tools/$slug"
			params={{ slug: tool.slug }}
			className={cn(
				"group grid grid-cols-[auto_1fr_auto] items-start gap-4 border border-border bg-surface p-5 transition-colors duration-150 hover:border-input",
				className,
			)}
		>
			<ToolIcon tool={tool} />
			<span className="flex min-w-0 flex-col gap-1.5">
				{index !== undefined && (
					<span className="label-mono text-subtle">[{String(index).padStart(2, "0")}]</span>
				)}
				<span className="flex flex-wrap items-center gap-2 text-lg leading-tight font-medium tracking-[-0.02em]">
					{tool.name}
					{tool.runtime === "server-ai" && (
						<Badge tone="primary">
							<Sparkles /> AI
						</Badge>
					)}
				</span>
				<span className="text-[0.9375rem] leading-normal text-muted-foreground">
					{tool.tagline}
				</span>
			</span>
			<GoCell />
		</Link>
	);
}

export function CategoryCard({
	category,
	count,
	index,
}: {
	category: Category;
	count: number;
	index?: number;
}) {
	const Icon = iconFor(category.icon);
	return (
		<Link
			to="/categories/$category"
			params={{ category: category.id }}
			className="group flex flex-col gap-8 bg-surface p-6 transition-colors duration-150 hover:bg-surface-2 sm:p-8"
		>
			<span className="flex items-start justify-between gap-4">
				<span className={cn("grid size-14 place-items-center", categoryTone[category.id])}>
					<Icon className="size-6" strokeWidth={1.5} />
				</span>
				{index !== undefined && (
					<span className="label-mono text-subtle">[{String(index).padStart(2, "0")}]</span>
				)}
			</span>
			<span className="flex flex-col gap-2">
				<span className="text-2xl leading-tight font-medium tracking-[-0.03em]">
					{category.name}
				</span>
				<span className="text-muted-foreground">{category.tagline}</span>
			</span>
			<span className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-4">
				<span className="label-mono">{count} tools</span>
				<GoCell />
			</span>
		</Link>
	);
}
