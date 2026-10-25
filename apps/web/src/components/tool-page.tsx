import { categoryById, relatedTools, type ToolDef, type ToolPreset } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { cn } from "@qbtools/ui/utils";
import { ClientOnly } from "@tanstack/react-router";
import { ArrowRight, Star } from "lucide-react";
import { Component, type ReactNode, Suspense, useEffect } from "react";
import { categoryStyles, iconFor } from "#/lib/icons";
import { favoriteTools, markToolUsed, toggleFavorite } from "#/lib/local-store";
import { widgets } from "#/tools/widgets";
import { useAccount } from "./account-provider";
import { AdSlot } from "./ad-slot";
import { Breadcrumbs } from "./breadcrumbs";
import { Notice } from "./kit/notice";
import { Kicker } from "./page";
import { ToolCard } from "./tool-card";

function WidgetSkeleton() {
	return (
		<div className="flex min-h-80 flex-col gap-4 p-1" aria-hidden="true">
			<div className="h-56 animate-pulse rounded-lg bg-muted" />
			<div className="h-12 w-48 animate-pulse rounded-md bg-muted" />
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
	const { user } = useAccount();
	const favorites = favoriteTools.use();
	if (!user) return null;
	const active = favorites.includes(slug);
	return (
		<Button variant="outline" size="lg" onClick={() => toggleFavorite(slug)} aria-pressed={active}>
			<Star className={cn("size-4", active && "fill-current text-cat-amber-icon")} />
			{active ? "Saved to favorites" : "Save to favorites"}
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
			<header className="reveal mb-10 flex flex-col gap-6">
				<Breadcrumbs
					items={[
						{ name: "Home", href: "/" },
						{ name: category.name, href: `/categories/${category.id}` },
						...(preset
							? [{ name: tool.name, href: `/tools/${tool.slug}` }, { name: preset.title }]
							: [{ name: tool.name }]),
					]}
				/>

				<div className="flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
					{/* Identity ------------------------------------------------ */}
					<div className="flex min-w-0 items-start gap-4">
						<span
							aria-hidden
							className={cn(
								"mt-0.5 grid size-12 shrink-0 place-items-center rounded-xl border",
								categoryStyles[tool.category]?.tile,
							)}
						>
							{(() => {
								const Icon = iconFor(tool.icon);
								return <Icon className="size-5" strokeWidth={2} />;
							})()}
						</span>
						<div className="flex min-w-0 flex-col gap-1.5">
							<h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] leading-tight font-semibold tracking-[-0.03em]">
								{preset?.title ?? tool.name}
							</h1>
							<p className="max-w-xl leading-7 text-muted-foreground">
								{preset?.intro ?? tool.tagline}
							</p>
						</div>
					</div>

					{/* Actions + trust line ------------------------------------ */}
					<div className="flex shrink-0 flex-col gap-2.5 lg:items-end">
						<div className="flex flex-wrap items-center gap-2">
							<FavoriteButton slug={tool.slug} />
							<Button asChild size="lg">
								<a href="#tool">
									Open tool <ArrowRight />
								</a>
							</Button>
						</div>
					</div>
				</div>
			</header>

			<section
				id="tool"
				aria-label={`${tool.name} tool`}
				className="scroll-mt-20 rounded-lg border border-border bg-card p-4 sm:p-8"
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

			{related.length > 0 && (
				<section aria-labelledby="related" className="pt-20">
					<Kicker>Keep going</Kicker>
					<h2 id="related" className="mt-4 text-3xl tracking-[-0.035em]">
						Related tools
					</h2>
					<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
