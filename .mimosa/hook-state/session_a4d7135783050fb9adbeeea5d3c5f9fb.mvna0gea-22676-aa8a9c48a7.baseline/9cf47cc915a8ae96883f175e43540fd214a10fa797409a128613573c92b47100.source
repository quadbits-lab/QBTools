import { THEME_INIT_SCRIPT } from "@qbtools/ui/theme";
import { Toaster } from "@qbtools/ui/toaster";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { GoogleAnalytics } from "tanstack-router-ga4";
import { AccountProvider } from "#/components/account-provider";
import { analyticsScripts } from "#/components/analytics";
import { CommandPaletteProvider } from "#/components/command-palette";
import { ConsentBanner } from "#/components/consent";
import { NotFound } from "#/components/not-found";
import { PwaManager } from "#/components/pwa-manager";
import { RouteLoading } from "#/components/route-loading";
import { SiteFooter } from "#/components/site-footer";
import { SiteHeader } from "#/components/site-header";
import { seo } from "#/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, THEME_COLOR } from "#/lib/site";
import { sessionFn } from "#/server/auth.functions";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	// A cached page must still boot offline, where the session call cannot succeed.
	loader: () => sessionFn().catch(() => null),
	head: ({ loaderData, matches }) => {
		const privatePage =
			Boolean(loaderData?.user) ||
			matches.some((match) => /^\/(dashboard|login|admin)(\/|$)/.test(match.pathname));
		const base = seo({
			title: `${SITE_NAME} — ${SITE_TAGLINE}`,
			rawTitle: true,
			description: SITE_DESCRIPTION,
			path: "/",
		});
		return {
			meta: [
				{ charSet: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
				{ name: "theme-color", content: THEME_COLOR },
				{ name: "color-scheme", content: "dark light" },
				{ name: "format-detection", content: "telephone=no" },
				{ name: "mobile-web-app-capable", content: "yes" },
				{ name: "apple-mobile-web-app-capable", content: "yes" },
				{ name: "apple-mobile-web-app-status-bar-style", content: "black" },
				{ name: "apple-mobile-web-app-title", content: SITE_NAME },
				{ name: "google-adsense-account", content: "ca-pub-7437740312049843" },
				...base.meta,
			],
			links: [
				{ rel: "stylesheet", href: appCss },
				{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
				{ rel: "icon", href: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
				{ rel: "shortcut icon", href: "/favicon.ico" },
				{ rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
				{ rel: "manifest", href: "/manifest.webmanifest" },
			],
			scripts: [{ children: THEME_INIT_SCRIPT }, ...(privatePage ? [] : analyticsScripts())],
		};
	},
	component: RootComponent,
	notFoundComponent: NotFound,
});

function RootComponent() {
	// The dashboard is an app shell with its own sidebar and top bar.
	const inDashboard = useRouterState({
		select: (state) => /^\/dashboard(\/|$)/.test(state.location.pathname),
	});
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<GoogleAnalytics measurementId="G-EJXH2DPNF4" />
				<AccountProvider>
					<RouteLoading />
					<PwaManager />
					<CommandPaletteProvider>
						<div className="flex min-h-dvh flex-col">
							{!inDashboard && <SiteHeader />}
							<main id="main" className="flex-1">
								<Outlet />
							</main>
							{!inDashboard && <SiteFooter />}
						</div>
					</CommandPaletteProvider>
				</AccountProvider>
				<ConsentBanner />
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
