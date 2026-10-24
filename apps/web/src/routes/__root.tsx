import { THEME_INIT_SCRIPT } from "@qbtools/ui/theme";
import { Toaster } from "@qbtools/ui/toaster";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { analyticsScripts } from "#/components/analytics";
import { CommandPaletteProvider } from "#/components/command-palette";
import { ConsentBanner } from "#/components/consent";
import { NotFound } from "#/components/not-found";
import { SiteFooter } from "#/components/site-footer";
import { SiteHeader } from "#/components/site-header";
import { seo } from "#/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, THEME_COLOR } from "#/lib/site";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => {
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
				{ name: "color-scheme", content: "light dark" },
				{ name: "format-detection", content: "telephone=no" },
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
			scripts: [{ children: THEME_INIT_SCRIPT }, ...analyticsScripts()],
		};
	},
	component: RootComponent,
	notFoundComponent: NotFound,
});

function RootComponent() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<CommandPaletteProvider>
					<div className="flex min-h-dvh flex-col">
						<SiteHeader />
						<main id="main" className="flex-1">
							<Outlet />
						</main>
						<SiteFooter />
					</div>
				</CommandPaletteProvider>
				<ConsentBanner />
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
