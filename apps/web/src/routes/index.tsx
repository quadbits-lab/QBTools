import { latestGuides } from "@qbtools/content";
import {
	type CategoryId,
	categories,
	getTool,
	popularTools,
	tools,
	toolsInCategory,
} from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { cn } from "@qbtools/ui/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CheckCircle2,
	Cpu,
	Grid,
	List,
	RotateCcw,
	Search,
	ShieldCheck,
	Sparkles,
	Star,
	XCircle,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Kicker } from "#/components/page";
import { SearchBox } from "#/components/search-box";
import { CategoryCard, ToolCard } from "#/components/tool-card";
import { categoryStyles, iconFor } from "#/lib/icons";
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
	"remove-background",
];

const WHY = [
	{
		title: "Private by Design",
		text: "Files are processed entirely in your browser using WebAssembly. Nothing is ever sent to or stored on a server.",
		icon: ShieldCheck,
	},
	{
		title: "No Signup Required",
		text: "No account, no email address, no paywalls. Open any tool and finish your task immediately.",
		icon: Zap,
	},
	{
		title: "Blazing Fast Execution",
		text: "Zero upload or download delay. Calculations and conversions happen instantly directly on your device CPU/GPU.",
		icon: Cpu,
	},
	{
		title: "Works Everywhere & Offline",
		text: "Fully responsive on mobile and desktop. Once loaded, client-side tools continue to work without internet.",
		icon: CheckCircle2,
	},
];

const SERVICES = [
	{
		title: "Custom tools & calculators",
		text: "Bespoke converters, engines, and interactive calculators built for your business.",
	},
	{
		title: "Design & web development",
		text: "Blazing-fast responsive websites and web applications built with modern web standards.",
	},
	{
		title: "Technical SEO & performance",
		text: "Optimized architectures engineered to achieve 100 Core Web Vitals and rank on Google.",
	},
];

/** Section heading row with kicker, title and optional link */
function SectionHead({
	index,
	kicker,
	title,
	id,
	link,
	description,
}: {
	index: number;
	kicker: string;
	title: string;
	id: string;
	link?: { to: string; label: string };
	description?: string;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-6">
			<div>
				<Kicker index={index}>{kicker}</Kicker>
				<h2 id={id} className="mt-3 text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
					{title}
				</h2>
				{description && (
					<p className="mt-2 text-base text-muted-foreground sm:text-lg">{description}</p>
				)}
			</div>
			{link && (
				<Link
					to={link.to}
					className="label-mono flex items-center gap-1.5 border-b border-input pb-1 text-foreground transition-all hover:border-foreground hover:gap-2.5"
				>
					{link.label} →
				</Link>
			)}
		</div>
	);
}

