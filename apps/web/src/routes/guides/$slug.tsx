import { type GuideBlock, getGuide } from "@qbtools/content";
import { getTool } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Breadcrumbs } from "#/components/breadcrumbs";
import { ToolCard } from "#/components/tool-card";
import { breadcrumbLd, seo } from "#/lib/seo";
import { absoluteUrl, SITE_NAME } from "#/lib/site";

export const Route = createFileRoute("/guides/$slug")({
	loader: ({ params }) => {
		if (!getGuide(params.slug)) throw notFound();
		return { slug: params.slug };
	},
	head: ({ loaderData }) => {
		const guide = loaderData ? getGuide(loaderData.slug) : undefined;
		if (!guide) return {};
		const path = `/guides/${guide.slug}`;
		return seo({
			title: guide.title,
			description: guide.description,
			path,
			ogType: "article",
			jsonLd: [
				{
					"@context": "https://schema.org",
					"@type": "Article",
					headline: guide.title,
					description: guide.description,
					datePublished: guide.published,
					mainEntityOfPage: absoluteUrl(path),
					author: { "@type": "Organization", name: SITE_NAME },
					publisher: { "@type": "Organization", name: SITE_NAME },
				},
				breadcrumbLd([
					{ name: "Home", path: "/" },
					{ name: "Guides", path: "/guides" },
					{ name: guide.title, path },
				]),
			],
		});
	},
	component: GuidePage,
});

function Block({ block }: { block: GuideBlock }) {
	switch (block.type) {
		case "p":
			return <p>{block.text}</p>;
		case "h2":
			return <h2>{block.text}</h2>;
		case "ul":
			return (
				<ul>
					{block.items.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			);
		case "ol":
			return (
				<ol>
					{block.items.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ol>
			);
		case "tip":
			return (
				<aside className="not-prose my-8 flex gap-3 border border-input bg-surface-2 p-5">
					<Lightbulb className="mt-0.5 size-5 shrink-0 text-caution" />
					<p className="m-0">{block.text}</p>
				</aside>
			);
		case "tool":
			return (
				<div className="my-6">
					<Button asChild size="lg">
						{block.preset ? (
							<Link to="/tools/$slug/$preset" params={{ slug: block.slug, preset: block.preset }}>
								{block.label} <ArrowRight />
							</Link>
						) : (
							<Link to="/tools/$slug" params={{ slug: block.slug }}>
								{block.label} <ArrowRight />
							</Link>
						)}
					</Button>
				</div>
			);
	}
}

function GuidePage() {
	const { slug } = Route.useLoaderData();
	const guide = getGuide(slug);
	if (!guide) return null;
	const tools = guide.tools.map(getTool).filter((t) => t !== undefined);
	return (
		<article className="container-page py-8 sm:py-12">
			<Breadcrumbs
				items={[
					{ name: "Home", href: "/" },
					{ name: "Guides", href: "/guides" },
					{ name: guide.title },
				]}
			/>
			<header className="max-w-3xl">
				<h1 className="text-3xl leading-tight font-medium tracking-[-0.035em] text-balance sm:text-4xl">
					{guide.title}
				</h1>
				<p className="mt-3 text-lg text-muted-foreground">{guide.description}</p>
				<p className="mt-3 text-sm text-muted-foreground">
					{guide.readMinutes} min read · Published{" "}
					{new Date(guide.published).toLocaleDateString("en", {
						day: "numeric",
						month: "long",
						year: "numeric",
						timeZone: "UTC",
					})}
				</p>
			</header>
			<div className="prose-qb mt-8">
				{guide.body.map((block, index) => (
					<Block key={index} block={block} />
				))}
			</div>
			{tools.length > 0 && (
				<section aria-labelledby="guide-tools" className="mt-14">
					<h2 id="guide-tools" className="text-xl font-medium">
						Tools in this guide
					</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{tools.map((tool) => (
							<ToolCard key={tool.slug} tool={tool} />
						))}
					</div>
				</section>
			)}
		</article>
	);
}
