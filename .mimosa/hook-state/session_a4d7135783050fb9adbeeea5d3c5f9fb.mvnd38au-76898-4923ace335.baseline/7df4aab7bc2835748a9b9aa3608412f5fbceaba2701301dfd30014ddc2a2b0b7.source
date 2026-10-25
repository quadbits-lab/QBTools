import { categoryById, getTool } from "@qbtools/registry";
import { Badge } from "@qbtools/ui/badge";
import { Button } from "@qbtools/ui/button";
import { cn } from "@qbtools/ui/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, HardDrive, LayoutGrid, type LucideIcon, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "#/components/account-provider";
import { decimalBytes, StorageMeter } from "#/components/media-library";
import { DashboardSkeleton } from "#/components/route-loading";
import { ToolCard, ToolIcon } from "#/components/tool-card";
import { ToolsTable } from "#/components/tools-table";
import { api } from "#/lib/api-client";
import { categoryShortName } from "#/lib/icons";
import { type MediaAsset, STORAGE_LIMIT } from "#/lib/media-contract";

export const Route = createFileRoute("/_account/dashboard/")({ component: Dashboard });

const STAT_TONES = {
	indigo: "border-cat-indigo-border bg-cat-indigo-bg text-cat-indigo-icon",
	emerald: "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-icon",
	sky: "border-cat-sky-border bg-cat-sky-bg text-cat-sky-icon",
	amber: "border-cat-amber-border bg-cat-amber-bg text-cat-amber-icon",
} as const;
const STAT_TEXT = {
	indigo: "text-cat-indigo-fg",
	emerald: "text-cat-emerald-fg",
	sky: "text-cat-sky-fg",
	amber: "text-cat-amber-fg",
} as const;

function StatCard({
	tone,
	icon: Icon,
	label,
	value,
	caption,
}: {
	tone: keyof typeof STAT_TONES;
	icon: LucideIcon;
	label: string;
	value: string;
	caption: string;
}) {
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
			<div className="flex items-center justify-between gap-3">
				<span className="text-sm font-medium text-muted-foreground">{label}</span>
				<span className={cn("grid size-8 place-items-center rounded-md border", STAT_TONES[tone])}>
					<Icon className="size-4" aria-hidden="true" />
				</span>
			</div>
			<p className="text-3xl font-semibold tracking-[-0.03em]">{value}</p>
			<p className={cn("text-xs", STAT_TEXT[tone])}>{caption}</p>
		</div>
	);
}

function Panel({
	title,
	description,
	action,
	children,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:p-6">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
					{description && <p className="text-sm text-muted-foreground">{description}</p>}
				</div>
				{action}
			</div>
			{children}
		</section>
	);
}

function Dashboard() {
	const { user, data } = useAccount();
	const [assets, setAssets] = useState<MediaAsset[]>([]);
	useEffect(() => {
		let live = true;
		void api<{ assets: MediaAsset[] }>("/api/media/list")
			.then((r) => {
				if (live) setAssets(r.assets.slice(0, 4));
			})
			.catch(() => {});
		return () => {
			live = false;
		};
	}, []);
	if (!data) return <DashboardSkeleton />;

	const recent = data.recent.map(getTool).filter((t) => t !== undefined);
	const favorites = data.favorites.map(getTool).filter((t) => t !== undefined);
	const toolsUsed = new Set([...data.recent, ...data.favorites]).size;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-3xl font-semibold tracking-[-0.03em]">
						Welcome back{user?.name ? `, ${user.name}.` : ""}
					</h2>
					<p className="mt-1 text-muted-foreground">
						Pick up where you left off, or jump into a new tool.
					</p>
				</div>
				<Button asChild>
					<Link to="/tools">
						Browse tools <ArrowRight />
					</Link>
				</Button>
			</div>

			<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					tone="indigo"
					icon={LayoutGrid}
					label="Tools used"
					value={String(toolsUsed)}
					caption="across recent and saved"
				/>
				<StatCard
					tone="emerald"
					icon={Activity}
					label="Recent activity"
					value={String(recent.length)}
					caption="tools opened lately"
				/>
				<StatCard
					tone="sky"
					icon={HardDrive}
					label="Storage used"
					value={decimalBytes(data.storage.used)}
					caption={`of ${decimalBytes(STORAGE_LIMIT)} private media storage`}
				/>
				<StatCard
					tone="amber"
					icon={Star}
					label="Favorites"
					value={String(favorites.length)}
					caption="pinned tools"
				/>
			</div>

			<div className="grid gap-5 lg:grid-cols-2">
				<Panel
					title="Recently used"
					description="Tools you opened lately"
					action={recent.length > 0 && <Badge tone="outline">{recent.length} recent</Badge>}
				>
					{recent.length ? (
						<ul className="flex flex-col gap-3">
							{recent.slice(0, 5).map((tool) => (
								<li key={tool.slug}>
									<Link
										to="/tools/$slug"
										params={{ slug: tool.slug }}
										className="group flex items-center gap-3 rounded-md"
									>
										<ToolIcon tool={tool} size="sm" />
										<span className="flex min-w-0 flex-1 flex-col">
											<span className="truncate text-sm font-medium">{tool.name}</span>
											<span className="text-xs text-muted-foreground">
												{categoryShortName(categoryById[tool.category].name)}
											</span>
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">Tools you use will show up here.</p>
					)}
				</Panel>

				<Panel
					title="Favorites"
					description="Pinned for quick access"
					action={
						<Button asChild variant="ghost" size="sm">
							<Link to="/dashboard/favorites">Manage</Link>
						</Button>
					}
				>
					{favorites.length ? (
						<div className="flex flex-col gap-3">
							{favorites.slice(0, 4).map((tool) => (
								<ToolCard key={tool.slug} tool={tool} variant="compact" />
							))}
						</div>
					) : (
						<div className="flex flex-col items-start gap-3">
							<p className="text-sm text-muted-foreground">
								Use the star on any tool to pin it here.
							</p>
							<Button asChild variant="secondary" size="sm">
								<Link to="/tools">Explore tools</Link>
							</Button>
						</div>
					)}
				</Panel>
			</div>

			<div className="grid gap-5 lg:grid-cols-2">
				<Panel
					title="Recent files"
					description="Saved to your private media storage"
					action={
						<Button asChild variant="ghost" size="sm">
							<Link to="/dashboard/media">Manage storage</Link>
						</Button>
					}
				>
					{assets.length ? (
						<ul className="flex flex-col gap-2">
							{assets.map((asset) => (
								<li key={asset.id}>
									<a
										className="block truncate rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:bg-accent"
										href={`/api/media/${asset.id}/content?download=1`}
									>
										{asset.name}
									</a>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">
							Upload a file or choose Save to Media after using a tool.
						</p>
					)}
				</Panel>
				<Panel title="Storage" description="Files stay private to your account">
					<StorageMeter />
				</Panel>
			</div>

			<ToolsTable />
		</div>
	);
}
