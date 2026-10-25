import type { ToolDef, ToolPreset } from "./types";

export interface SearchResult {
	kind: "tool" | "preset";
	tool: ToolDef;
	preset?: ToolPreset;
	href: string;
	title: string;
	subtitle: string;
	score: number;
}

const STOPWORDS = new Set([
	"a",
	"an",
	"the",
	"to",
	"of",
	"for",
	"in",
	"my",
	"and",
	"online",
	"free",
	"tool",
	"tools",
	"how",
	"with",
]);

/** Lowercase, strip punctuation, split "100kb" → "100 kb". */
export function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/(\d)([a-z])/g, "$1 $2")
		.replace(/([a-z])(\d)/g, "$1 $2")
		.split(/[^a-z0-9]+/)
		.filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

/** Damerau-free Levenshtein with early exit above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
	if (Math.abs(a.length - b.length) > max) return max + 1;
	let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		const curr = [i];
		let rowMin = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			const value = Math.min((prev[j] ?? 0) + 1, (curr[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
			curr.push(value);
			rowMin = Math.min(rowMin, value);
		}
		if (rowMin > max) return max + 1;
		prev = curr;
	}
	return prev[b.length] ?? max + 1;
}

interface Field {
	tokens: string[];
	weight: number;
}

interface Entry {
	result: Omit<SearchResult, "score">;
	fields: Field[];
	boost: number;
}

/** 3 exact, 2 prefix, 1 typo-tolerant, 0 no match. */
function matchToken(queryToken: string, fieldToken: string): number {
	if (queryToken === fieldToken) return 3;
	if (fieldToken.startsWith(queryToken)) return queryToken.length >= 2 ? 2 : 1;
	if (queryToken.length >= 4 && editDistance(queryToken, fieldToken, 1) <= 1) return 1;
	return 0;
}

function scoreEntry(entry: Entry, queryTokens: string[]): number | null {
	let total = 0;
	for (const queryToken of queryTokens) {
		let best = 0;
		for (const field of entry.fields) {
			for (const token of field.tokens) {
				const match = matchToken(queryToken, token);
				if (match * field.weight > best) best = match * field.weight;
			}
		}
		if (best === 0) return null;
		total += best;
	}
	return total + entry.boost;
}

export function buildSearchIndex(tools: ToolDef[]) {
	const entries: Entry[] = [];
	for (const tool of tools) {
		const popularity = tool.popular ? Math.max(0, 1 - tool.popular / 40) : 0;
		entries.push({
			result: {
				kind: "tool",
				tool,
				href: `/tools/${tool.slug}`,
				title: tool.name,
				subtitle: tool.tagline,
			},
			fields: [
				{ tokens: tokenize(`${tool.name} ${tool.slug}`), weight: 4 },
				{ tokens: tokenize(tool.keywords.join(" ")), weight: 3 },
				{ tokens: tokenize(`${tool.tagline} ${tool.category}`), weight: 1 },
			],
			boost: popularity + 0.5,
		});
		for (const preset of tool.presets ?? []) {
			entries.push({
				result: {
					kind: "preset",
					tool,
					preset,
					href: `/tools/${tool.slug}/${preset.slug}`,
					title: preset.title,
					subtitle: tool.name,
				},
				fields: [
					{ tokens: tokenize(preset.title), weight: 4 },
					{ tokens: tokenize(preset.keywords.join(" ")), weight: 3 },
					{ tokens: tokenize(tool.keywords.join(" ")), weight: 1 },
				],
				boost: popularity,
			});
		}
	}

	return {
		search(query: string, limit = 8): SearchResult[] {
			const queryTokens = tokenize(query);
			if (queryTokens.length === 0) return [];
			const scored: SearchResult[] = [];
			for (const entry of entries) {
				const score = scoreEntry(entry, queryTokens);
				if (score !== null) scored.push({ ...entry.result, score });
			}
			scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
			return scored.slice(0, limit);
		},
	};
}

export type SearchIndex = ReturnType<typeof buildSearchIndex>;
