import { Button } from "@qbtools/ui/button";
import { Select } from "@qbtools/ui/input";
import { setThemeMode } from "@qbtools/ui/theme";
import { toast } from "@qbtools/ui/toaster";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "#/components/account-provider";
import { api } from "#/lib/api-client";
import { authClient } from "#/lib/auth-client";
export const Route = createFileRoute("/_account/dashboard/settings")({ component: Settings });
function Settings() {
	const { user, data, refresh } = useAccount();
	const [sessions, setSessions] = useState<
		{ token: string; userAgent?: string | null; createdAt: Date }[]
	>([]);
	const load = useCallback(async () => {
		const result = await authClient.listSessions();
		if (result.data) setSessions(result.data);
	}, []);
	useEffect(() => {
		void load();
	}, [load]);
	return (
		<div className="grid max-w-3xl gap-8">
			<section className="grid gap-3 border border-input p-5">
				<h2 className="text-xl">GitHub profile</h2>
				<p>{user?.name}</p>
				<p className="text-muted-foreground">{user?.email}</p>
				<p className="text-sm">Your identity is managed through GitHub.</p>
			</section>
			<section className="grid gap-4 border border-input p-5">
				<h2 className="text-xl">Preferences</h2>
				<label className="grid gap-2">
					Theme
					<Select
						value={data?.preferences.theme ?? "dark"}
						onChange={(e) => setThemeMode(e.target.value as "light" | "dark" | "system")}
					>
						<option value="dark">Dark</option>
						<option value="light">Light</option>
						<option value="system">System</option>
					</Select>
				</label>
				<label className="flex gap-3">
					<input
						type="checkbox"
						checked={data?.preferences.track_recent ?? true}
						onChange={async (e) => {
							try {
								await api("/api/account/preferences", {
									method: "PATCH",
									body: JSON.stringify({ track_recent: e.target.checked }),
								});
								await refresh();
							} catch {
								toast.error("Preference could not be saved.");
							}
						}}
					/>
					Remember recently used tools (tool names only)
				</label>
				<Button
					variant="secondary"
					onClick={async () => {
						await api("/api/account/recent", { method: "DELETE" });
						await refresh();
					}}
				>
					Clear recent tools
				</Button>
			</section>
			<section className="grid gap-4 border border-input p-5">
				<h2 className="text-xl">Active sessions</h2>
				{sessions.map((session) => (
					<div
						key={session.token}
						className="flex items-center justify-between gap-3 border-t border-input pt-3"
					>
						<p className="truncate text-sm">{session.userAgent || "Browser session"}</p>
						<Button
							variant="secondary"
							size="sm"
							onClick={async () => {
								const result = await authClient.revokeSession({ token: session.token });
								if (result.error) toast.error("Could not revoke session.");
								else {
									await load();
									await authClient.getSession({ fetchOptions: { cache: "no-store" } });
								}
							}}
						>
							Revoke
						</Button>
					</div>
				))}
				<Button
					variant="secondary"
					onClick={async () => {
						const result = await authClient.revokeOtherSessions();
						if (result.error) toast.error("Could not revoke sessions.");
						else await load();
					}}
				>
					Sign out other devices
				</Button>
			</section>
		</div>
	);
}
