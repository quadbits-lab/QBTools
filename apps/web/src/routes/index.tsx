import { latestGuides } from "@qbtools/content";
import { categories, getTool, popularTools, tools, toolsInCategory } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Kicker } from "#/components/page";
import { SearchBox } from "#/components/search-box";
import { CategoryCard, ToolCard } from "#/components/tool-card";
import { favoriteTools, recentTools } from "#/lib/local-store";
import { seo } from "#/lib/seo";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "#/lib/site";

export const Route = createFileRoute("/")({
	head: () =>
		seo({
			title: `${SITE_NAME} — ${SITE_TAGLINE}: Free Online Tools, No Signup`,
			rawTitle: true,
			description: SITE_DESCRIPTION,
			path: "/",
			jsonLd: [
				{
					"@context": "https://schema.org",
					"@type": "WebSite",
					name: SITE_NAME,
					url: absoluteUrl("/"),
					potentialAction: {
						"@type": "SearchAction",
						target: `${absoluteUrl("/tools")}?q={search_term_string}`,
						"query-input": "required name=search_term_string",
					},
				},
			],
		}),
	component: HomePage,
});

const QUICK = [
	"compress-image",
	"merge-pdf",
	"word-counter",
	"qr-code-generator",
	"emi-calculator",
];

const WHY = [
	{ title: "Free", text: "Every tool is free to use, as often as you like." },
	{ title: "No signup", text: "No account, no email, no waiting. Open a tool and go." },
	{ title: "Private", text: "Files are processed in your browser and never stored." },
	{ title: "Fast", text: "Lightweight pages and instant results, even on slow phones." },
];

const SERVICES = [
	{
		title: "Custom tools & websites",
		text: "Calculators, converters and sites built for your business.",
	},
	{ title: "Design & branding", text: "Logos, social graphics and thumbnails that stand out." },
	{ title: "SEO & growth", text: "Pages and content built to be found on Google." },
];

/** Section heading row: [index] kicker over a medium title, optional link on the right. */
function SectionHead({
	index,
	kicker,
	title,
	id,
	link,
}: {
	index: number;
	kicker: string;
	title: string;
	id: string;
	link?: { to: string; label: string };
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-6">
			<div>
				<Kicker index={index}>{kicker}</Kicker>
				<h2 id={id} className="mt-4 text-3xl tracking-[-0.035em] sm:text-4xl">
					{title}
				</h2>
			</div>
			{link && (
				<Link
					to={link.to}
					className="label-mono border-b border-input pb-1 text-foreground transition-colors hover:border-foreground"
				>
					{link.label} →
				</Link>
			)}
		</div>
	);
}

function PersonalShelf() {
	const recent = recentTools.use();
	const favorites = favoriteTools.use();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const slugs = [...favorites, ...recent.filter((s) => !favorites.includes(s))].slice(0, 4);
	const list = slugs.map(getTool).filter((t) => t !== undefined);
	if (!mounted || list.length === 0) return null;
	return (
		<section aria-labelledby="your-tools" className="container-page reveal pt-16">
			<Kicker>Your tools</Kicker>
			<h2 id="your-tools" className="sr-only">
				Your tools
			</h2>
			<div className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
				{list.map((tool) => (
					<ToolCard key={tool.slug} tool={tool} className="border-0" />
				))}
			</div>
		</section>
	);
}

