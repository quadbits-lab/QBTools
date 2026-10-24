import { categoryById, relatedTools, type ToolDef, type ToolPreset } from "@qbtools/registry";
import { Badge } from "@qbtools/ui/badge";
import { Button } from "@qbtools/ui/button";
import { cn } from "@qbtools/ui/utils";
import { ClientOnly, Link } from "@tanstack/react-router";
import { Check, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Component, type ReactNode, Suspense, useEffect } from "react";
import { favoriteTools, markToolUsed, toggleFavorite } from "#/lib/local-store";
import { widgets } from "#/tools/widgets";
import { AdSlot } from "./ad-slot";
import { Breadcrumbs } from "./breadcrumbs";
import { FaqList } from "./faq";
import { Notice } from "./kit/notice";
import { ToolCard, ToolIcon } from "./tool-card";

function WidgetSkeleton() {
	return (
		<div className="flex min-h-80 flex-col gap-4 p-1" aria-hidden="true">
			<div className="h-56 animate-pulse rounded-2xl bg-muted" />
			<div className="h-12 w-48 animate-pulse rounded-xl bg-muted" />
		</div>
	);
}

class WidgetBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
	state = { error: null as Error | null };
	static getDerivedStateFromError(error: Error) {
		return { error };
	}
	render() {
		if (this.state.error) {
			return (
				<Notice tone="critical">
					Something went wrong loading this tool. Please refresh the page. If it keeps happening, your browser may be too old for
					this tool — try the latest Chrome, Edge, Safari or Firefox.
				</Notice>
			);
		}
		return this.props.children;
	}
}

function FavoriteButton({ slug }: { slug: string }) {
	const favorites = favoriteTools.use();
	const active = favorites.includes(slug);
	return (
		<Button variant="secondary" size="sm" onClick={() => toggleFavorite(slug)} aria-pressed={active}>
			<Star className={cn("size-4", active && "fill-accent text-accent")} />
			{active ? "Saved" : "Save tool"}
		</Button>
	);
}

export function ToolPage({ tool, preset }: { tool: ToolDef; preset?: ToolPreset }) {
	const category = categoryById[tool.category];
	const Widget = widgets[tool.slug];
	const related = relatedTools(tool);

	useEffect(() => markToolUsed(tool.slug), [tool.slug]);

	return (
		<div className="container-page pt-6 pb-4 sm:pt-8">
			<Breadcrumbs
				items={[
					{ name: "Home", href: "/" },
					{ name: category.name, href: `/categories/${category.id}` },
					...(preset ? [{ name: tool.name, href: `/tools/${tool.slug}` }, { name: preset.title }] : [{ name: tool.name }]),
				]}
			/>

			<header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
				<ToolIcon tool={tool} size="lg" />
				<div className="flex-1">
					<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{preset?.title ?? tool.name}</h1>
					<p className="mt-2 max-w-3xl text-lg text-muted-foreground">{preset?.intro ?? tool.tagline}</p>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						{tool.runtime === "browser" ? (
							<Badge tone="positive">
								<ShieldCheck /> Private: runs on your device
							</Badge>
						) : (
							<Badge tone="primary">
								<Sparkles /> AI-powered
							</Badge>
						)}
						<Badge>
							<Check /> Free, no signup
						</Badge>
						<FavoriteButton slug={tool.slug} />
					</div>
				</div>
			</header>

			<section aria-label={`${tool.name} tool`} className="rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-6">
				<ClientOnly fallback={<WidgetSkeleton />}>
					<WidgetBoundary>
						<Suspense fallback={<WidgetSkeleton />}>{Widget ? <Widget tool={tool} params={preset?.params ?? {}} /> : null}</Suspense>
					</WidgetBoundary>
				</ClientOnly>
			</section>

			<AdSlot position="top" />

			<section aria-labelledby="how-to" className="mt-14">
				<h2 id="how-to" className="text-2xl font-extrabold tracking-tight">
					How to use {tool.name}
				</h2>
				<ol className="mt-5 grid gap-4 md:grid-cols-3">
					{tool.howTo.map((step, index) => (
						<li key={step.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
							<span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-mono text-lg font-bold text-primary-foreground">
								{index + 1}
							</span>
							<span>
								<span className="block font-bold">{step.title}</span>
								<span className="mt-1 block text-muted-foreground">{step.text}</span>
							</span>
						</li>
					))}
				</ol>
			</section>

			<section aria-labelledby="about" className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
				<div>
					<h2 id="about" className="text-2xl font-extrabold tracking-tight">
						What is {tool.name}?
					</h2>
					<p className="mt-4 text-[1.0625rem] leading-relaxed">{tool.about.what}</p>
				</div>
				<div className="rounded-2xl bg-surface-2 p-6">
					<h3 className="text-lg font-bold">When to use it</h3>
					<ul className="mt-3 flex flex-col gap-2.5">
						{tool.about.when.map((item) => (
							<li key={item} className="flex gap-2.5">
								<Check className="mt-1 size-4 shrink-0 text-positive" />
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>
			</section>

			{tool.presets && tool.presets.length > 0 && (
				<section aria-labelledby="presets" className="mt-14">
					<h2 id="presets" className="text-xl font-extrabold tracking-tight">
						Popular shortcuts
					</h2>
					<div className="mt-4 flex flex-wrap gap-2">
						{tool.presets.map((p) => (
							<Link
								key={p.slug}
								to="/tools/$slug/$preset"
								params={{ slug: tool.slug, preset: p.slug }}
								className={cn(
									"rounded-full border border-border bg-surface px-4 py-2.5 font-semibold hover:border-primary hover:text-primary",
									p.slug === preset?.slug && "border-primary bg-primary-soft text-primary",
								)}
							>
								{p.title}
							</Link>
						))}
					</div>
				</section>
			)}

			<section aria-labelledby="faq" className="mt-14">
				<h2 id="faq" className="text-2xl font-extrabold tracking-tight">
					Frequently asked questions
				</h2>
				<div className="mt-5 max-w-4xl">
					<FaqList faqs={tool.faqs} />
				</div>
			</section>

			{related.length > 0 && (
				<section aria-labelledby="related" className="mt-14">
					<h2 id="related" className="text-2xl font-extrabold tracking-tight">
						Related tools
					</h2>
					<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{related.map((t) => (
							<ToolCard key={t.slug} tool={t} />
						))}
					</div>
				</section>
			)}

			<AdSlot position="bottom" />
		</div>
	);
}

/** head() for both plain tool pages and preset landing pages. */
export function toolPageSeoInput(tool: ToolDef, preset?: ToolPreset) {
	const category = categoryById[tool.category];
	const path = preset ? `/tools/${tool.slug}/${preset.slug}` : `/tools/${tool.slug}`;
	return {
		path,
		title: preset ? `${preset.title} — Free & Private` : tool.title,
		description: preset?.description ?? tool.description,
		breadcrumbs: [
			{ name: "Home", path: "/" },
			{ name: category.name, path: `/categories/${category.id}` },
			{ name: tool.name, path: `/tools/${tool.slug}` },
			...(preset ? [{ name: preset.title, path }] : []),
		],
		categoryLabel: tool.category === "calculators" ? "FinanceApplication" : "UtilitiesApplication",
	};
}
