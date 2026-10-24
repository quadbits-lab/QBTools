import { type CategoryId, categories, getTool, tools, toolsInCategory } from "@qbtools/registry";
import { Badge } from "@qbtools/ui/badge";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Segmented } from "@qbtools/ui/segmented";
import { cn } from "@qbtools/ui/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Compass,
	Globe,
	Heart,
	KeyRound,
	RotateCcw,
	Search,
	SearchX,
	ShieldCheck,
	X,
	Zap,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { CategoryCard } from "#/components/category-card";
import { FilterChip } from "#/components/filter-chip";
import { HeroHologram } from "#/components/hero-hologram";
import { SearchBox } from "#/components/search-box";
import { ToolTag } from "#/components/tool-flags";
import { ShelfToolCard, ShowcaseToolCard } from "#/components/tool-showcase-card";
import { categoryShortName, categoryStyles } from "#/lib/icons";
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
	"remove-background",
	"word-counter",
	"emi-calculator",
	"qr-code-generator",
];

/** Disciplines that actually have tools. */
const activeCategories = categories.filter((c) => toolsInCategory(c.id).length > 0);

const DIRECTORY_PREVIEW = 12;

const VALUE_PROPS = [
	{
		icon: ShieldCheck,
		label: "No server storage",
		tile: "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-icon",
	},
	{
		icon: Zap,
		label: "Instant execution",
		tile: "border-cat-amber-border bg-cat-amber-bg text-cat-amber-icon",
	},
	{
		icon: Heart,
		label: "Free forever",
		tile: "border-cat-sky-border bg-cat-sky-bg text-cat-sky-icon",
	},
];

const WHY = [
	{
		title: "Private by design",
		text: "Zero server storage and zero telemetry on your files.",
		icon: ShieldCheck,
		tile: "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-icon",
	},
	{
		title: "No signup required",
		text: "Open a tool and use it. An account is optional.",
		icon: KeyRound,
		tile: "border-cat-indigo-border bg-cat-indigo-bg text-cat-indigo-icon",
	},
	{
		title: "Blazing fast",
		text: "Runs on your device, so there is no upload wait.",
		icon: Zap,
		tile: "border-cat-amber-border bg-cat-amber-bg text-cat-amber-icon",
	},
	{
		title: "Works everywhere",
		text: "Any modern browser, on desktop or mobile.",
		icon: Globe,
		tile: "border-cat-sky-border bg-cat-sky-bg text-cat-sky-icon",
	},
];

const BROWSER_STEPS = [
	["Pick a file", "Your file stays on your device the whole time."],
	["Processed locally", "Your browser does the work — instant, with no waiting in a queue."],
	["Download the result", "Nothing is stored on QBTools servers."],
] as const;

const CLOUD_STEPS = [
	["Upload your file", "The document is sent to a remote server."],
	["Wait for processing", "Speed depends on the server and your connection."],
	["Download the result", "Check each provider’s retention policy for your file."],
] as const;

/** Mono kicker, heading and optional description. */
function SectionHead({
	index,
	kicker,
	title,
	id,
	description,
	action,
}: {
	index: number;
	kicker: string;
	title: string;
	id: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
				<p className="label-mono !text-subtle">
					[{String(index).padStart(2, "0")}] {kicker}
				</p>
				{action}
			</div>
			<h2 id={id} className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
				{title}
			</h2>
			{description && <p className="text-base text-muted-foreground sm:text-lg">{description}</p>}
		</div>
	);
}

