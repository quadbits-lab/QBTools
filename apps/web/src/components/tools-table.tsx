import { type CategoryId, categoryById, isCategoryId, tools } from "@qbtools/registry";
import { Badge } from "@qbtools/ui/badge";
import { Button } from "@qbtools/ui/button";
import { Input, Select } from "@qbtools/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@qbtools/ui/table";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { categoryShortName } from "#/lib/icons";
import { ToolIcon } from "./tool-card";
import { CategoryBadge, isPrivateTool, isTopTool, ToolTag } from "./tool-flags";

const PAGE_SIZE = 10;

type Runtime = "all" | "browser" | "server-ai";
type Sort = "name" | "popular" | "category";

/** Page numbers with ellipses: 1 … 4 5 6 … 12. `null` renders an ellipsis. */
function pageItems(current: number, count: number): Array<number | null> {
	if (count <= 7) return Array.from({ length: count }, (_, i) => i);
	const set = new Set([0, count - 1, current - 1, current, current + 1]);
	const pages = [...set].filter((p) => p >= 0 && p < count).sort((a, b) => a - b);
	const out: Array<number | null> = [];
	for (const [i, p] of pages.entries()) {
		if (i > 0 && p - (pages[i - 1] ?? 0) > 1) out.push(null);
		out.push(p);
	}
	return out;
}

/** Data table of every tool: search, category and runtime filters, sort, pagination. */
export function ToolsTable() {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<CategoryId | "all">("all");
	const [runtime, setRuntime] = useState<Runtime>("all");
	const [sort, setSort] = useState<Sort>("name");
	const [page, setPage] = useState(0);

	const rows = useMemo(() => {
		const q = query.toLowerCase().trim();
		const list = tools.filter(
			(t) =>
				(category === "all" || t.category === category) &&
				(runtime === "all" || t.runtime === runtime) &&
				(!q ||
					t.name.toLowerCase().includes(q) ||
					t.tagline.toLowerCase().includes(q) ||
					t.keywords.some((k) => k.toLowerCase().includes(q))),
		);
		if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
		else if (sort === "popular") list.sort((a, b) => (a.popular ?? 99) - (b.popular ?? 99));
		else list.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
		return list;
	}, [query, category, runtime, sort]);

	const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
	const current = Math.min(page, pageCount - 1);
	const start = current * PAGE_SIZE;
	const visible = rows.slice(start, start + PAGE_SIZE);
	const categoriesWithTools = [...new Set(tools.map((t) => t.category))];

	const onFilter =
		<T,>(set: (value: T) => void) =>
		(value: T) => {
			set(value);
			setPage(0);
		};

	return (
		<section
			aria-labelledby="all-tools-table"
			className="overflow-hidden rounded-lg border border-border bg-card"
		>
			<div className="flex flex-col gap-1 p-5 sm:p-6">
				<h2 id="all-tools-table" className="text-2xl font-semibold tracking-[-0.025em]">
					All tools
				</h2>
				<p className="text-sm text-muted-foreground">
					{tools.length} tools across {categoriesWithTools.length} categories. Every tool runs in
					your browser unless marked AI.
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-2 px-5 pb-4 sm:px-6">
				<div className="relative w-full sm:w-80">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						aria-label="Filter tools"
						placeholder="Filter tools…"
						value={query}
						onChange={(e) => onFilter(setQuery)(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Select
					aria-label="Category"
					value={category}
					onChange={(e) => {
						const v = e.target.value;
						onFilter(setCategory)(isCategoryId(v) ? v : "all");
					}}
					className="w-44"
				>
					<option value="all">All categories</option>
					{categoriesWithTools.map((id) => (
						<option key={id} value={id}>
							{categoryById[id].name}
						</option>
					))}
				</Select>
				<Select
					aria-label="Runtime"
					value={runtime}
					onChange={(e) => onFilter(setRuntime)(e.target.value as Runtime)}
					className="w-40"
				>
					<option value="all">All runtimes</option>
					<option value="browser">Private (browser)</option>
					<option value="server-ai">AI (server)</option>
				</Select>
				<Select
					aria-label="Sort"
					value={sort}
					onChange={(e) => onFilter(setSort)(e.target.value as Sort)}
					className="ml-auto w-48"
				>
					<option value="name">Sort: Name (A–Z)</option>
					<option value="popular">Sort: Popular</option>
					<option value="category">Sort: Category</option>
				</Select>
			</div>

			<Table className="min-w-[860px]">
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="w-[34%]">Tool</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Runtime</TableHead>
						<TableHead>Popularity</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="w-14">
							<span className="sr-only">Open</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{visible.length === 0 ? (
						<TableRow className="hover:bg-transparent">
							<TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
								No tools match these filters.
							</TableCell>
						</TableRow>
					) : (
						visible.map((tool) => {
							const cat = categoryById[tool.category];
							return (
								<TableRow key={tool.slug}>
									<TableCell>
										<Link
											to="/tools/$slug"
											params={{ slug: tool.slug }}
											className="group flex items-center gap-3"
										>
											<ToolIcon tool={tool} size="sm" />
											<span className="text-sm font-medium">{tool.name}</span>
											{isTopTool(tool) && <ToolTag type="top" />}
											{tool.isNew && <ToolTag type="new" />}
										</Link>
									</TableCell>
									<TableCell>
										<CategoryBadge
											category={tool.category}
											icon={cat.icon}
											label={categoryShortName(cat.name)}
										/>
									</TableCell>
									<TableCell>
										<ToolTag type={isPrivateTool(tool) ? "private" : "ai"} />
									</TableCell>
									<TableCell className="font-mono text-xs text-muted-foreground">
										{tool.popular !== undefined ? `#${tool.popular}` : "—"}
									</TableCell>
									<TableCell>
										<Badge tone="positive">Live</Badge>
									</TableCell>
									<TableCell>
										<Button asChild variant="ghost" size="icon-sm">
											<Link
												to="/tools/$slug"
												params={{ slug: tool.slug }}
												aria-label={`Open ${tool.name}`}
											>
												<ArrowUpRight />
											</Link>
										</Button>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>

			<nav
				aria-label="Tools table pagination"
				className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6"
			>
				<p className="text-sm text-muted-foreground" aria-live="polite">
					{rows.length === 0
						? "Showing 0 tools"
						: `Showing ${start + 1}–${start + visible.length} of ${rows.length} tools`}
				</p>
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						disabled={current === 0}
						onClick={() => setPage(current - 1)}
					>
						<ChevronLeft /> Previous
					</Button>
					{pageItems(current, pageCount).map((p, i) =>
						p === null ? (
							<span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">
								…
							</span>
						) : (
							<Button
								key={p}
								variant={p === current ? "secondary" : "ghost"}
								size="sm"
								aria-current={p === current ? "page" : undefined}
								aria-label={`Page ${p + 1}`}
								onClick={() => setPage(p)}
								className="min-w-9"
							>
								{p + 1}
							</Button>
						),
					)}
					<Button
						variant="outline"
						size="sm"
						disabled={current >= pageCount - 1}
						onClick={() => setPage(current + 1)}
					>
						Next <ChevronRight />
					</Button>
				</div>
			</nav>
		</section>
	);
}
