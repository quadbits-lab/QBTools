import { categories, tools, toolsInCategory } from "@qbtools/registry";
import { getBool, getString } from "../args";
import { type Command, EXIT_ERROR, EXIT_OK } from "../command";

export const listCommand: Command = {
	name: "list",
	summary: "List all tools, grouped by category",
	flags: [
		{
			name: "category",
			arg: "value",
			description: "Only show one category (e.g. image, pdf, text)",
		},
		{ name: "json", description: "Print as JSON" },
	],
	async run({ args, io }) {
		const category = getString(args, "category");
		if (category && !categories.some((c) => c.id === category)) {
			io.err(`Unknown category: ${category}`);
			io.err(`Valid categories: ${categories.map((c) => c.id).join(", ")}`);
			return EXIT_ERROR;
		}

		if (getBool(args, "json")) {
			const rows = tools
				.filter((tool) => !category || tool.category === category)
				.map((tool) => ({
					slug: tool.slug,
					name: tool.name,
					category: tool.category,
					runtime: tool.runtime,
				}));
			io.out(JSON.stringify(rows, null, "\t"));
			return EXIT_OK;
		}

		const groups = category ? categories.filter((c) => c.id === category) : categories;
		for (const group of groups) {
			const groupTools = toolsInCategory(group.id);
			if (!groupTools.length) continue;
			io.out(`${group.name} (${groupTools.length})`);
			const slugWidth = Math.max(...groupTools.map((tool) => tool.slug.length));
			for (const tool of groupTools) {
				io.out(`  ${tool.slug.padEnd(slugWidth)}  ${tool.name}`);
			}
			io.out();
		}
		io.out(`${tools.length} tools`);
		return EXIT_OK;
	},
};
