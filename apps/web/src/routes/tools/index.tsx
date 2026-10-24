import { categories, isCategoryId, tools, toolsInCategory } from "@qbtools/registry";
import { Input } from "@qbtools/ui/input";
import { cn } from "@qbtools/ui/utils";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";
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
		<div className="container-page py-10 sm:py-14">
			<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">All tools</h1>
			<p className="mt-2 text-lg text-muted-foreground">
				{tools.length} free tools. Search or pick a category.
			</p>

			<div className="relative mt-8 max-w-2xl">
				<Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					aria-label="Search tools"
					placeholder="Search tools…"
					value={q}
					onChange={(event) => setSearch({ q: event.target.value || undefined })}
					className="h-14 pl-12 text-lg"
				/>
			</div>

			<div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
				<button
					type="button"
					onClick={() => setSearch({ category: undefined })}
					aria-pressed={!activeCategory}
					className={cn(
						"min-h-11 cursor-pointer rounded-full border px-4 font-semibold",
						!activeCategory
							? "border-primary bg-primary text-primary-foreground"
							: "border-border bg-surface hover:border-primary",
					)}
				>
					All
				</button>
				{categories.map((c) => (
					<button
						key={c.id}
						type="button"
						onClick={() => setSearch({ category: c.id })}
						aria-pressed={activeCategory === c.id}
						className={cn(
							"min-h-11 cursor-pointer rounded-full border px-4 font-semibold",
							activeCategory === c.id
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-surface hover:border-primary",
						)}
					>
						{c.name}
					</button>
				))}
			</div>

			{results ? (
				<section className="mt-10" aria-live="polite">
					<h2 className="text-xl font-bold">
						{results.length} {results.length === 1 ? "result" : "results"} for “{q}”
					</h2>
					{results.length === 0 ? (
						<p className="mt-4 text-muted-foreground">
							No tool matches yet.{" "}
							<Link
								to="/contact"
								search={{ tab: "suggest" }}
								className="font-semibold text-primary underline"
							>
								Suggest it
							</Link>{" "}
							and we may build it next!
						</p>
					) : (
						<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{results.map((tool) => (
								<ToolCard key={tool.slug} tool={tool} />
							))}
						</div>
					)}
				</section>
			) : (
				visibleCategories.map((c) => (
					<section key={c.id} aria-labelledby={`cat-${c.id}`} className="mt-12">
						<h2 id={`cat-${c.id}`} className="text-2xl font-extrabold tracking-tight">
							<Link
								to="/categories/$category"
								params={{ category: c.id }}
								className="hover:text-primary"
							>
								{c.name}
							</Link>
						</h2>
						<p className="mt-1 text-muted-foreground">{c.tagline}</p>
						<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{toolsInCategory(c.id).map((tool) => (
								<ToolCard key={tool.slug} tool={tool} />
							))}
						</div>
					</section>
				))
			)}
		</div>
	);
}
