import { guides } from "@qbtools/content";
import { registryPaths } from "@qbtools/registry";
import { createFileRoute } from "@tanstack/react-router";
import { runtimeSiteUrl } from "#/server/site-url";

const STATIC_PATHS = [
	"/",
	"/tools",
	"/guides",
	"/services",
	"/premium",
	"/about",
	"/contact",
	"/privacy",
	"/terms",
	"/disclaimer",
	"/cookies",
];

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: () => {
				const origin = runtimeSiteUrl();
				const paths = [
					...STATIC_PATHS,
					...registryPaths(),
					...guides.map((g) => `/guides/${g.slug}`),
				];
				const urls = paths
					.map((path) => {
						const priority = path === "/" ? "1.0" : path.startsWith("/tools/") ? "0.9" : "0.6";
						return `<url><loc>${origin}${path === "/" ? "/" : path}</loc><priority>${priority}</priority></url>`;
					})
					.join("");
				return new Response(
					`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
					{
						headers: {
							"Content-Type": "application/xml; charset=utf-8",
							"Cache-Control": "public, max-age=3600",
						},
					},
				);
			},
		},
	},
});