/** Interactive Personal Shelf: Favorites & Recents */
function PersonalShelf() {
	const recent = recentTools.use();
	const favorites = favoriteTools.use();
	const [tab, setTab] = useState<"all" | "favorites" | "recent">("all");
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted) return null;

	const allSlugs = [...new Set([...favorites, ...recent])];
	const filteredSlugs = tab === "favorites" ? favorites : tab === "recent" ? recent : allSlugs;
	const activeList = filteredSlugs.map(getTool).filter((t) => t !== undefined);

	// Onboarding state when user hasn't starred or used tools yet
	if (activeList.length === 0) {
		const starters = ["compress-image", "merge-pdf", "word-counter", "qr-code-generator"]
			.map(getTool)
			.filter((t) => t !== undefined);

		return (
			<section aria-labelledby="your-tools" className="container-page pt-12 sm:pt-16">
				<div className="glass-card relative overflow-hidden border border-border/80 p-6 sm:p-8">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<span className="grid size-9 place-items-center border border-amber-500/30 bg-amber-500/10 text-amber-400">
								<Star className="size-4 fill-current" />
							</span>
							<div>
								<h3 className="text-lg font-medium tracking-tight">Your Personal Workspace</h3>
								<p className="text-sm text-muted-foreground">
									Click the ★ icon on any tool to pin it here for instant 1-click access.
								</p>
							</div>
						</div>
						<span className="label-mono text-subtle hidden sm:inline-block">
							[ Instant Local Storage ]
						</span>
					</div>

					<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{starters.map((tool) => (
							<ToolCard key={tool.slug} tool={tool} />
						))}
					</div>
				</div>
			</section>
		);
	}

	return (
		<section aria-labelledby="your-tools" className="container-page pt-12 sm:pt-16">
			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
				<div className="flex items-center gap-3">
					<span className="grid size-9 place-items-center border border-amber-500/30 bg-amber-500/10 text-amber-400">
						<Star className="size-4 fill-current" />
					</span>
					<div>
						<Kicker>Your Workspace</Kicker>
						<h2 id="your-tools" className="text-xl font-medium tracking-tight">
							Pinned & Recent Tools
						</h2>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex border border-border bg-surface p-0.5 text-xs">
						<button
							type="button"
							onClick={() => setTab("all")}
							className={cn(
								"cursor-pointer px-3 py-1 font-mono uppercase tracking-wider transition-colors",
								tab === "all"
									? "bg-primary text-primary-foreground font-medium"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							All ({allSlugs.length})
						</button>
						<button
							type="button"
							onClick={() => setTab("favorites")}
							className={cn(
								"cursor-pointer px-3 py-1 font-mono uppercase tracking-wider transition-colors",
								tab === "favorites"
									? "bg-primary text-primary-foreground font-medium"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							★ Saved ({favorites.length})
						</button>
						<button
							type="button"
							onClick={() => setTab("recent")}
							className={cn(
								"cursor-pointer px-3 py-1 font-mono uppercase tracking-wider transition-colors",
								tab === "recent"
									? "bg-primary text-primary-foreground font-medium"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							Recent ({recent.length})
						</button>
					</div>

					{recent.length > 0 && (
						<button
							type="button"
							onClick={() => recentTools.write([])}
							title="Clear recent history"
							className="grid size-8 place-items-center border border-border text-subtle transition-colors hover:border-foreground hover:text-foreground cursor-pointer"
						>
							<RotateCcw className="size-3.5" />
						</button>
					)}
				</div>
			</div>

			<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{activeList.slice(0, 8).map((tool) => (
					<ToolCard key={tool.slug} tool={tool} />
				))}
			</div>
		</section>
	);
}

/** Interactive Tools Explorer: Instant live filter, category switcher, tag filter, and view mode */
function InteractiveToolsExplorer() {
	const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [tagFilter, setTagFilter] = useState<"all" | "popular" | "browser" | "ai">("all");
	const [sortBy, setSortBy] = useState<"popular" | "name" | "category">("popular");
	const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

	const filteredTools = useMemo(() => {
		let list = [...tools];

		// Category filter
		if (activeCategory !== "all") {
			list = list.filter((t) => t.category === activeCategory);
		}

		// Tag filter
		if (tagFilter === "popular") {
			list = list.filter((t) => t.popular !== undefined);
		} else if (tagFilter === "browser") {
			list = list.filter((t) => t.runtime === "browser");
		} else if (tagFilter === "ai") {
			list = list.filter((t) => t.runtime === "server-ai");
		}

		// Search filter
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter(
				(t) =>
					t.name.toLowerCase().includes(q) ||
					t.tagline.toLowerCase().includes(q) ||
					t.category.toLowerCase().includes(q) ||
					t.keywords.some((k) => k.toLowerCase().includes(q)),
			);
		}

		// Sort
		if (sortBy === "popular") {
			list.sort((a, b) => (a.popular ?? 99) - (b.popular ?? 99));
		} else if (sortBy === "name") {
			list.sort((a, b) => a.name.localeCompare(b.name));
		} else if (sortBy === "category") {
			list.sort((a, b) => a.category.localeCompare(b.category));
		}

		return list;
	}, [activeCategory, tagFilter, searchQuery, sortBy]);

	return (
		<section aria-labelledby="tools-explorer" className="container-page pt-24 sm:pt-32">
			<SectionHead
				index={1}
				kicker="Explore & Filter"
				title="Interactive Tools Directory"
				id="tools-explorer"
				description="Search, filter by discipline, and explore all utilities with real-time in-browser results."
				link={{ to: "/tools", label: "Full directory view" }}
			/>

			{/* Interactive Category Tabs */}
			<div
				className="mt-8 flex flex-wrap gap-2 border-b border-border/80 pb-4"
				role="tablist"
				aria-label="Tool Categories"
			>
				<button
					type="button"
					role="tab"
					aria-selected={activeCategory === "all"}
					onClick={() => setActiveCategory("all")}
					className={cn(
						"flex cursor-pointer items-center gap-2 border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-150",
						activeCategory === "all"
							? "border-foreground bg-primary text-primary-foreground font-semibold shadow-sm"
							: "border-border/80 bg-surface/70 text-muted-foreground hover:border-input hover:text-foreground",
					)}
				>
					<span>All tools</span>
					<span
						className={cn(
							"px-1.5 py-0.5 text-[0.625rem]",
							activeCategory === "all"
								? "bg-primary-foreground/20 text-primary-foreground"
								: "bg-muted text-subtle",
						)}
					>
						{tools.length}
					</span>
				</button>

				{categories.map((c) => {
					const Icon = iconFor(c.icon);
					const count = toolsInCategory(c.id).length;
					const isSelected = activeCategory === c.id;
					const style = categoryStyles[c.id];

					return (
						<button
							key={c.id}
							type="button"
							role="tab"
							aria-selected={isSelected}
							onClick={() => setActiveCategory(c.id)}
							className={cn(
								"flex cursor-pointer items-center gap-2 border px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-150",
								isSelected
									? "border-foreground bg-primary text-primary-foreground font-semibold shadow-sm"
									: "border-border/80 bg-surface/70 text-muted-foreground hover:border-input hover:text-foreground",
							)}
						>
							<Icon className="size-3.5" />
							<span>{c.name.replace(" tools", "")}</span>
							<span
								className={cn(
									"px-1.5 py-0.5 text-[0.625rem]",
									isSelected
										? "bg-primary-foreground/20 text-primary-foreground"
										: style
											? style.badge
											: "bg-muted text-subtle",
								)}
							>
								{count}
							</span>
						</button>
					);
				})}
			</div>

			{/* Filter & Search Toolbar */}
			<div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-surface/60 p-3 border border-border/80">
				{/* In-page live search input */}
				<div className="relative min-w-[240px] flex-1 sm:max-w-md">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
					<input
						type="search"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by name, format (jpg, pdf), or task..."
						className="h-10 w-full border border-input bg-background/80 pr-8 pl-9 text-sm outline-none transition-colors placeholder:text-subtle focus:border-foreground"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-subtle hover:text-foreground cursor-pointer"
						>
							✕
						</button>
					)}
				</div>

				{/* Quick Tag Filters */}
				<div className="flex flex-wrap items-center gap-1.5">
					<button
						type="button"
						onClick={() => setTagFilter("all")}
						className={cn(
							"cursor-pointer border px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wider transition-colors",
							tagFilter === "all"
								? "border-foreground bg-foreground text-background font-medium"
								: "border-border bg-surface text-muted-foreground hover:text-foreground",
						)}
					>
						All tags
					</button>
					<button
						type="button"
						onClick={() => setTagFilter("popular")}
						className={cn(
							"flex cursor-pointer items-center gap-1 border px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wider transition-colors",
							tagFilter === "popular"
								? "border-amber-400 bg-amber-400 text-black font-medium"
								: "border-border bg-surface text-muted-foreground hover:text-foreground",
						)}
					>
						<Star className="size-3 fill-current" /> Popular
					</button>
					<button
						type="button"
						onClick={() => setTagFilter("browser")}
						className={cn(
							"flex cursor-pointer items-center gap-1 border px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wider transition-colors",
							tagFilter === "browser"
								? "border-emerald-400 bg-emerald-400 text-black font-medium"
								: "border-border bg-surface text-muted-foreground hover:text-foreground",
						)}
					>
						<ShieldCheck className="size-3" /> 100% Private
					</button>
					<button
						type="button"
						onClick={() => setTagFilter("ai")}
						className={cn(
							"flex cursor-pointer items-center gap-1 border px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wider transition-colors",
							tagFilter === "ai"
								? "border-violet-400 bg-violet-400 text-black font-medium"
								: "border-border bg-surface text-muted-foreground hover:text-foreground",
						)}
					>
						<Sparkles className="size-3" /> AI
					</button>
				</div>

				{/* Sort & View Mode Switcher */}
				<div className="flex items-center gap-2">
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as "popular" | "name" | "category")}
						className="h-9 cursor-pointer border border-input bg-background px-2.5 font-mono text-xs text-foreground outline-none focus:border-foreground"
					>
						<option value="popular">Sort: Popular</option>
						<option value="name">Sort: Name (A-Z)</option>
						<option value="category">Sort: Category</option>
					</select>

					<div className="flex border border-input bg-background p-0.5">
						<button
							type="button"
							onClick={() => setViewMode("grid")}
							aria-label="Grid card view"
							className={cn(
								"grid size-8 place-items-center transition-colors cursor-pointer",
								viewMode === "grid"
									? "bg-muted text-foreground"
									: "text-subtle hover:text-foreground",
							)}
						>
							<Grid className="size-4" />
						</button>
						<button
							type="button"
							onClick={() => setViewMode("compact")}
							aria-label="Compact list view"
							className={cn(
								"grid size-8 place-items-center transition-colors cursor-pointer",
								viewMode === "compact"
									? "bg-muted text-foreground"
									: "text-subtle hover:text-foreground",
							)}
						>
							<List className="size-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Status count indicator */}
			<div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
				<span>
					Showing <strong className="text-foreground">{filteredTools.length}</strong> of{" "}
					{tools.length} tools
					{activeCategory !== "all" &&
						` in ${categories.find((c) => c.id === activeCategory)?.name}`}
					{searchQuery && ` matching "${searchQuery}"`}
				</span>
				{(searchQuery || tagFilter !== "all" || activeCategory !== "all") && (
					<button
						type="button"
						onClick={() => {
							setActiveCategory("all");
							setSearchQuery("");
							setTagFilter("all");
						}}
						className="label-mono cursor-pointer text-foreground underline hover:no-underline"
					>
						Reset filters
					</button>
				)}
			</div>

			{/* Interactive Tools Grid */}
			{filteredTools.length === 0 ? (
				<div className="mt-8 flex flex-col items-center justify-center border border-dashed border-border p-12 text-center">
					<p className="text-lg font-medium text-foreground">No matching tools found</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Try clearing your search query or switching to another category.
					</p>
					<div className="mt-4 flex gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setActiveCategory("all");
								setSearchQuery("");
								setTagFilter("all");
							}}
						>
							Clear filters
						</Button>
						<Button asChild size="sm">
							<Link to="/contact" search={{ tab: "suggest" }}>
								Suggest this tool
							</Link>
						</Button>
					</div>
				</div>
			) : viewMode === "compact" ? (
				<div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{filteredTools.map((tool) => (
						<ToolCard key={tool.slug} tool={tool} variant="compact" />
					))}
				</div>
			) : (
				<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{filteredTools.map((tool, i) => (
						<ToolCard key={tool.slug} tool={tool} index={i + 1} />
					))}
				</div>
			)}
		</section>
	);
}

