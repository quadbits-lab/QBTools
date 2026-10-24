import { categoryById, isCategoryId, toolsInCategory } from "@qbtools/registry";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Breadcrumbs } from "#/components/breadcrumbs";
import { ToolCard } from "#/components/tool-card";
import { categoryTone, iconFor } from "#/lib/icons";
import { breadcrumbLd, seo } from "#/lib/seo";
import { absoluteUrl } from "#/lib/site";

export const Route = createFileRoute("/categories/$category")({
	loader: ({ params }) => {
		if (!isCategoryId(params.category)) throw notFound();
		return { id: params.category };
	},
	head: ({ loaderData }) => {
		if (!loaderData) return {};
		const category = categoryById[loaderData.id];
		const path = `/categories/${category.id}`;
		const list = toolsInCategory(category.id);
		return seo({
			title: `Free Online ${category.name} — ${list.map((t) => t.name).join(", ")}`,
			description: category.description,
			path,
			jsonLd: [
				breadcrumbLd([
					{ name: "Home", path: "/" },
					{ name: category.name, path },
				]),
				{
					"@context": "https://schema.org",
					"@type": "ItemList",
					itemListElement: list.map((tool, i) => ({
						"@type": "ListItem",
						position: i + 1,
						url: absoluteUrl(`/tools/${tool.slug}`),
						name: tool.name,
					})),
				},
			],
		});
	},
	component: CategoryPage,
});

function CategoryPage() {
	const { id } = Route.useLoaderData();
	const category = categoryById[id];
	const Icon = iconFor(category.icon);
	const list = toolsInCategory(id);
	const presets = list.flatMap((tool) => (tool.presets ?? []).map((preset) => ({ tool, preset })));

	return (
		<div className="container-page py-8 sm:py-12">
			<Breadcrumbs items={[{ name: "Home", href: "/" }, { name: category.name }]} />
			<header className="flex flex-col gap-5 sm:flex-row sm:items-center">
				<span
					className={`grid size-20 shrink-0 place-items-center rounded-xl border ${categoryTone[id]}`}
				>
					<Icon className="size-10" />
				</span>
				<div>
					<h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
						Free {category.name.toLowerCase()}
					</h1>
					<p className="mt-2 max-w-3xl text-lg text-muted-foreground">{category.description}</p>
				</div>
			</header>
			<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{list.map((tool) => (
					<ToolCard key={tool.slug} tool={tool} />
				))}
			</div>
			{presets.length > 0 && (
				<section aria-labelledby="shortcuts" className="mt-14">
					<h2 id="shortcuts" className="text-xl font-semibold tracking-[-0.02em]">
						Popular shortcuts
					</h2>
					<div className="mt-4 flex flex-wrap gap-2">
						{presets.map(({ tool, preset }) => (
							<Link
								key={`${tool.slug}/${preset.slug}`}
								to="/tools/$slug/$preset"
								params={{ slug: tool.slug, preset: preset.slug }}
								className="inline-flex h-9 items-center rounded-full border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
							>
								{preset.title}
							</Link>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
