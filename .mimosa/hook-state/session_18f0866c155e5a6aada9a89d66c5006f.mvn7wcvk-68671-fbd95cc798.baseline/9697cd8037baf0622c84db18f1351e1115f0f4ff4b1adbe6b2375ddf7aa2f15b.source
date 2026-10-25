import { Button } from "@qbtools/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
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
				<h2 className="text-xl">Profile</h2>
				<p>
					<span className="text-muted-foreground text-sm">Name:</span> {user?.name}
				</p>
				<p>
					<span className="text-muted-foreground text-sm">Email:</span> {user?.email}
				</p>
				{user?.username && (
					<p>
						<span className="text-muted-foreground text-sm">Username:</span> @{user.username}
					</p>
				)}
				{user?.phone && (
					<p>
						<span className="text-muted-foreground text-sm">Phone:</span> {user.phone}
					</p>
				)}
			</section>
			<section className="grid gap-4 border border-input p-5">
				<h2 className="text-xl">Preferences</h2>
				<div className="grid gap-2">
					<span className="text-sm font-medium">Theme</span>
					<Select
						value={data?.preferences.theme ?? "dark"}
						onValueChange={(val) => setThemeMode(val as "light" | "dark" | "system")}
					>
						<SelectTrigger className="w-full sm:w-60">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="dark">Dark</SelectItem>
							<SelectItem value="light">Light</SelectItem>
							<SelectItem value="system">System</SelectItem>
						</SelectContent>
					</Select>
				</div>
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
