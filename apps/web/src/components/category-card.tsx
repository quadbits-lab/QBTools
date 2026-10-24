import { type Category, toolsInCategory } from "@qbtools/registry";
import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { categoryStyles, iconFor } from "#/lib/icons";

/**
 * Browse-by-discipline card. The whole surface links to the category page, so
 * the only interactive element is the card itself; the tool preview and footer
 * are intentionally non-interactive to keep the section's tab order short.
 */
export function CategoryCard({
	category,
	count,
	index,
}: {
	category: Category;
	count: number;
	index: number;
}) {
	const Icon = iconFor(category.icon);
	const style = categoryStyles[category.id];
	const sampleTools = toolsInCategory(category.id).slice(0, 3);

	return (
		<Link
			to="/categories/$category"
			params={{ category: category.id }}
			aria-label={`${category.name}. Explore ${count} tools.`}
			className={cn(
				"group relative flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-hover focus-visible:-translate-y-0.5",
				style.borderHover,
			)}
		>
			<span
				aria-hidden="true"
				className={cn(
					"absolute top-0 right-5 left-5 h-px origin-left scale-x-0 opacity-0 transition-[transform,opacity] duration-300 group-hover:scale-x-100 group-hover:opacity-100 group-focus-visible:scale-x-100 group-focus-visible:opacity-100",
					style.dot,
				)}
			/>

			<span className="flex items-start justify-between gap-4">
				<span
					className={cn(
						"grid size-12 shrink-0 place-items-center rounded-lg border transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105",
						style.tile,
					)}
				>
					<Icon className="size-6" strokeWidth={2} aria-hidden="true" />
				</span>
				<span
					aria-hidden="true"
					className="pt-0.5 font-mono text-[0.6875rem] font-medium tracking-[0.12em] text-subtle"
				>
					{String(index).padStart(2, "0")}
				</span>
			</span>

			<h3 className="mt-5 text-xl leading-6 font-semibold tracking-[-0.025em] text-foreground sm:min-h-12">
				{category.name}
			</h3>
			<p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground sm:min-h-10">
				{category.tagline}
			</p>

			<span aria-hidden="true" className="my-4 h-px bg-border" />

			<span className="flex flex-col gap-1.5 sm:min-h-[4.5rem]">
				{sampleTools.map((tool) => (
					<span key={tool.slug} className="flex items-center gap-2 text-sm text-muted-foreground">
						<span aria-hidden="true" className={cn("size-1 shrink-0 rounded-full", style.dot)} />
						<span className="truncate">{tool.name}</span>
					</span>
				))}
			</span>

			<span className="mt-auto flex items-center justify-between gap-3 pt-5">
				<span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", style.text)}>
					Explore {count} tools
				</span>
				<span
					aria-hidden="true"
					className="grid size-7 place-items-center rounded-full border border-border text-muted-foreground transition-[color,border-color] duration-200 group-hover:border-foreground/30 group-hover:text-foreground"
				>
					<ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" />
				</span>
			</span>
		</Link>
	);
}
