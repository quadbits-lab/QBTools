import { getTool } from "@qbtools/registry";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ToolPage, toolPageSeoInput } from "#/components/tool-page";
import { breadcrumbLd, faqLd, seo, webAppLd } from "#/lib/seo";

export const Route = createFileRoute("/tools/$slug/")({
	loader: ({ params }) => {
		const tool = getTool(params.slug);
		if (!tool) throw notFound();
		return { slug: tool.slug };
	},
	head: ({ loaderData }) => {
		const tool = loaderData ? getTool(loaderData.slug) : undefined;
		if (!tool) return {};
		const input = toolPageSeoInput(tool);
		return seo({
			title: input.title,
			description: input.description,
			path: input.path,
			jsonLd: [
				webAppLd({ name: tool.name, description: tool.description, path: input.path, category: input.categoryLabel }),
				faqLd(tool.faqs),
				breadcrumbLd(input.breadcrumbs),
			],
		});
	},
	component: ToolRoute,
});

function ToolRoute() {
	const { slug } = Route.useLoaderData();
	const tool = getTool(slug);
	return tool ? <ToolPage tool={tool} /> : null;
}
