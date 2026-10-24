import { guides } from "@qbtools/content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { PageHero } from "#/components/page";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/guides/")({
	head: () =>
		seo({
			title: "Guides — How-tos for Images, PDFs, Loans & More",
			description: "Short, practical guides that help you get everyday digital jobs done fast.",
			path: "/guides",
		}),
	component: GuidesPage,
});

function GuidesPage() {
	const list = [...guides].sort((a, b) => b.published.localeCompare(a.published));
	return (
		<>
			<PageHero
				eyebrow="Guides"
				title="Quick how-tos for everyday jobs"
				description={<p>Plain-language guides, each paired with a free tool.</p>}
			/>
			<div className="container-page grid gap-5 py-10 md:grid-cols-2 lg:grid-cols-3">
				{list.map((guide) => (
					<Link
						key={guide.slug}
						to="/guides/$slug"
						params={{ slug: guide.slug }}
						className="group flex flex-col border border-border bg-surface p-6 hover:border-primary/50"
					>
						<span className="flex items-center gap-2 text-sm text-muted-foreground">
							<Clock className="size-4" /> {guide.readMinutes} min read ·{" "}
							{new Date(guide.published).toLocaleDateString("en", {
								day: "numeric",
								month: "short",
								year: "numeric",
								timeZone: "UTC",
							})}
						</span>
						<h2 className="mt-3 text-xl leading-snug font-medium group-hover:text-primary">
							{guide.title}
						</h2>
						<p className="mt-2 text-muted-foreground">{guide.description}</p>
					</Link>
				))}
			</div>
		</>
	);
}
