import { categories, isCategoryId, tools, toolsInCategory } from "@qbtools/registry";
import { Input } from "@qbtools/ui/input";
import { cn } from "@qbtools/ui/utils";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Grid, List, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { FilterChip } from "#/components/filter-chip";
import { ToolCard } from "#/components/tool-card";
import { searchIndex } from "#/lib/search";
import { seo } from "#/lib/seo";

const searchSchema = z.object({
	q: z.string().optional().catch(undefined),
	category: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/tools/")({
	validateSearch: searchSchema,
	head: () =>
		seo({
			title: `All Free Online Tools (${tools.length}) — Image, PDF, Text & More`,
			description:
				"Browse every free QBTools tool: image compressor, PDF merger, word counter, EMI and GPA calculators, QR code and password generators, and media tools.",
			path: "/tools",
		}),
	component: AllToolsPage,
});

function AllToolsPage() {
	const { q = "", category } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const activeCategory = category && isCategoryId(category) ? category : undefined;
	const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

	const results = useMemo(() => {
		if (!q.trim()) return null;
		const seen = new Set<string>();
		// Collapse presets into their parent tool for the grid.
		return searchIndex
			.search(q, 40)
			.map((r) => r.tool)
			.filter((tool) => {
				if (seen.has(tool.slug)) return false;
				seen.add(tool.slug);
				return true;
			})
			.filter((tool) => !activeCategory || tool.category === activeCategory);
	}, [q, activeCategory]);

	const setSearch = (next: { q?: string; category?: string }) =>
		navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

	const visibleCategories = activeCategory
		? categories.filter((c) => c.id === activeCategory)
		: categories;

	return (
		<div className="container-page py-10 sm:py-16">
			<div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
				<div>
					<span className="label-mono !text-subtle">Directory</span>
					<h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">All Tools</h1>
					<p className="mt-2 text-base text-muted-foreground sm:text-lg">
						{tools.length} free browser tools. Fast, private, and zero server uploads.
					</p>
				</div>

				{/* View mode */}
				<div className="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="View mode">
					{(
						[
							["grid", "Grid view", Grid],
							["compact", "Compact view", List],
						] as const
					).map(([mode, label, Icon]) => (
						<button
							key={mode}
							type="button"
							onClick={() => setViewMode(mode)}
							aria-label={label}
							aria-pressed={viewMode === mode}
							className={cn(
								"grid size-8 cursor-pointer place-items-center rounded-md transition-colors",
								viewMode === mode
									? "bg-card text-foreground shadow-card"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon className="size-4" />
						</button>
					))}
				</div>
			</div>

			<div className="relative mt-8 max-w-2xl">
				<Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-subtle" />
				<Input
					type="search"
					aria-label="Search tools"
					placeholder="Search all tools by name, action or format…"
					value={q}
					onChange={(event) => setSearch({ q: event.target.value || undefined })}
					className="h-14 rounded-lg pl-12 text-base"
				/>
				{q && (
					<button
						type="button"
						onClick={() => setSearch({ q: undefined })}
						aria-label="Clear search"
						className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
					>
						✕
					</button>
				)}
			</div>

			{/* Category filters */}
			<div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
				<FilterChip
					label="All"
					count={tools.length}
					active={!activeCategory}
					onClick={() => setSearch({ category: undefined })}
				/>
				{categories
					.filter((c) => toolsInCategory(c.id).length > 0)
					.map((c) => (
						<FilterChip
							key={c.id}
							label={c.name}
							count={toolsInCategory(c.id).length}
							category={c.id}
							active={activeCategory === c.id}
							onClick={() => setSearch({ category: c.id })}
						/>
					))}
			</div>

			{results ? (
				<section className="mt-10" aria-live="polite">
					<div className="flex items-center justify-between border-b border-border pb-3">
						<h2 className="text-xl font-medium">
							{results.length} {results.length === 1 ? "result" : "results"} for “{q}”
						</h2>
						<button
							type="button"
							onClick={() => setSearch({ q: undefined })}
							className="label-mono cursor-pointer text-foreground underline hover:no-underline"
						>
							Clear search
						</button>
					</div>

					{results.length === 0 ? (
						<div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
							<p className="text-lg font-medium text-foreground">No tool matches found</p>
							<p className="mt-2 text-muted-foreground">
								Try another search term or browse a different category.
							</p>
						</div>
					) : (
						<div
							className={cn(
								"mt-6 grid sm:grid-cols-2 lg:grid-cols-3",
								viewMode === "compact" ? "gap-3" : "gap-6",
							)}
						>
							{results.map((tool) => (
								<ToolCard
									key={tool.slug}
									tool={tool}
									variant={viewMode === "compact" ? "compact" : "default"}
								/>
							))}
						</div>
					)}
				</section>
			) : (
				visibleCategories.map((c) => (
					<section key={c.id} aria-labelledby={`cat-${c.id}`} className="mt-14">
						<div className="flex items-baseline justify-between border-b border-border pb-3">
							<h2 id={`cat-${c.id}`} className="text-2xl font-medium tracking-[-0.035em]">
								<Link
									to="/categories/$category"
									params={{ category: c.id }}
									className="hover:text-primary transition-colors"
								>
									{c.name}
								</Link>
							</h2>
							<span className="label-mono text-subtle">{toolsInCategory(c.id).length} tools</span>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">{c.tagline}</p>
						<div
							className={cn(
								"mt-6 grid sm:grid-cols-2 lg:grid-cols-3",
								viewMode === "compact" ? "gap-3" : "gap-6",
							)}
						>
							{toolsInCategory(c.id).map((tool) => (
								<ToolCard
									key={tool.slug}
									tool={tool}
									variant={viewMode === "compact" ? "compact" : "default"}
								/>
							))}
						</div>
					</section>
				))
			)}
		</div>
	);
}