/** Interactive Architecture & Privacy Comparison Component */
function ArchitectureComparison() {
	const [activeEngine, setActiveEngine] = useState<"qbtools" | "cloud">("qbtools");

	return (
		<div className="mt-10 overflow-hidden border border-border bg-surface">
			<div className="flex border-b border-border bg-surface-2 p-1.5">
				<button
					type="button"
					onClick={() => setActiveEngine("qbtools")}
					className={cn(
						"flex-1 cursor-pointer py-2.5 px-4 font-mono text-xs uppercase tracking-wider transition-all",
						activeEngine === "qbtools"
							? "bg-foreground text-background font-semibold"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					✓ QBTools In-Browser Engine (Private)
				</button>
				<button
					type="button"
					onClick={() => setActiveEngine("cloud")}
					className={cn(
						"flex-1 cursor-pointer py-2.5 px-4 font-mono text-xs uppercase tracking-wider transition-all",
						activeEngine === "cloud"
							? "bg-destructive text-destructive-foreground font-semibold"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					✕ Traditional Cloud Converters
				</button>
			</div>

			<div className="p-6 sm:p-8">
				{activeEngine === "qbtools" ? (
					<div className="grid gap-6 lg:grid-cols-3">
						<div className="flex flex-col gap-2 border-l-2 border-emerald-500 pl-4">
							<span className="label-mono text-emerald-400">Step 1 · In-Memory Read</span>
							<h4 className="text-base font-medium">Your Local Device</h4>
							<p className="text-sm text-muted-foreground">
								You select an image or PDF. It loads directly into browser memory (RAM) as an
								ArrayBuffer.
							</p>
						</div>
						<div className="flex flex-col gap-2 border-l-2 border-emerald-500 pl-4">
							<span className="label-mono text-emerald-400">Step 2 · Wasm / Canvas Processing</span>
							<h4 className="text-base font-medium">Hardware Acceleration</h4>
							<p className="text-sm text-muted-foreground">
								Your device CPU/GPU compresses, edits, or converts the file locally. 0 bytes are
								transmitted across the internet.
							</p>
						</div>
						<div className="flex flex-col gap-2 border-l-2 border-emerald-500 pl-4">
							<span className="label-mono text-emerald-400">Step 3 · Instant Local Save</span>
							<h4 className="text-base font-medium">100% Private Result</h4>
							<p className="text-sm text-muted-foreground">
								A native blob URL triggers an immediate browser download. No traces, zero cloud
								storage, absolute privacy.
							</p>
						</div>
					</div>
				) : (
					<div className="grid gap-6 lg:grid-cols-3">
						<div className="flex flex-col gap-2 border-l-2 border-rose-500 pl-4">
							<span className="label-mono text-rose-400">Step 1 · Cloud Upload</span>
							<h4 className="text-base font-medium">Public Internet Transfer</h4>
							<p className="text-sm text-muted-foreground">
								Your sensitive document or photo is uploaded over the network to an unknown remote
								server.
							</p>
						</div>
						<div className="flex flex-col gap-2 border-l-2 border-rose-500 pl-4">
							<span className="label-mono text-rose-400">Step 2 · Remote Storage & Queue</span>
							<h4 className="text-base font-medium">Server File System</h4>
							<p className="text-sm text-muted-foreground">
								The file waits in a server queue, written to remote disks, subject to data retention
								policies and potential leaks.
							</p>
						</div>
						<div className="flex flex-col gap-2 border-l-2 border-rose-500 pl-4">
							<span className="label-mono text-rose-400">Step 3 · Slow Download</span>
							<h4 className="text-base font-medium">Bandwidth Dependent</h4>
							<p className="text-sm text-muted-foreground">
								You must wait for the remote server to process and stream the file back to you,
								often blocked by paywalls or captchas.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function HomePage() {
	const guides = latestGuides(3);

	return (
		<>
			{/* 1. Hero Section with Modern Visual Guidance Patterns */}
			<section className="relative border-b border-border overflow-hidden">
				<div className="hero-ambient-glow" />
				<div className="pattern-grid absolute inset-0 opacity-40 pointer-events-none" />

				<div className="container-page relative flex min-h-[min(76vh,44rem)] flex-col justify-end gap-8 pt-16 pb-14 sm:pb-20">
					{/* Live status badge */}
					<div className="reveal flex flex-wrap items-center justify-between gap-4">
						<div className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 font-mono">
							<span className="size-2 rounded-full bg-emerald-400 animate-beacon" />
							<span>{tools.length} Free Browser Tools · 100% Client-Side · Zero Telemetry</span>
						</div>
						<span className="label-mono text-subtle hidden sm:inline-block">
							[ Instant Local Execution · No Signup ]
						</span>
					</div>

					{/* Display headline */}
					<h1 className="display reveal max-w-5xl text-[clamp(2.75rem,8vw,7rem)] [animation-delay:100ms]">
						Free tools that just work.
					</h1>

					{/* Search, intro and quick tags */}
					<div className="reveal grid gap-8 [animation-delay:200ms] lg:grid-cols-[1fr_1.15fr] lg:items-end">
						<div className="flex flex-col gap-4">
							<p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
								Compress photos, merge PDFs, generate QR codes, count words, and calculate EMI —
								processed 100% locally in your browser with zero server uploads and total privacy.
							</p>
							{/* Quick trust metrics */}
							<div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-subtle">
								<span className="flex items-center gap-1.5">
									<ShieldCheck className="size-4 text-emerald-400" /> No server storage
								</span>
								<span className="flex items-center gap-1.5">
									<Zap className="size-4 text-amber-400" /> Instant execution
								</span>
								<span className="flex items-center gap-1.5">
									<CheckCircle2 className="size-4 text-sky-400" /> Free forever
								</span>
							</div>
						</div>

						<div className="flex flex-col gap-4">
							<SearchBox size="lg" />
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-mono text-xs uppercase text-subtle pr-1">Popular:</span>
								{QUICK.map(getTool)
									.filter((t) => t !== undefined)
									.map((tool) => (
										<Link
											key={tool.slug}
											to="/tools/$slug"
											params={{ slug: tool.slug }}
											className="label-mono border border-input bg-surface/80 px-2.5 py-1.5 text-foreground transition-all duration-150 hover:border-foreground hover:bg-surface-2"
										>
											{tool.name}
										</Link>
									))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* 2. Personal Workspace Shelf */}
			<PersonalShelf />

			{/* 3. Interactive Tools Explorer (Dynamic Filtering, Search & Grid) */}
			<InteractiveToolsExplorer />

			{/* 4. Disciplines & Categories */}
			<section aria-labelledby="categories" className="container-page pt-24 sm:pt-32">
				<SectionHead
					index={2}
					kicker="Six Disciplines"
					title="Browse by category"
					id="categories"
					description="Explore specialized tools organized across media, document, text, and financial disciplines."
				/>
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

			{/* 5. Privacy & Architecture Showcase */}
			<section aria-labelledby="why" className="container-page pt-24 sm:pt-32">
				<SectionHead
					index={3}
					kicker="Privacy Architecture"
					title={`Why people choose ${SITE_NAME}`}
					id="why"
					description="See how our local in-browser architecture guarantees your privacy and eliminates latency."
				/>

				<ArchitectureComparison />

				<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{WHY.map((item, i) => {
						const Icon = item.icon;
						return (
							<div
								key={item.title}
								className="interactive-card flex flex-col gap-3 border border-border/80 bg-surface/70 p-6 backdrop-blur-sm"
							>
								<div className="flex items-center justify-between">
									<span className="grid size-10 place-items-center border border-border bg-background text-foreground">
										<Icon className="size-5" />
									</span>
									<span className="label-mono text-subtle">0{i + 1}</span>
								</div>
								<h3 className="mt-2 text-xl font-medium tracking-tight">{item.title}</h3>
								<p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
							</div>
						);
					})}
				</div>
			</section>

			{/* 6. Services Studio Teaser */}
			<section aria-labelledby="services" className="container-page pt-24 sm:pt-32">
				<div className="interactive-card relative overflow-hidden border border-primary bg-primary p-8 text-primary-foreground sm:p-14 lg:grid lg:grid-cols-[1.1fr_1.3fr] lg:items-end lg:gap-14">
					<div>
						<p className="label-mono text-primary-foreground/75">[04] · QBTools Studio</p>
						<h2 id="services" className="display mt-4 text-3xl sm:text-5xl">
							Need custom software built just for you?
						</h2>
						<p className="mt-4 max-w-md text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
							The engineering team behind QBTools designs and builds custom calculators, web tools,
							and high-performance websites for businesses worldwide.
						</p>
						<Button
							asChild
							size="lg"
							arrow
							className="mt-8 border-primary-foreground bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium"
						>
							<Link to="/services">Get a free quote</Link>
						</Button>
					</div>

					<div className="mt-8 grid gap-4 border-t border-primary-foreground/20 pt-8 sm:grid-cols-3 lg:mt-0 lg:border-t-0 lg:pt-0">
						{SERVICES.map((item, i) => (
							<div
								key={item.title}
								className="flex flex-col gap-2 border-t border-primary-foreground/25 pt-4"
							>
								<span className="label-mono text-primary-foreground/60">0{i + 1}</span>
								<h3 className="text-base font-medium tracking-tight">{item.title}</h3>
								<p className="text-xs leading-relaxed text-primary-foreground/75">{item.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* 7. Practical Guides & Tutorials */}
			<section aria-labelledby="guides" className="container-page pt-24 sm:pt-32 pb-20">
				<SectionHead
					index={5}
					kicker="Engineering Guides"
					title="Latest articles & tutorials"
					id="guides"
					description="Practical step-by-step guides for image optimization, PDF editing, and productivity workflows."
					link={{ to: "/guides", label: "View all guides" }}
				/>
				<div className="mt-8 grid gap-4 md:grid-cols-3">
					{guides.map((guide) => (
						<Link
							key={guide.slug}
							to="/guides/$slug"
							params={{ slug: guide.slug }}
							className="interactive-card group flex flex-col justify-between border border-border/80 bg-surface/80 p-6 backdrop-blur-sm hover:border-input hover:bg-surface-2 sm:p-7"
						>
							<div className="flex flex-col gap-3">
								<span className="label-mono text-subtle">{guide.readMinutes} min read</span>
								<h3 className="text-xl leading-snug font-medium tracking-tight group-hover:text-primary transition-colors">
									{guide.title}
								</h3>
								<p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
									{guide.description}
								</p>
							</div>
							<span className="mt-6 flex items-center gap-2 label-mono text-foreground pt-3 border-t border-border/60">
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
