/**
 * Discovery commands: search (registry fuzzy index), info (tool details),
 * open (deep link into the web app).
 */

import { buildSearchIndex, categories, getTool, toolHref, tools } from "@qbtools/registry";
import { getString } from "../args";
import { EXIT_ERROR, EXIT_OK, type Command } from "../command";
import { availabilityFor, AVAILABILITY_HINTS, AVAILABILITY_LABELS } from "../../runner/map";
import { formatTable } from "./run";
import { loadConfig, serverUrl } from "../../services/config";

export const searchCommand: Command = {
	name: "search",
	summary: "Fuzzy-search tools by name, keyword or category",
	flags: [{ name: "json", description: "Print as JSON" }],
	async run({ args, io }) {
		const query = args.positional.join(" ").trim();
		if (!query) {
			io.err("Usage: qbtools search <query>");
			return EXIT_ERROR;
		}
		const index = buildSearchIndex(tools);
		const results = index.search(query, 12);
		if (!results.length) {
			io.out(`No tools match "${query}".`);
			return EXIT_OK;
		}
		const rows = results.map((result) => ({
			slug: result.tool.slug,
			name: result.tool.name,
			category: result.tool.category,
			cli: AVAILABILITY_LABELS[availabilityFor(result.tool.slug)],
		}));
		if (getString(args, "json")) {
			io.out(JSON.stringify(rows, null, "\t"));
			return EXIT_OK;
		}
		const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
		io.out(
			formatTable(
				["Slug", "Name", "Category", "CLI"],
				rows.map((row) => [row.slug, row.name, categoryName(row.category), row.cli]),
			),
		);
		return EXIT_OK;
	},
};

export const infoCommand: Command = {
	name: "info",
	summary: "Show details and CLI availability for a tool",
	async run({ args, io }) {
		const slug = args.positional[0];
		if (!slug) {
			io.err("Usage: qbtools info <slug>");
			return EXIT_ERROR;
		}
		const tool = getTool(slug);
		if (!tool) {
			io.err(`Unknown tool: ${slug}`);
			return EXIT_ERROR;
		}
		const availability = availabilityFor(slug);
		const category = categories.find((c) => c.id === tool.category);
		const lines = [
			`${tool.name}  (${tool.slug})`,
			`${category?.name ?? tool.category} · CLI: ${AVAILABILITY_LABELS[availability]} — ${AVAILABILITY_HINTS[availability]}`,
			"",
			tool.tagline,
			"",
			"How to use:",
			...tool.howTo.map((step, index) => `  ${index + 1}. ${step.title}: ${step.text}`),
		];
		io.out(lines.join("\n"));
		if (availability !== "web") {
			io.out("");
			io.out(`Run it: qbtools run ${slug}`);
		}
		return EXIT_OK;
	},
};

/** Registry slugs are kebab-case; anything else never reaches a registry lookup. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Build the tool URL defensively: the slug must be a known registry slug and
 * the composed URL must parse as http(s). The path is re-encoded per segment,
 * and a fresh URL object is returned so only its parsed `.href` is ever
 * handed to the platform opener.
 */
export function buildToolUrl(slug: string, base: string): URL {
	if (!SLUG_PATTERN.test(slug)) throw new Error(`Invalid tool slug: ${slug}`);
	const tool = getTool(slug);
	if (!tool) throw new Error(`Unknown tool: ${slug}`);
	const url = new URL(toolHref(tool), base);
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error(`Refusing to open a non-http(s) URL: ${url.href}`);
	}
	const safePath = url.pathname
		.split("/")
		.filter(Boolean)
		.map((segment) => encodeURIComponent(decodeURIComponent(segment)))
		.join("/");
	return new URL(`/${safePath}`, url.origin);
}

/** Open one URL with the platform opener (argv array, no shell involved). */
export async function openInBrowser(url: URL): Promise<void> {
	const href = url.href;
	if (process.platform === "darwin") {
		await Bun.spawn(["open", href], { stdout: "ignore", stderr: "ignore" }).exited;
		return;
	}
	if (process.platform === "win32") {
		await Bun.spawn(["rundll32", "url.dll,FileProtocolHandler", href], {
			stdout: "ignore",
			stderr: "ignore",
		}).exited;
		return;
	}
	await Bun.spawn(["xdg-open", href], { stdout: "ignore", stderr: "ignore" }).exited;
}

export const openCommand: Command = {
	name: "open",
	summary: "Open a tool's page in the web app (browser)",
	async run({ args, io }) {
		const slug = args.positional[0];
		if (!slug) {
			io.err("Usage: qbtools open <slug>");
			return EXIT_ERROR;
		}
		const config = await loadConfig();
		const url = buildToolUrl(slug, serverUrl(config));
		await openInBrowser(url);
		io.out(url.href);
		return EXIT_OK;
	},
};