/** Favorites and recent tools, shown only once there is something to show. */
function PersonalShelf() {
	const recent = recentTools.use();
	const favorites = favoriteTools.use();
	const [tab, setTab] = useState<"all" | "favorites" | "recent">("all");
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const allSlugs = [...new Set([...favorites, ...recent])];
	const slugs = tab === "favorites" ? favorites : tab === "recent" ? recent : allSlugs;
	const list = slugs.map(getTool).filter((t) => t !== undefined);
	if (!mounted || allSlugs.length === 0) return null;

	return (
		<section id="workspace" aria-labelledby="your-tools" className="container-page pt-12 sm:pt-16">
			<div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="label-mono !text-subtle">Your workspace</p>
						<h2 id="your-tools" className="mt-1 text-xl font-semibold tracking-[-0.02em]">
							Pinned &amp; recent tools
						</h2>
					</div>
					<div className="flex w-full items-center gap-2 sm:w-auto">
						<Segmented
							label="Show"
							value={tab}
							onChange={setTab}
							options={[
								{ value: "all", label: `All ${allSlugs.length}` },
								{ value: "favorites", label: `Saved ${favorites.length}` },
								{ value: "recent", label: `Recent ${recent.length}` },
							]}
							className="min-w-0 flex-1 sm:flex-none"
						/>
						{recent.length > 0 && (
							<Button
								variant="outline"
								size="icon-sm"
								onClick={() => recentTools.write([])}
								aria-label="Clear recent history"
								title="Clear recent history"
								className="shrink-0"
							>
								<RotateCcw />
							</Button>
						)}
					</div>
				</div>

				<div className="mt-4">
					{list.length === 0 ? (
						<p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
							{tab === "favorites"
								? "No saved tools yet. Star a tool to pin it here."
								: "No recent tools yet. Open a tool and it will appear here."}
						</p>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{list.slice(0, 6).map((tool) => (
								<ShelfToolCard key={tool.slug} tool={tool} />
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

type TagFilter = "all" | "popular" | "browser" | "ai";
type SortBy = "popular" | "name" | "category";

const TAG_OPTIONS: ReadonlyArray<{ value: TagFilter; label: string }> = [
	{ value: "all", label: "All" },
	{ value: "popular", label: "Popular" },
	{ value: "browser", label: "Private" },
	{ value: "ai", label: "AI" },
];

/** Directory: category and tag filters, live search, sort, and a card grid. */
function ToolsDirectory() {
	const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [tagFilter, setTagFilter] = useState<TagFilter>("all");
	const [sortBy, setSortBy] = useState<SortBy>("popular");
	const [expanded, setExpanded] = useState(false);

	const filteredTools = useMemo(() => {
		let list = [...tools];
		if (activeCategory !== "all") list = list.filter((t) => t.category === activeCategory);
		if (tagFilter === "popular") list = list.filter((t) => t.popular !== undefined);
		else if (tagFilter === "browser") list = list.filter((t) => t.runtime === "browser");
		else if (tagFilter === "ai") list = list.filter((t) => t.runtime === "server-ai");
		const q = searchQuery.toLowerCase().trim();
		if (q) {
			list = list.filter(
				(t) =>
					t.name.toLowerCase().includes(q) ||
					t.tagline.toLowerCase().includes(q) ||
					t.category.toLowerCase().includes(q) ||
					t.keywords.some((k) => k.toLowerCase().includes(q)),
			);
		}
		if (sortBy === "popular") list.sort((a, b) => (a.popular ?? 99) - (b.popular ?? 99));
		else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
		else list.sort((a, b) => a.category.localeCompare(b.category));
		return list;
	}, [activeCategory, tagFilter, searchQuery, sortBy]);

	const filtering = activeCategory !== "all" || tagFilter !== "all" || searchQuery.trim() !== "";
	const collapsed = !filtering && !expanded && filteredTools.length > DIRECTORY_PREVIEW;
	const visible = collapsed ? filteredTools.slice(0, DIRECTORY_PREVIEW) : filteredTools;
	const reset = () => {
		setActiveCategory("all");
		setSearchQuery("");
		setTagFilter("all");
	};

	return (
		<section
			id="tools-directory"
			aria-labelledby="tools-explorer"
			className="container-page pt-16 sm:pt-24"
		>
			<SectionHead
				index={1}
				kicker="Interactive tools directory"
				title="Find the right tool in seconds"
				id="tools-explorer"
				description={`${tools.length} tools across ${activeCategories.length} disciplines. Everything runs in your browser.`}
			/>

			<div className="mt-8 rounded-xl border border-border bg-card/40 p-4 sm:p-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="relative w-full lg:max-w-md">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							aria-label="Search tools"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search tools…"
							className="h-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								aria-label="Clear search"
								className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
							>
								<X className="size-3.5" />
							</button>
						)}
					</div>
					<select
						aria-label="Sort tools"
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as SortBy)}
						className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-auto"
					>
						<option value="popular">Sort: Popular</option>
						<option value="name">Sort: Name (A–Z)</option>
						<option value="category">Sort: Category</option>
					</select>
				</div>

				<div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-start">
						<span className="label-mono shrink-0 !text-subtle sm:mt-2 sm:w-24">Discipline</span>
						<div role="group" aria-label="Tool categories" className="flex flex-wrap gap-2">
							<FilterChip
								label="All"
								count={tools.length}
								active={activeCategory === "all"}
								onClick={() => setActiveCategory("all")}
								className="h-9 shrink-0"
							/>
							{activeCategories.map((c) => (
								<FilterChip
									key={c.id}
									label={categoryShortName(c.name)}
									count={toolsInCategory(c.id).length}
									category={c.id}
									active={activeCategory === c.id}
									onClick={() => setActiveCategory(c.id)}
									className="h-9 shrink-0"
								/>
							))}
						</div>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<span className="label-mono shrink-0 !text-subtle sm:w-24">Show</span>
						<Segmented
							label="Filter tools by type"
							value={tagFilter}
							onChange={setTagFilter}
							options={TAG_OPTIONS}
							className="w-full sm:w-auto"
						/>
					</div>
				</div>
			</div>

			<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
				<p className="text-sm text-muted-foreground" aria-live="polite">
					Showing <span className="font-medium text-foreground">{visible.length}</span> of{" "}
					{tools.length} tools
				</p>
				{filtering && filteredTools.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={reset}
						className="h-8 px-2 text-muted-foreground hover:text-foreground"
					>
						<RotateCcw /> Reset filters
					</Button>
				)}
			</div>

			{filteredTools.length === 0 ? (
				<div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border bg-card/40 p-10 text-center sm:p-12">
					<span className="grid size-11 place-items-center rounded-full border border-border bg-background text-muted-foreground">
						<SearchX className="size-5" aria-hidden="true" />
					</span>
					<p className="mt-4 text-lg font-semibold">No matching tools</p>
					<p className="mt-1 max-w-sm text-sm text-muted-foreground">
						Try a different search, discipline, or filter.
					</p>
					<Button variant="outline" size="sm" className="mt-4" onClick={reset}>
						Clear filters
					</Button>
				</div>
			) : (
				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{visible.map((tool) => (
						<ShowcaseToolCard key={tool.slug} tool={tool} />
					))}
				</div>
			)}

			{collapsed && (
				<div className="mt-8 flex justify-center">
					<Button variant="outline" size="lg" arrow onClick={() => setExpanded(true)}>
						Show all {tools.length} tools
					</Button>
				</div>
			)}
		</section>
	);
}

function CompareCard({
	tone,
	title,
	badge,
	steps,
}: {
	tone: "emerald" | "rose";
	title: string;
	badge: ReactNode;
	steps: ReadonlyArray<readonly [string, string]>;
}) {
	const number =
		tone === "emerald"
			? "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-fg"
			: "border-cat-rose-border bg-cat-rose-bg text-cat-rose-fg";
	return (
		<div
			className={cn(
				"flex flex-col gap-5 rounded-lg border bg-card p-6",
				tone === "emerald" ? "border-cat-emerald-border" : "border-cat-rose-border",
			)}
		>
			<div className="flex flex-wrap items-center gap-3">
				<h3 className="text-2xl font-semibold tracking-[-0.025em]">{title}</h3>
				{badge}
			</div>
			<ol className="flex flex-col gap-4">
				{steps.map(([step, text], i) => (
					<li key={step} className="flex gap-3">
						<span
							className={cn(
								"grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs",
								number,
							)}
						>
							{i + 1}
						</span>
						<span className="flex flex-col">
							<span className="text-sm font-medium">{step}</span>
							<span className="text-sm text-muted-foreground">{text}</span>
						</span>
					</li>
				))}
			</ol>
		</div>
	);
}

function HomePage() {
	return (
		<>
			{/* Hero */}
			<section className="relative isolate">
				<HeroHologram />
				<div className="container-page relative z-10 flex flex-col items-center gap-6 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
					<div className="reveal inline-flex items-center gap-2 rounded-full border border-cat-emerald-border bg-cat-emerald-bg px-3 py-1.5 text-xs text-cat-emerald-fg">
						<span className="size-2 animate-beacon rounded-full bg-cat-emerald-icon" />
						<span>{tools.length} free browser tools · 100% client-side · zero telemetry</span>
					</div>

					<h1 className="display reveal max-w-4xl text-[clamp(2.5rem,7vw,4rem)] [animation-delay:80ms]">
						Free tools that just work.
					</h1>

					<p className="reveal max-w-[720px] text-lg leading-7 text-muted-foreground [animation-delay:140ms]">
						Compress photos, merge PDFs, generate QR codes, count words and calculate EMI — all
						processed locally in your browser. No uploads, no signup.
					</p>

					<ul className="reveal flex flex-wrap items-center justify-center gap-x-8 gap-y-3 [animation-delay:200ms]">
						{VALUE_PROPS.map(({ icon: Icon, label, tile }) => (
							<li key={label} className="flex items-center gap-2 text-sm font-medium">
								<span className={cn("grid size-7 place-items-center rounded-md border", tile)}>
									<Icon className="size-3.5" aria-hidden="true" />
								</span>
								{label}
							</li>
						))}
					</ul>

					<div className="reveal w-full max-w-[640px] [animation-delay:260ms]">
						<SearchBox
							size="lg"
							placeholder={`Search ${tools.length} tools — try “compress image” or “merge pdf”`}
						/>
					</div>

					<div className="reveal flex flex-wrap items-center justify-center gap-2 [animation-delay:320ms]">
						<span className="pr-1 font-mono text-[0.625rem] font-medium uppercase tracking-[0.1em] text-subtle">
							Popular
						</span>
						{QUICK.map(getTool)
							.filter((t) => t !== undefined)
							.map((tool) => (
								<Link
									key={tool.slug}
									to="/tools/$slug"
									params={{ slug: tool.slug }}
									className="inline-flex h-8 items-center gap-1.5 rounded-full border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
								>
									<span
										aria-hidden="true"
										className={cn("size-2 rounded-full", categoryStyles[tool.category].dot)}
									/>
									{tool.name}
								</Link>
							))}
					</div>
				</div>
			</section>

			<PersonalShelf />

			<ToolsDirectory />

			{/* Categories */}
			<section
				id="categories"
				aria-labelledby="categories-title"
				className="mt-16 scroll-mt-16 border-y border-border bg-muted/40 py-16 sm:mt-24 sm:py-24"
			>
				<div className="container-page">
					<SectionHead
						index={2}
						kicker="Browse by discipline"
						title={`${activeCategories.length} disciplines, one toolbox`}
						id="categories-title"
						description="Jump straight to a category and see what is inside."
						action={
							<Button asChild variant="outline" size="sm" className="w-fit shrink-0">
								<Link to="/tools">
									All {tools.length} tools <ArrowRight />
								</Link>
							</Button>
						}
					/>

					<ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{activeCategories.map((category, index) => (
							<li key={category.id}>
								<CategoryCard
									category={category}
									count={toolsInCategory(category.id).length}
									index={index + 1}
								/>
							</li>
						))}
					</ul>

					<div className="mt-4 flex flex-col gap-6 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
						<div className="flex items-start gap-4">
							<span className="grid size-11 shrink-0 place-items-center rounded-lg border border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-icon">
								<Compass className="size-5" aria-hidden="true" />
							</span>
							<div className="flex flex-col gap-1">
								<h3 className="text-xl font-semibold tracking-[-0.025em]">
									Not sure where to start?
								</h3>
								<p className="text-sm leading-5 text-muted-foreground">
									Search all {tools.length} tools or browse the full directory.
								</p>
							</div>
						</div>
						<Button asChild className="w-full sm:w-auto">
							<Link to="/tools">
								Browse all tools <ArrowRight />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Why QBTools */}
			<section aria-labelledby="why" className="container-page py-16 sm:py-24">
				<SectionHead
					index={3}
					kicker="Privacy by architecture"
					title={`Why people choose ${SITE_NAME}`}
					id="why"
					description="Your files are processed on your device — not on someone else’s server."
				/>

				<div className="mt-8 grid gap-6 lg:grid-cols-2">
					<CompareCard
						tone="emerald"
						title="QBTools in-browser engine"
						badge={<ToolTag type="private" />}
						steps={BROWSER_STEPS}
					/>
					<CompareCard
						tone="rose"
						title="Typical cloud converters"
						badge={<Badge tone="critical">Uploads your file</Badge>}
						steps={CLOUD_STEPS}
					/>
				</div>

				<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{WHY.map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.title}
								className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
							>
								<span
									className={cn("grid size-10 place-items-center rounded-md border", item.tile)}
								>
									<Icon className="size-5" aria-hidden="true" />
								</span>
								<h3 className="text-xl font-semibold tracking-[-0.025em]">{item.title}</h3>
								<p className="text-sm text-muted-foreground">{item.text}</p>
							</div>
						);
					})}
				</div>
			</section>
		</>
	);
}
