/** Text runners: word counter and case converter. */

import { caseModes, convertCase, formatDuration, textStats } from "@qbtools/engines/text";
import { requireString, str, type ToolRunner } from "../types";

export const wordCounter: ToolRunner = {
	slug: "word-counter",
	availability: "local",
	stdinField: "text",
	fields: [
		{
			name: "text",
			label: "Text",
			kind: "textarea",
			required: true,
			help: "Or pipe it: cat notes.md | qbtools run word-counter --stdin",
		},
		{ name: "in", label: "Read text from a file instead", kind: "files", accept: [".txt", ".md"] },
	],
	async run({ values }) {
		let text = str(values, "text");
		const paths = Array.isArray(values.in) ? (values.in as string[]) : [];
		if (!text && paths.length) {
			text = await Promise.all(paths.map((path) => Bun.file(path).text()))
				.then((parts) => parts.join("\n"));
		}
		if (!text.trim()) throw new Error("Provide text via --text, --in <file>, or --stdin.");
		const stats = textStats(text);
		return {
			summary: `${stats.words} words · ${stats.characters} characters · ${formatDuration(stats.readingMinutes)} read`,
			outputs: [
				{
					type: "table",
					columns: ["Metric", "Value"],
					rows: [
						["Words", String(stats.words)],
						["Characters", String(stats.characters)],
						["Characters (no spaces)", String(stats.charactersNoSpaces)],
						["Sentences", String(stats.sentences)],
						["Paragraphs", String(stats.paragraphs)],
						["Lines", String(stats.lines)],
						["Reading time", formatDuration(stats.readingMinutes)],
						["Speaking time", formatDuration(stats.speakingMinutes)],
						["Avg word length", stats.averageWordLength.toFixed(1)],
						["Longest word", stats.longestWord],
					],
				},
				...(stats.topKeywords.length
					? [
							{
								type: "table" as const,
								columns: ["Keyword", "Count", "Density"],
								rows: stats.topKeywords.map((keyword) => [
									keyword.word,
									String(keyword.count),
									`${(keyword.density * 100).toFixed(1)}%`,
								]),
							},
						]
					: []),
			],
			data: stats,
		};
	},
};

export const caseConverter: ToolRunner = {
	slug: "case-converter",
	availability: "local",
	stdinField: "text",
	fields: [
		{ name: "text", label: "Text", kind: "textarea", required: true },
		{
			name: "mode",
			label: "Target case",
			kind: "select",
			default: "sentence",
			options: caseModes.map((entry) => ({ label: entry.label, value: entry.mode })),
		},
	],
	async run({ values }) {
		const text = requireString(values, "text", "text");
		const mode = str(values, "mode", "sentence");
		const converted = convertCase(text, mode as never);
		return {
			summary: `Converted to ${mode} case`,
			outputs: [{ type: "text", text: converted }],
			data: { mode, text: converted },
		};
	},
};

export const textRunners: ToolRunner[] = [wordCounter, caseConverter];
