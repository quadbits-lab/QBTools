import { type Category, type ToolDef, toolsInCategory } from "@qbtools/registry";
import { Badge } from "@qbtools/ui/badge";
import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, Star } from "lucide-react";
import { categoryStyles, categoryTone, iconFor } from "#/lib/icons";
import { favoriteTools, toggleFavorite } from "#/lib/local-store";

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
				"grid shrink-0 place-items-center transition-transform duration-200 group-hover:scale-105",
				categoryTone[tool.category],
				size === "sm" && "size-9 [&_svg]:size-4",
				size === "md" && "size-12 [&_svg]:size-5",
				size === "lg" && "size-14 [&_svg]:size-6 sm:size-16 sm:[&_svg]:size-7",
			)}
		>
			<Icon strokeWidth={1.75} />
		</span>
	);
}

/** Nina "go" cell: the boxed arrow at the end of a row with smooth interactive hover. */
function GoCell() {
	return (
		<span
			aria-hidden="true"
			className="grid size-10 shrink-0 place-items-center border border-input transition-all duration-200 group-hover:border-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:translate-x-0.5"
		>
			<ArrowRight className="size-4" />
		</span>
	);
}

export function ToolCard({
	tool,
	index,
	variant = "default",
	className,
}: {
	tool: ToolDef;
	index?: number;
	variant?: "default" | "compact";
	className?: string;
}) {
	const favorites = favoriteTools.use();
	const isFavorite = favorites.includes(tool.slug);
	const catStyle = categoryStyles[tool.category];

	const handleFavoriteClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		toggleFavorite(tool.slug);
	};

	if (variant === "compact") {
		return (
			<Link
				to="/tools/$slug"
				params={{ slug: tool.slug }}
				className={cn(
					"group relative flex items-center justify-between gap-3 border border-border/80 bg-surface/80 p-3.5 backdrop-blur-sm transition-all duration-150 hover:border-input hover:bg-surface-2",
					className,
				)}
			>
				<div className="flex min-w-0 items-center gap-3">
					<ToolIcon tool={tool} size="sm" />
					<div className="flex min-w-0 flex-col">
						<span className="truncate text-base font-medium tracking-tight text-foreground group-hover:text-primary">
							{tool.name}
						</span>
						<span className="truncate text-xs text-muted-foreground">{tool.tagline}</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleFavoriteClick}
						aria-label={
							isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`
						}
						className={cn(
							"grid size-8 place-items-center rounded-none border border-transparent transition-colors hover:border-border hover:bg-muted",
							isFavorite ? "text-amber-400" : "text-subtle/60 hover:text-foreground",
						)}
					>
						<Star
							className={cn(
								"size-4 transition-transform duration-150 active:scale-125",
								isFavorite && "fill-current",
							)}
						/>
					</button>
					<span className="text-subtle group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
						<ArrowRight className="size-4" />
					</span>
				</div>
			</Link>
		);
	}

	return (
		<Link
			to="/tools/$slug"
			params={{ slug: tool.slug }}
			className={cn(
				"interactive-card group relative grid grid-cols-[auto_1fr_auto] items-start gap-4 border border-border/90 bg-surface/80 p-5 backdrop-blur-sm hover:border-input hover:bg-surface-2",
				className,
			)}
		>
			<ToolIcon tool={tool} />
			<span className="flex min-w-0 flex-col gap-1.5">
				<span className="flex flex-wrap items-center gap-2">
					{index !== undefined && (
						<span className="label-mono text-subtle">[{String(index).padStart(2, "0")}]</span>
					)}
					{catStyle && (
						<span
							className={cn(
								"inline-flex items-center border px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider",
								catStyle.badge,
							)}
						>
							{catStyle.accent}
						</span>
					)}
					{tool.runtime === "server-ai" ? (
						<Badge tone="primary" className="text-[0.625rem] py-0.5">
							<Sparkles className="size-3" /> AI
						</Badge>
					) : (
						<span className="hidden sm:inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-wider text-subtle">
							<ShieldCheck className="size-3 text-emerald-500" /> Private
						</span>
					)}
					{tool.popular !== undefined && tool.popular <= 3 && (
						<span className="hidden md:inline-flex font-mono text-[0.625rem] uppercase tracking-wider text-amber-500">
							★ Top
						</span>
					)}
				</span>

				<span className="flex items-center gap-2 text-lg leading-tight font-medium tracking-[-0.02em] text-foreground group-hover:text-primary transition-colors">
					{tool.name}
				</span>
				<span className="line-clamp-2 text-[0.875rem] leading-relaxed text-muted-foreground">
					{tool.tagline}
				</span>
			</span>

			<div className="flex flex-col items-end gap-2">
				<button
					type="button"
					onClick={handleFavoriteClick}
					aria-label={
						isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`
					}
					className={cn(
						"grid size-8 place-items-center border border-transparent transition-all hover:border-border hover:bg-muted",
						isFavorite
							? "text-amber-400"
							: "text-subtle/50 opacity-0 group-hover:opacity-100 hover:text-foreground",
					)}
				>
					<Star
						className={cn(
							"size-4 transition-transform duration-150 active:scale-125",
							isFavorite && "fill-current opacity-100",
						)}
					/>
				</button>
				<GoCell />
			</div>
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
	const catStyle = categoryStyles[category.id];
	const sampleTools = toolsInCategory(category.id).slice(0, 3);

	return (
		<div className="interactive-card group relative flex flex-col justify-between border border-border/80 bg-surface/80 p-6 backdrop-blur-sm hover:border-input hover:bg-surface-2 sm:p-7">
			<Link
				to="/categories/$category"
				params={{ category: category.id }}
				className="flex flex-col gap-6"
			>
				<div className="flex items-start justify-between gap-4">
					<span
						className={cn(
							"grid size-12 place-items-center transition-transform duration-200 group-hover:scale-105 sm:size-14",
							catStyle ? catStyle.tile : categoryTone[category.id],
						)}
					>
						<Icon className="size-6" strokeWidth={1.75} />
					</span>
					<div className="flex items-center gap-2">
						{index !== undefined && (
							<span className="label-mono text-subtle">[{String(index).padStart(2, "0")}]</span>
						)}
						<span
							className={cn(
								"border px-2 py-0.5 font-mono text-[0.6875rem] uppercase tracking-wider",
								catStyle ? catStyle.badge : "border-border text-subtle",
							)}
						>
							{count} tools
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-2xl leading-tight font-medium tracking-[-0.03em] group-hover:text-primary transition-colors">
						{category.name}
					</span>
					<span className="text-sm leading-relaxed text-muted-foreground">{category.tagline}</span>
				</div>
			</Link>

			{/* Interactive quick pills for top tools in this category */}
			<div className="mt-6 flex flex-wrap gap-1.5 border-t border-border/80 pt-4">
				{sampleTools.map((t) => (
					<Link
						key={t.slug}
						to="/tools/$slug"
						params={{ slug: t.slug }}
						className="label-mono rounded-none border border-border/70 bg-background/50 px-2 py-1 text-[0.6875rem] text-muted-foreground transition-all hover:border-foreground hover:bg-surface hover:text-foreground"
					>
						{t.name}
					</Link>
				))}
				<Link
					to="/categories/$category"
					params={{ category: category.id }}
					className="ml-auto flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-foreground hover:underline pt-1"
				>
					View all →
				</Link>
			</div>
		</div>
	);
}
