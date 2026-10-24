import { Button } from "@qbtools/ui/button";
import { Link } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { authClient } from "#/lib/auth-client";
import { useAccount } from "./account-provider";

export function UserMenu() {
	const { user, pending } = useAccount();
	if (pending)
		return (
			<span
				role="status"
				aria-label="Checking account"
				className="h-9 w-10 animate-pulse rounded-md bg-muted sm:w-24"
			/>
		);
	if (!user)
		return (
			<Button asChild variant="default" size="sm">
				<a href="/login" className="flex items-center gap-2">
					<span>Sign in</span>
				</a>
			</Button>
		);
	return (
		<details className="relative">
			<summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">
				{user.image ? (
					<img src={user.image} alt="" className="size-5 rounded-full" />
				) : (
					<UserRound className="size-4" />
				)}
				<span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
			</summary>
			<div className="absolute right-0 z-50 mt-2 grid min-w-52 gap-1 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-popover">
				<Link className="rounded-md p-2 text-sm hover:bg-accent" to="/dashboard">
					Dashboard
				</Link>
				<Link className="rounded-md p-2 text-sm hover:bg-accent" to="/dashboard/media">
					Media Storage
				</Link>
				<Link className="rounded-md p-2 text-sm hover:bg-accent" to="/dashboard/settings">
					Settings
				</Link>
				<button
					type="button"
					className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent"
					onClick={async () => {
						await authClient.signOut();
						window.location.assign("/");
					}}
				>
					<LogOut className="size-4" /> Sign out
				</button>
			</div>
		</details>
	);
}
