import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionFn } from "#/server/auth.functions";
export const Route = createFileRoute("/_account")({
	beforeLoad: async ({ location }) => {
		const session = await sessionFn();
		if (!session.user) throw redirect({ to: "/login", search: { redirect: location.href } });
		return { user: session.user };
	},
	component: () => <Outlet />,
});
