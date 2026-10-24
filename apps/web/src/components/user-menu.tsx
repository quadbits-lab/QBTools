import { Button } from "@qbtools/ui/button";
import { Link } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { GitHubIcon } from "#/components/github-icon";
import { authClient } from "#/lib/auth-client";
import { useAccount } from "./account-provider";

export function UserMenu() {
	const { user, pending } = useAccount();
	if (pending)
		return (
			<span
				role="status"
				aria-label="Checking account"
				className="h-9 w-10 animate-pulse bg-muted sm:h-10 sm:w-36"
			/>
		);
	if (!user)
		return (
			<Button asChild variant="secondary" size="sm">
				<a href="/login">
					<GitHubIcon className="size-4" />
					<span className="hidden sm:inline">Sign in with GitHub</span>
					<span className="sm:hidden">Sign in</span>
				</a>
			</Button>
		);
	return (
		<details className="relative">
			<summary className="flex cursor-pointer list-none items-center gap-2 border border-input px-3 py-2 text-sm">
				{user.image ? (
					<img src={user.image} alt="" className="size-5 rounded-full" />
				) : (
					<UserRound className="size-4" />
				)}
				<span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
			</summary>
			<div className="absolute right-0 z-50 mt-2 grid min-w-52 gap-1 border border-input bg-background p-2 shadow-lg">
				<Link className="p-2 hover:bg-muted" to="/dashboard">
					Dashboard
				</Link>
				<Link className="p-2 hover:bg-muted" to="/dashboard/media">
					Media Storage
				</Link>
				<Link className="p-2 hover:bg-muted" to="/dashboard/settings">
					Settings
				</Link>
				<button
					type="button"
					className="flex items-center gap-2 p-2 text-left hover:bg-muted"
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
