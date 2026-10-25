import { type Category, toolsInCategory } from "@qbtools/registry";
import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";
import { categoryStyles, iconFor } from "#/lib/icons";

/**
 * Mobile-only discipline browser: a two-column grid of category tiles where one
 * tile expands into a full-width panel with its first tools. Hidden at `sm`.
 */
export function DisciplineAccordion({ categories }: { categories: ReadonlyArray<Category> }) {
	const [openCategory, setOpenCategory] = useState<string | null>(null);

	return (
		<div className="mt-10 grid grid-flow-dense grid-cols-2 gap-2 sm:hidden">
			{categories.map((category) => {
				const expanded = openCategory === category.id;
				const panelId = `m-cat-${category.id}`;
				const count = toolsInCategory(category.id).length;
				const sample = toolsInCategory(category.id).slice(0, 3);
				const Icon = iconFor(category.icon);
				const style = categoryStyles[category.id];

				return (
					<Fragment key={category.id}>
						<button
							type="button"
							aria-expanded={expanded}
							aria-controls={panelId}
							onClick={() => setOpenCategory(expanded ? null : category.id)}
							className={cn(
								"flex h-full cursor-pointer flex-col rounded-xl border bg-card p-3 text-left transition-[background-color,border-color] duration-150 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
								expanded ? "border-foreground/25" : "border-border hover:border-foreground/20",
							)}
						>
							<span className="flex items-start justify-between gap-2">
								<span
									className={cn(
										"grid size-9 shrink-0 place-items-center rounded-md border",
										style.tile,
									)}
								>
									<Icon className="size-[18px]" aria-hidden="true" />
								</span>
								<ChevronDown
									aria-hidden="true"
									className={cn(
										"mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform motion-safe:duration-200",
										expanded && "rotate-180",
									)}
								/>
							</span>
							<span className="mt-4 line-clamp-2 text-sm leading-5 font-medium text-foreground">
								{category.name}
							</span>
							<span className="label-mono mt-2 !text-subtle">
								{count} tool{count === 1 ? "" : "s"}
							</span>
						</button>

						{expanded && (
							<div id={panelId} className="col-span-2 rounded-xl border border-border bg-card p-4">
								<p className="text-sm leading-5 text-muted-foreground">{category.tagline}</p>
								<div className="mt-3 flex flex-col gap-0.5">
									{sample.map((tool) => (
										<Link
											key={tool.slug}
											to="/tools/$slug"
											params={{ slug: tool.slug }}
											className="flex items-center gap-2 rounded-md py-1.5 text-sm text-foreground/90 transition-colors duration-150 hover:text-foreground"
										>
											<span
												aria-hidden="true"
												className={cn("size-1 shrink-0 rounded-full", style.dot)}
											/>
											<span className="truncate">{tool.name}</span>
										</Link>
									))}
								</div>
								<Link
									to="/categories/$category"
									params={{ category: category.id }}
									className="mt-3 inline-flex items-center gap-1.5 rounded-md px-1 text-sm font-medium text-foreground hover:text-primary"
								>
									Explore {count} tools <ArrowRight className="size-3.5" aria-hidden="true" />
								</Link>
							</div>
						)}
					</Fragment>
				);
			})}
		</div>
	);
}
