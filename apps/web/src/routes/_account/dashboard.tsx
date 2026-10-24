import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { DashboardSkeleton } from "#/components/route-loading";
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
function DashboardLayout() {
	return (
		<div className="container-page py-10">
			<header className="mb-8 flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl">Your workspace</h1>
				<nav aria-label="Dashboard" className="flex flex-wrap gap-4">
					<Link to="/dashboard" activeOptions={{ exact: true }}>
						Overview
					</Link>
					<Link to="/dashboard/media">Media Storage</Link>
					<Link to="/dashboard/favorites">Favorites</Link>
					<Link to="/dashboard/settings">Settings</Link>
				</nav>
			</header>
			<Outlet />
		</div>
	);
}
