import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
export function RouteLoading() {
	const pending = useRouterState({ select: (state) => state.status === "pending" });
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		if (!pending) {
			setVisible(false);
			return;
		}
		const timer = setTimeout(() => setVisible(true), 150);
		return () => clearTimeout(timer);
	}, [pending]);
	return visible ? (
		<div
			role="status"
			aria-label="Loading page"
			className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-muted"
		>
			<div className="route-progress h-full w-1/3 bg-primary" />
			<span className="sr-only">Loading page…</span>
		</div>
	) : null;
}
export function DashboardSkeleton() {
	return (
		<div role="status" aria-busy="true" aria-label="Loading dashboard" className="grid gap-5 py-8">
			<div className="h-10 w-48 animate-pulse bg-muted motion-reduce:animate-none" />
			<div className="grid gap-4 sm:grid-cols-3">
				{[1, 2, 3].map((id) => (
					<div key={id} className="h-36 animate-pulse bg-muted motion-reduce:animate-none" />
				))}
			</div>
		</div>
	);
}
