import { categoryById, type ToolDef } from "@qbtools/registry";
import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { categoryShortName, categoryStyles } from "#/lib/icons";
import { useAccount } from "./account-provider";
import { FavoriteButton, ToolIcon } from "./tool-card";
import { ToolFlags } from "./tool-flags";

/** Shared card surface; the favorite button sits beside the link, never inside it. */
const SURFACE =
	"relative flex h-full w-full rounded-xl border border-border bg-card transition-[border-color,box-shadow] duration-200 group-hover:border-foreground/20 group-hover:shadow-hover group-focus-within:border-foreground/20";

/** Rich tool card for the landing directory. */
export function ShowcaseToolCard({ tool, className }: { tool: ToolDef; className?: string }) {
	const { user } = useAccount();
	const category = categoryById[tool.category];
	const style = categoryStyles[tool.category];

	return (
		<article
			className={cn(
				"group relative h-full min-w-0 transition-transform duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:focus-within:-translate-y-0.5",
				className,
			)}
		>
			<Link
				to="/tools/$slug"
				params={{ slug: tool.slug }}
				aria-label={`${tool.name}. Open tool.`}
				className={cn(SURFACE, "flex-col p-5")}
			>
				<span
					aria-hidden="true"
					className="absolute top-0 right-5 left-5 h-px origin-left scale-x-0 bg-foreground/40 opacity-0 transition-[transform,opacity] duration-300 motion-safe:group-hover:scale-x-100 group-hover:opacity-100 motion-safe:group-focus-within:scale-x-100 group-focus-within:opacity-100"
				/>
				<span className={cn("flex items-start justify-between gap-3", user && "pr-12")}>
					<ToolIcon tool={tool} size="xl" />
					<ToolFlags tool={tool} className="flex-wrap justify-end" />
				</span>

				<span
					className={cn(
						"mt-4 inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-medium tracking-[0.12em] uppercase",
						style.text,
					)}
				>
					<span aria-hidden="true" className={cn("size-1.5 rounded-full", style.dot)} />
					{categoryShortName(category.name)}
				</span>

				<h3 className="mt-1.5 text-xl leading-6 font-semibold tracking-[-0.025em] text-foreground">
					{tool.name}
				</h3>
				<p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
					{tool.tagline}
				</p>

				<span aria-hidden="true" className="my-4 h-px bg-border" />

				<span className="mt-auto flex items-center justify-between gap-3">
					<span className="text-sm font-medium text-foreground">Open tool</span>
					<span
						aria-hidden="true"
						className="grid size-7 place-items-center rounded-full border border-border text-muted-foreground transition-[color,border-color] duration-200 group-hover:border-foreground/30 group-hover:text-foreground"
					>
						<ArrowRight className="size-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-within:translate-x-0.5" />
					</span>
				</span>
			</Link>
			{user && (
				<FavoriteButton tool={tool} className="absolute top-5 right-5 z-10 size-9 rounded-full" />
			)}
		</article>
	);
}

/** Per-accent hairline used for the hover sweep on shelf cards. */
const ACCENT_BAR: Record<string, string> = {
	emerald: "bg-cat-emerald-border",
	rose: "bg-cat-rose-border",
	indigo: "bg-cat-indigo-border",
	amber: "bg-cat-amber-border",
	violet: "bg-cat-violet-border",
	sky: "bg-cat-sky-border",
	teal: "bg-cat-teal-border",
};

/** Workspace shelf card: icon, meta, and a hover-revealed open affordance. */
export function ShelfToolCard({
	tool,
	index = 0,
	stagger = false,
	className,
}: {
	tool: ToolDef;
	index?: number;
	stagger?: boolean;
	className?: string;
}) {
	const { user } = useAccount();
	const style = categoryStyles[tool.category];
	const category = categoryById[tool.category];

	return (
		<article
			className={cn("group relative h-full min-w-0", stagger && "shelf-enter", className)}
			style={stagger ? { animationDelay: `${Math.min(index, 6) * 100}ms` } : undefined}
		>
			<Link
				to="/tools/$slug"
				params={{ slug: tool.slug }}
				aria-label={`${tool.name}. Open tool.`}
				className="relative flex h-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 transition-[border-color,box-shadow] duration-200 group-hover:border-foreground/20 group-hover:shadow-hover group-focus-within:border-foreground/20 group-focus-within:shadow-hover"
			>
				<span
					aria-hidden="true"
					className={cn(
						"absolute top-0 left-3 h-px w-[calc(100%-1.5rem)] origin-left scale-x-0 transition-transform duration-300 ease-out motion-safe:group-hover:scale-x-100 motion-safe:group-focus-within:scale-x-100",
						ACCENT_BAR[style.accent] ?? "bg-foreground/40",
					)}
				/>
				<ToolIcon tool={tool} size="md" />
				<span className="min-w-0 flex-1">
					<span className="block truncate text-sm font-semibold text-foreground">{tool.name}</span>
					<span className="mt-0.5 flex min-w-0 items-center gap-1.5">
						<span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
						<span
							className={cn(
								"shrink-0 font-mono text-[0.5625rem] font-medium tracking-[0.12em] uppercase",
								style.text,
							)}
						>
							{categoryShortName(category.name)}
						</span>
						<span aria-hidden="true" className="truncate text-xs text-muted-foreground">
							· {tool.tagline}
						</span>
					</span>
				</span>
				<span
					aria-hidden="true"
					className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground opacity-60 transition-[color,border-color,opacity,translate] duration-200 group-hover:translate-x-0.5 group-hover:border-foreground/30 group-hover:text-foreground group-hover:opacity-100 group-focus-within:translate-x-0.5 group-focus-within:text-foreground group-focus-within:opacity-100"
				>
					<ArrowRight className="size-3.5" />
				</span>
			</Link>
			{user && (
				<FavoriteButton
					tool={tool}
					className="absolute top-1/2 right-3 z-10 size-9 -translate-y-1/2 rounded-full"
				/>
			)}
		</article>
	);
}
