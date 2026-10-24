import { Button } from "@qbtools/ui/button";
import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";
import { ChevronDown, HardDrive, LayoutDashboard, LogOut, Settings, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { useAccount } from "./account-provider";

export function UserMenu({ className }: { className?: string } = {}) {
	const { user, pending } = useAccount();
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function handleClickOutside(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	if (pending)
		return (
			<span
				role="status"
				aria-label="Checking account"
				className="h-9 w-20 animate-pulse rounded-full bg-muted/60"
			/>
		);

	if (!user)
		return (
			<Button
				asChild
				variant="default"
				size="sm"
				className={cn(
					"h-9 rounded-full px-4 text-xs font-semibold shadow-2xs transition-all duration-150 hover:shadow-sm",
					className,
				)}
			>
				<a href="/login" className="flex items-center gap-1.5">
					<UserRound className="size-3.5" />
					<span>Sign in</span>
				</a>
			</Button>
		);

	const initials = (user.name || "U")
		.split(" ")
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<div ref={menuRef} className={cn("relative", className)}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="true"
				className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2.5 text-xs font-medium shadow-2xs transition-all duration-150 hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:text-sm"
			>
				{user.image ? (
					<img
						src={user.image}
						alt=""
						className="size-5 rounded-full object-cover ring-1 ring-border/80"
					/>
				) : (
					<span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ring-1 ring-border/80">
						{initials}
					</span>
				)}
				<span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
				<ChevronDown
					className={cn(
						"size-3 text-muted-foreground transition-transform duration-200",
						open && "rotate-180",
					)}
				/>
			</button>

			{open && (
				<div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-border/80 bg-popover/95 p-1.5 text-popover-foreground shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95">
					<div className="border-b border-border/50 px-3 py-2.5">
						<div className="truncate text-xs font-semibold text-foreground">{user.name}</div>
						<div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
					</div>

					<div className="py-1">
						<Link
							to="/dashboard"
							onClick={() => setOpen(false)}
							className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent/80"
						>
							<LayoutDashboard className="size-4 text-muted-foreground" />
							<span>Dashboard</span>
						</Link>
						<Link
							to="/dashboard/media"
							onClick={() => setOpen(false)}
							className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent/80"
						>
							<HardDrive className="size-4 text-muted-foreground" />
							<span>Media Storage</span>
						</Link>
						<Link
							to="/dashboard/settings"
							onClick={() => setOpen(false)}
							className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent/80"
						>
							<Settings className="size-4 text-muted-foreground" />
							<span>Settings</span>
						</Link>
					</div>

					<div className="border-t border-border/50 pt-1">
						<button
							type="button"
							className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
							onClick={async () => {
								setOpen(false);
								await authClient.signOut();
								window.location.assign("/");
							}}
						>
							<LogOut className="size-4" />
							<span>Sign out</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
