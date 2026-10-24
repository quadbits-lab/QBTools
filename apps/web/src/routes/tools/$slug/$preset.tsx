import { getPreset, getTool } from "@qbtools/registry";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ToolPage, toolPageSeoInput } from "#/components/tool-page";
import { breadcrumbLd, faqLd, seo, webAppLd } from "#/lib/seo";

export const Route = createFileRoute("/tools/$slug/$preset")({
	loader: ({ params }) => {
		const tool = getTool(params.slug);
		const preset = tool && getPreset(tool, params.preset);
		if (!tool || !preset) throw notFound();
		return { slug: tool.slug, preset: preset.slug };
	},
	head: ({ loaderData }) => {
		const tool = loaderData ? getTool(loaderData.slug) : undefined;
		const preset = tool && loaderData ? getPreset(tool, loaderData.preset) : undefined;
		if (!tool || !preset) return {};
		const input = toolPageSeoInput(tool, preset);
		return seo({
			title: input.title,
			description: input.description,
			path: input.path,
			jsonLd: [
				webAppLd({ name: preset.title, description: preset.description, path: input.path, category: input.categoryLabel }),
				faqLd(tool.faqs),
				breadcrumbLd(input.breadcrumbs),
			],
		});
	},
	component: PresetRoute,
});

function PresetRoute() {
	const data = Route.useLoaderData();
	const tool = getTool(data.slug);
	const preset = tool && getPreset(tool, data.preset);
	// key: remount the widget so preset params apply when switching presets.
	return tool && preset ? <ToolPage key={preset.slug} tool={tool} preset={preset} /> : null;
}
