import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@qbtools/ui/sidebar";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
	ChevronRight,
	FolderOpen,
	Heart,
	LayoutDashboard,
	LayoutGrid,
	Lock,
	LogOut,
	type LucideIcon,
	Search,
	Settings2,
	UserRound,
} from "lucide-react";
import { useAccount } from "#/components/account-provider";
import { useCommandPalette } from "#/components/command-palette";
import { Logo } from "#/components/logo";
import { DashboardSkeleton } from "#/components/route-loading";
import { ThemeToggle } from "#/components/theme-toggle";
import { authClient } from "#/lib/auth-client";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/_account/dashboard")({
	head: () =>
		seo({
			title: "Your dashboard",
			description: "Your private QBTools workspace",
			path: "/dashboard",
			noindex: true,
		}),
	pendingComponent: DashboardSkeleton,
	component: DashboardLayout,
});

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };

const WORKSPACE: NavItem[] = [
	{ to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
	{ to: "/tools", label: "Tools", icon: LayoutGrid },
	{ to: "/dashboard/media", label: "Media storage", icon: FolderOpen },
	{ to: "/dashboard/favorites", label: "Favorites", icon: Heart },
];

const ACCOUNT: NavItem[] = [
	{ to: "/dashboard/settings", label: "Settings", icon: Settings2 },
	{ to: "/privacy", label: "Privacy", icon: Lock },
];

const PAGE_TITLE: Record<string, string> = {
	"/dashboard": "Overview",
	"/dashboard/media": "Media storage",
	"/dashboard/favorites": "Favorites",
	"/dashboard/settings": "Settings",
};

function NavGroup({
	label,
	items,
	pathname,
}: {
	label: string;
	items: NavItem[];
	pathname: string;
}) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					const active = item.exact
						? pathname === item.to
						: pathname === item.to || pathname.startsWith(`${item.to}/`);
					return (
						<SidebarMenuItem key={item.to}>
							<SidebarMenuButton asChild isActive={active}>
								<Link to={item.to}>
									<item.icon />
									{item.label}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}

function DashboardLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname.replace(/\/$/, "") });
	const { user } = useAccount();
	const { open } = useCommandPalette();
	const title = PAGE_TITLE[pathname] ?? "Overview";
	const initials = (user?.name ?? "?")
		.split(/\s+/)
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<SidebarProvider>
			<Sidebar aria-label="Dashboard">
				<SidebarHeader>
					<Logo />
				</SidebarHeader>
				<SidebarContent>
					<NavGroup label="Workspace" items={WORKSPACE} pathname={pathname} />
					<NavGroup label="Account" items={ACCOUNT} pathname={pathname} />
				</SidebarContent>
				<SidebarFooter>
					<div className="flex items-center gap-3 rounded-md p-1.5">
						<span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted text-sm font-medium">
							{user?.image ? (
								<img src={user.image} alt="" className="size-full object-cover" />
							) : initials ? (
								initials
							) : (
								<UserRound className="size-4" />
							)}
						</span>
						<span className="flex min-w-0 flex-1 flex-col">
							<span className="truncate text-sm font-medium">{user?.name}</span>
							<span className="truncate text-xs text-muted-foreground">{user?.email}</span>
						</span>
						<button
							type="button"
							aria-label="Sign out"
							title="Sign out"
							className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
							onClick={async () => {
								await authClient.signOut();
								window.location.assign("/");
							}}
						>
							<LogOut className="size-4" />
						</button>
					</div>
				</SidebarFooter>
			</Sidebar>

			<SidebarInset>
				<div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-veil px-4 backdrop-blur-md sm:px-8">
					<SidebarTrigger />
					<nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
						<Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
							Dashboard
						</Link>
						<ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
						<span className="font-medium" aria-current="page">
							{title}
						</span>
					</nav>
					<div className="ml-auto flex items-center gap-2">
						<button
							type="button"
							onClick={open}
							className="hidden h-10 w-60 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-muted-foreground transition-colors hover:bg-accent md:flex"
						>
							<Search className="size-4" />
							<span className="text-sm">Search tools…</span>
							<kbd className="ml-auto rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-subtle">
								⌘K
							</kbd>
						</button>
						<ThemeToggle />
					</div>
				</div>
				<div className="mx-auto w-full max-w-[1280px] p-4 sm:p-8">
					<h1 className="sr-only">Your workspace</h1>
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
