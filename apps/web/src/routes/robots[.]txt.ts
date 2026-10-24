import { createFileRoute } from "@tanstack/react-router";
import { runtimeSiteUrl } from "#/server/site-url";

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: () =>
				new Response(
					`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /login\nDisallow: /api/auth\nDisallow: /api/account\nDisallow: /api/media\nDisallow: /_serverFn/\n\nSitemap: ${runtimeSiteUrl()}/sitemap.xml\n`,
					{
						headers: {
							"Content-Type": "text/plain; charset=utf-8",
							"Cache-Control": "public, max-age=3600",
						},
					},
				),
		},
	},
});
