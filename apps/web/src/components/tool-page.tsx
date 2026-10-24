import { categoryById, relatedTools, type ToolDef, type ToolPreset } from "@qbtools/registry";
import { Badge } from "@qbtools/ui/badge";
import { Button } from "@qbtools/ui/button";
import { cn } from "@qbtools/ui/utils";
import { ClientOnly, Link } from "@tanstack/react-router";
import { Check, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Component, type ReactNode, Suspense, useEffect } from "react";
import { favoriteTools, markToolUsed, toggleFavorite } from "#/lib/local-store";
import { widgets } from "#/tools/widgets";
import { useAccount } from "./account-provider";
import { AdSlot } from "./ad-slot";
import { Breadcrumbs } from "./breadcrumbs";
import { FaqList } from "./faq";
import { Notice } from "./kit/notice";
import { Kicker } from "./page";
import { ToolCard, ToolIcon } from "./tool-card";

function WidgetSkeleton() {
	return (
		<div className="flex min-h-80 flex-col gap-4 p-1" aria-hidden="true">
			<div className="h-56 animate-pulse bg-muted" />
			<div className="h-12 w-48 animate-pulse bg-muted" />
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
					Something went wrong loading this tool. Please refresh the page. If it keeps happening,
					your browser may be too old for this tool — try the latest Chrome, Edge, Safari or
					Firefox.
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
		<Button
			variant="secondary"
			size="sm"
			onClick={() => toggleFavorite(slug)}
			aria-pressed={active}
		>
			<Star className={cn("size-4", active && "fill-foreground text-foreground")} />
			{active ? "Saved" : "Save tool"}
		</Button>
	);
}

export function ToolPage({ tool, preset }: { tool: ToolDef; preset?: ToolPreset }) {
	const { pending } = useAccount();
	const category = categoryById[tool.category];
	const Widget = widgets[tool.slug];
	const related = relatedTools(tool);

	useEffect(() => {
		if (!pending) markToolUsed(tool.slug);
	}, [tool.slug, pending]);

	return (
		<div className="container-page pt-8 pb-4 sm:pt-12">
			<Breadcrumbs
				items={[
					{ name: "Home", href: "/" },
					{ name: category.name, href: `/categories/${category.id}` },
					...(preset
						? [{ name: tool.name, href: `/tools/${tool.slug}` }, { name: preset.title }]
						: [{ name: tool.name }]),
				]}
			/>

			<header className="reveal mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
				<div className="flex flex-col gap-5">
					<ToolIcon tool={tool} size="lg" />
					<h1 className="display max-w-4xl text-[clamp(2.4rem,5.5vw,4.5rem)]">
						{preset?.title ?? tool.name}
					</h1>
					<p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
						{preset?.intro ?? tool.tagline}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 lg:justify-end">
					{tool.runtime === "browser" ? (
						<Badge tone="positive">
							<ShieldCheck /> Runs on your device
						</Badge>
					) : (
						<Badge tone="primary">
							<Sparkles /> AI-powered
						</Badge>
					)}
					<Badge>
						<Check /> Free · no signup
					</Badge>
					<FavoriteButton slug={tool.slug} />
				</div>
			</header>

			<section
				aria-label={`${tool.name} tool`}
				className="border border-input bg-surface p-4 sm:p-8"
			>
				<ClientOnly fallback={<WidgetSkeleton />}>
					<WidgetBoundary>
						<Suspense fallback={<WidgetSkeleton />}>
							{Widget ? <Widget tool={tool} params={preset?.params ?? {}} /> : null}
						</Suspense>
					</WidgetBoundary>
				</ClientOnly>
			</section>

			<AdSlot position="top" />

			<section aria-labelledby="how-to" className="pt-20 sm:pt-24">
				<Kicker index={1}>How it works</Kicker>
				<h2 id="how-to" className="mt-4 text-3xl tracking-[-0.035em]">
					How to use {tool.name}
				</h2>
				<ol className="mt-8 grid md:grid-cols-3">
					{tool.howTo.map((step, index) => (
						<li
							key={step.title}
							className="flex flex-col gap-3 border-t border-input pt-5 pr-8 pb-8"
						>
							<span className="label-mono text-subtle">
								Step {String(index + 1).padStart(2, "0")}
							</span>
							<span className="text-xl tracking-[-0.02em]">{step.title}</span>
							<span className="text-muted-foreground">{step.text}</span>
						</li>
					))}
				</ol>
			</section>

			<section aria-labelledby="about" className="grid gap-10 pt-16 lg:grid-cols-[1.4fr_1fr]">
				<div>
					<Kicker index={2}>About</Kicker>
					<h2 id="about" className="mt-4 text-3xl tracking-[-0.035em]">
						What is {tool.name}?
					</h2>
					<p className="mt-5 text-[1.0625rem] leading-relaxed text-muted-foreground">
						{tool.about.what}
					</p>
				</div>
				<div className="border border-border bg-surface-2 p-6 sm:p-8">
					<h3 className="label-mono">When to use it</h3>
					<ul className="mt-4 flex flex-col">
						{tool.about.when.map((item) => (
							<li
								key={item}
								className="flex gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
							>
								<Check className="mt-1 size-4 shrink-0" strokeWidth={1.5} />
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>
			</section>

			{tool.presets && tool.presets.length > 0 && (
				<section aria-labelledby="presets" className="pt-16">
					<Kicker index={3}>Shortcuts</Kicker>
					<h2 id="presets" className="sr-only">
						Popular shortcuts
					</h2>
					<div className="mt-5 flex flex-wrap gap-2">
						{tool.presets.map((p) => (
							<Link
								key={p.slug}
								to="/tools/$slug/$preset"
								params={{ slug: tool.slug, preset: p.slug }}
								className={cn(
									"label-mono border px-3.5 py-3 transition-colors",
									p.slug === preset?.slug
										? "border-foreground bg-primary text-primary-foreground"
										: "border-input text-foreground hover:border-foreground",
								)}
							>
								{p.title}
							</Link>
						))}
					</div>
				</section>
			)}

			<section aria-labelledby="faq" className="pt-20">
				<Kicker index={tool.presets?.length ? 4 : 3}>Questions</Kicker>
				<h2 id="faq" className="mt-4 mb-8 text-3xl tracking-[-0.035em]">
					Frequently asked questions
				</h2>
				<FaqList faqs={tool.faqs} />
			</section>

			{related.length > 0 && (
				<section aria-labelledby="related" className="pt-20">
					<Kicker>Keep going</Kicker>
					<h2 id="related" className="mt-4 text-3xl tracking-[-0.035em]">
						Related tools
					</h2>
					<div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
						{related.map((t) => (
							<ToolCard key={t.slug} tool={t} className="border-0" />
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
