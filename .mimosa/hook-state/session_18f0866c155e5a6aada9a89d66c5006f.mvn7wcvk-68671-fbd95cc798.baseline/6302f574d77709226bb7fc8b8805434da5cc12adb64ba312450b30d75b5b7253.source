import { getTool } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { toast } from "@qbtools/ui/toaster";
import { createFileRoute } from "@tanstack/react-router";
import { useAccount } from "#/components/account-provider";
import { ToolCard } from "#/components/tool-card";
import { api } from "#/lib/api-client";
import { guestFavoriteTools } from "#/lib/local-store";
export const Route = createFileRoute("/_account/dashboard/favorites")({ component: Favorites });
function Favorites() {
	const { data, refresh } = useAccount();
	return (
		<div className="grid gap-5">
			<h2 className="text-2xl">Favorite tools</h2>
			{data && !data.preferences.favorites_imported && (
				<div className="flex flex-wrap items-center justify-between gap-3 border border-input p-4">
					<p>Bring saved tools from this device into your account.</p>
					<Button
						onClick={async () => {
							try {
								await api("/api/account/import-favorites", {
									method: "POST",
									body: JSON.stringify({ slugs: guestFavoriteTools.read() }),
								});
								await refresh();
							} catch {
								toast.error("Import failed. Try again.");
							}
						}}
					>
						Import device favorites
					</Button>
				</div>
			)}
			<div className="grid gap-3 sm:grid-cols-2">
				{data?.favorites.map((slug) => {
					const tool = getTool(slug);
					return tool ? <ToolCard key={slug} tool={tool} /> : null;
				})}
			</div>
			{!data?.favorites.length && (
				<p className="text-muted-foreground">Use the star on any tool to save it here.</p>
			)}
		</div>
	);
}
