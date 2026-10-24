import { getTool } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "#/components/account-provider";
import { StorageMeter } from "#/components/media-library";
import { DashboardSkeleton } from "#/components/route-loading";
import { ToolCard } from "#/components/tool-card";
import { api } from "#/lib/api-client";
import type { MediaAsset } from "#/lib/media-contract";
export const Route = createFileRoute("/_account/dashboard/")({ component: Dashboard });
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
	return (
		<div className="grid gap-8">
			<div>
				<h2 className="text-2xl">Welcome back, {user?.name}.</h2>
				<p className="mt-2 text-muted-foreground">
					Your favorite tools and saved assets, together.
				</p>
			</div>
			<StorageMeter />
			<section>
				<div className="mb-4 flex justify-between">
					<h2 className="text-xl">Recent assets</h2>
					<Link to="/dashboard/media">Manage storage →</Link>
				</div>
				{assets.length ? (
					<div className="grid gap-3 sm:grid-cols-2">
						{assets.map((asset) => (
							<a
								className="truncate border border-input p-4 hover:bg-muted"
								key={asset.id}
								href={`/api/media/${asset.id}/content?download=1`}
							>
								{asset.name}
							</a>
						))}
					</div>
				) : (
					<p className="text-muted-foreground">
						Upload a file or choose Save to Media after using a tool.
					</p>
				)}
			</section>
			{[
				["Favorite tools", data.favorites],
				["Recently used", data.recent.slice(0, 8)],
			].map(([title, slugs]) => (
				<section key={String(title)}>
					<h2 className="mb-4 text-xl">{String(title)}</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{(slugs as string[]).map((slug) => {
							const tool = getTool(slug);
							return tool ? <ToolCard key={slug} tool={tool} variant="compact" /> : null;
						})}
					</div>
					{!(slugs as string[]).length && (
						<Button asChild variant="secondary">
							<Link to="/tools">Explore tools</Link>
						</Button>
					)}
				</section>
			))}
		</div>
	);
}
