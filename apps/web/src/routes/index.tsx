import { latestGuides } from "@qbtools/content";
import { categories, getTool, popularTools, tools, toolsInCategory } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Code2, Gauge, Megaphone, Palette, ShieldCheck, Smile, UserX, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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

const QUICK = ["compress-image", "merge-pdf", "word-counter", "qr-code-generator", "emi-calculator"];

const WHY = [
	{ icon: BadgeCheck, title: "100% free", text: "Every tool is free to use, as often as you like." },
	{ icon: UserX, title: "No signup", text: "No account, no email, no waiting. Just open and go." },
	{ icon: ShieldCheck, title: "Private", text: "Files are processed in your browser and never stored." },
	{ icon: Zap, title: "Fast", text: "Lightweight pages and instant results, even on slow phones." },
];

const SERVICES = [
	{ icon: Code2, title: "Custom tools & websites", text: "Need a calculator or converter for your business? We build it." },
	{ icon: Palette, title: "Design & branding", text: "Logos, social graphics and thumbnails that stand out." },
	{ icon: Megaphone, title: "SEO & growth", text: "Get found on Google with pages built to rank." },
];

function PersonalShelf() {
	const recent = recentTools.use();
	const favorites = favoriteTools.use();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const slugs = [...favorites, ...recent.filter((s) => !favorites.includes(s))].slice(0, 4);
	const list = slugs.map(getTool).filter((t) => t !== undefined);
	if (!mounted || list.length === 0) return null;
	return (
		<section aria-labelledby="your-tools" className="container-page mt-16">
			<h2 id="your-tools" className="text-xl font-extrabold tracking-tight">
				Your tools
			</h2>
			<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{list.map((tool) => (
					<ToolCard key={tool.slug} tool={tool} />
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
			<section className="relative overflow-hidden border-b border-border bg-[radial-gradient(60rem_30rem_at_50%_-10%,var(--primary-soft),transparent)]">
				<div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
					<p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-semibold">
						<Smile className="size-4 text-primary" /> {tools.length} free tools · no signup · private
					</p>
					<h1 className="max-w-4xl text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-6xl">
						Free tools that <span className="text-primary">just work</span>
					</h1>
					<p className="mt-5 max-w-2xl text-lg text-balance text-muted-foreground sm:text-xl">
						Compress photos, merge PDFs, count words, work out your EMI and more — in seconds, right in your browser.
					</p>
					<div className="mt-9 w-full max-w-2xl">
						<SearchBox />
					</div>
					<div className="mt-5 flex flex-wrap justify-center gap-2">
						{QUICK.map(getTool)
							.filter((t) => t !== undefined)
							.map((tool) => (
								<Link
									key={tool.slug}
									to="/tools/$slug"
									params={{ slug: tool.slug }}
									className="rounded-full border border-border bg-surface px-4 py-2 font-semibold hover:border-primary hover:text-primary"
								>
									{tool.name}
								</Link>
							))}
					</div>
				</div>
			</section>

			<PersonalShelf />

			{/* 2. Popular tools */}
			<section aria-labelledby="popular" className="container-page mt-16">
				<div className="flex items-end justify-between gap-4">
					<h2 id="popular" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
						Popular tools
					</h2>
					<Link to="/tools" className="flex items-center gap-1 font-semibold text-primary hover:underline">
						All tools <ArrowRight className="size-4" />
					</Link>
				</div>
				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{popularTools(9).map((tool) => (
						<ToolCard key={tool.slug} tool={tool} />
					))}
				</div>
			</section>

			{/* 3. Categories */}
			<section aria-labelledby="categories" className="container-page mt-20">
				<h2 id="categories" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
					Browse by category
				</h2>
				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{categories.map((category) => (
						<CategoryCard key={category.id} category={category} count={toolsInCategory(category.id).length} />
					))}
				</div>
			</section>

			{/* 4. Why us */}
			<section aria-labelledby="why" className="mt-20 border-y border-border bg-surface">
				<div className="container-page py-16">
					<h2 id="why" className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
						Why people use {SITE_NAME}
					</h2>
					<div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{WHY.map((item) => (
							<div key={item.title} className="flex flex-col items-center text-center">
								<span className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary">
									<item.icon className="size-8" />
								</span>
								<h3 className="mt-4 text-lg font-bold">{item.title}</h3>
								<p className="mt-1 text-muted-foreground">{item.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* 5. Services teaser */}
			<section aria-labelledby="services" className="container-page mt-20">
				<div className="grid gap-8 rounded-3xl bg-foreground p-8 text-background sm:p-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
					<div>
						<p className="font-semibold text-accent">QBTools Services</p>
						<h2 id="services" className="mt-2 text-3xl font-extrabold tracking-tight">
							Need something built just for you?
						</h2>
						<p className="mt-3 text-lg opacity-80">The team behind QBTools builds websites, tools and designs for small businesses.</p>
						<Button asChild size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
							<Link to="/services">
								Get a free quote <ArrowRight />
							</Link>
						</Button>
					</div>
					<div className="grid gap-4 sm:grid-cols-3">
						{SERVICES.map((item) => (
							<div key={item.title} className="rounded-2xl bg-background/10 p-5">
								<item.icon className="size-7 text-accent" />
								<h3 className="mt-3 font-bold">{item.title}</h3>
								<p className="mt-1 text-sm opacity-80">{item.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* 6. Latest guides */}
			<section aria-labelledby="guides" className="container-page mt-20">
				<div className="flex items-end justify-between gap-4">
					<h2 id="guides" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
						Latest guides
					</h2>
					<Link to="/guides" className="flex items-center gap-1 font-semibold text-primary hover:underline">
						All guides <ArrowRight className="size-4" />
					</Link>
				</div>
				<div className="mt-6 grid gap-4 md:grid-cols-3">
					{guides.map((guide) => (
						<Link
							key={guide.slug}
							to="/guides/$slug"
							params={{ slug: guide.slug }}
							className="group flex flex-col rounded-2xl border border-border bg-surface p-6 hover:border-primary/50 hover:shadow-lg"
						>
							<span className="flex items-center gap-2 text-sm text-muted-foreground">
								<Gauge className="size-4" /> {guide.readMinutes} min read
							</span>
							<span className="mt-3 text-lg leading-snug font-bold group-hover:text-primary">{guide.title}</span>
							<span className="mt-2 line-clamp-3 text-muted-foreground">{guide.description}</span>
						</Link>
					))}
				</div>
			</section>
		</>
	);
}