function HomePage() {
	const guides = latestGuides(3);
	return (
		<>
			{/* 1. Hero */}
			<section className="border-b border-border">
				<div className="container-page flex min-h-[min(78vh,46rem)] flex-col justify-end gap-10 pt-20 pb-14 sm:pb-20">
					<div className="reveal flex flex-wrap items-center justify-between gap-4">
						<Kicker>{tools.length} free tools · No signup · Private</Kicker>
						<span className="label-mono text-subtle">[ Search or pick a tool ]</span>
					</div>
					<h1 className="display reveal max-w-5xl text-[clamp(3rem,9vw,7.5rem)] [animation-delay:100ms]">
						Free tools that just work.
					</h1>
					<div className="reveal grid gap-8 [animation-delay:200ms] lg:grid-cols-[1fr_1.1fr] lg:items-end">
						<p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
							Compress photos, merge PDFs, count words, work out your EMI and more — in seconds,
							right in your browser.
						</p>
						<div className="flex flex-col gap-4">
							<SearchBox />
							<div className="flex flex-wrap gap-2">
								{QUICK.map(getTool)
									.filter((t) => t !== undefined)
									.map((tool) => (
										<Link
											key={tool.slug}
											to="/tools/$slug"
											params={{ slug: tool.slug }}
											className="label-mono border border-input px-3 py-2.5 text-foreground transition-colors hover:border-foreground"
										>
											{tool.name}
										</Link>
									))}
							</div>
						</div>
					</div>
				</div>
			</section>

			<PersonalShelf />

			{/* 2. Popular tools */}
			<section aria-labelledby="popular" className="container-page pt-24 sm:pt-32">
				<SectionHead
					index={1}
					kicker="Most used"
					title="Popular tools"
					id="popular"
					link={{ to: "/tools", label: "All tools" }}
				/>
				<div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
					{popularTools(9).map((tool) => (
						<ToolCard key={tool.slug} tool={tool} className="border-0" />
					))}
				</div>
			</section>

			{/* 3. Categories */}
			<section aria-labelledby="categories" className="container-page pt-24 sm:pt-32">
				<SectionHead
					index={2}
					kicker="Six disciplines"
					title="Browse by category"
					id="categories"
				/>
				<div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
					{categories.map((category, i) => (
						<CategoryCard
							key={category.id}
							category={category}
							index={i + 1}
							count={toolsInCategory(category.id).length}
						/>
					))}
				</div>
			</section>

			{/* 4. Why us */}
			<section aria-labelledby="why" className="container-page pt-24 sm:pt-32">
				<SectionHead
					index={3}
					kicker="Why QBTools"
					title={`Why people use ${SITE_NAME}`}
					id="why"
				/>
				<div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4">
					{WHY.map((item, i) => (
						<div
							key={item.title}
							className="flex flex-col gap-3 border-t border-input pt-5 pr-6 pb-8"
						>
							<span className="label-mono text-subtle">0{i + 1}</span>
							<h3 className="text-2xl tracking-[-0.03em]">{item.title}</h3>
							<p className="text-muted-foreground">{item.text}</p>
						</div>
					))}
				</div>
			</section>

			{/* 5. Services teaser — inverted panel */}
			<section aria-labelledby="services" className="container-page pt-24 sm:pt-32">
				<div className="grid gap-12 bg-primary p-8 text-primary-foreground sm:p-14 lg:grid-cols-[1fr_1.3fr] lg:items-end">
					<div>
						<p className="label-mono text-primary-foreground/70">[04] · QBTools Services</p>
						<h2 id="services" className="display mt-5 text-4xl sm:text-5xl">
							Need something built just for you?
						</h2>
						<p className="mt-5 max-w-md text-lg text-primary-foreground/75">
							The team behind QBTools builds websites, tools and designs for small businesses.
						</p>
						<Button
							asChild
							size="lg"
							arrow
							className="mt-8 border-primary-foreground bg-primary-foreground text-primary hover:bg-primary-foreground/85"
						>
							<Link to="/services">Get a free quote</Link>
						</Button>
					</div>
					<div className="grid sm:grid-cols-3">
						{SERVICES.map((item, i) => (
							<div
								key={item.title}
								className="flex flex-col gap-2 border-t border-primary-foreground/25 pt-4 pr-5 pb-6"
							>
								<span className="label-mono text-primary-foreground/60">0{i + 1}</span>
								<h3 className="text-lg tracking-[-0.02em]">{item.title}</h3>
								<p className="text-sm text-primary-foreground/70">{item.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* 6. Latest guides */}
			<section aria-labelledby="guides" className="container-page pt-24 sm:pt-32">
				<SectionHead
					index={5}
					kicker="Guides"
					title="Latest guides"
					id="guides"
					link={{ to: "/guides", label: "All guides" }}
				/>
				<div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">
					{guides.map((guide) => (
						<Link
							key={guide.slug}
							to="/guides/$slug"
							params={{ slug: guide.slug }}
							className="group flex flex-col gap-4 bg-surface p-6 transition-colors hover:bg-surface-2 sm:p-8"
						>
							<span className="label-mono">{guide.readMinutes} min read</span>
							<span className="text-xl leading-snug tracking-[-0.02em]">{guide.title}</span>
							<span className="line-clamp-3 text-muted-foreground">{guide.description}</span>
							<span className="mt-auto flex items-center gap-2 pt-2 label-mono text-foreground">
								Read guide{" "}
								<ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-1" />
							</span>
						</Link>
					))}
				</div>
			</section>
		</>
	);
}
