/** Developer runners: code formatter + compression benchmark. */

import { formatBytes } from "../files";
import { files, num, str, type ToolRunner } from "../types";

export const codeFormatter: ToolRunner = {
	slug: "code-formatter",
	availability: "local",
	stdinField: "code",
	fields: [
		{ name: "code", label: "Code", kind: "textarea" },
		{ name: "in", label: "Read code from a file instead", kind: "file" },
		{
			name: "language",
			label: "Language (auto-detected from file name when --in is used)",
			kind: "select",
			options: [
				{ label: "Auto", value: "auto" },
				{ label: "JavaScript", value: "javascript" },
				{ label: "TypeScript", value: "typescript" },
				{ label: "JSON", value: "json" },
				{ label: "CSS", value: "css" },
				{ label: "HTML", value: "html" },
				{ label: "Markdown", value: "markdown" },
				{ label: "YAML", value: "yaml" },
				{ label: "SQL", value: "sql" },
			],
		},
		{
			name: "indent",
			label: "Indentation",
			kind: "select",
			default: "tabs",
			options: [
				{ label: "Tabs", value: "tabs" },
				{ label: "Spaces", value: "spaces" },
			],
		},
		{ name: "printWidth", label: "Line width", kind: "number", default: 100, min: 40, max: 200 },
		{ name: "minify", label: "Minify JSON instead of formatting", kind: "boolean" },
	],
	async run({ values }) {
		const { formatCode, minifyJson, languageForFilename, LANGUAGES } = await import(
			"@qbtools/engines/format"
		);
		const [file] = files(values, "in");
		let code = str(values, "code");
		if (!code && file) code = await file.text();
		if (!code.trim()) throw new Error("Provide code via --code, --in <file>, or --stdin.");
		let language = str(values, "language", "auto");
		if (language === "auto") {
			if (file) {
				const detected = languageForFilename(file.name);
				language = detected ?? "javascript";
			} else {
				language = "javascript";
			}
		}
		if (!LANGUAGES.some((entry) => entry.id === language)) {
			throw new Error(`Unsupported language: ${language}`);
		}
		if (str(values, "minify") === "true" || values.minify === true) {
			if (language !== "json") throw new Error("Minify is JSON-only.");
			return {
				summary: "Minified JSON",
				outputs: [{ type: "code", language: "json", text: minifyJson(code) }],
				data: { language },
			};
		}
		const formatted = await formatCode(code, {
			language: language as never,
			indent: str(values, "indent", "tabs") === "spaces" ? "spaces" : "tabs",
			printWidth: num(values, "printWidth", 100),
		});
		return {
			summary: `Formatted ${language}`,
			outputs: [{ type: "code", language, text: formatted }],
			data: { language },
		};
	},
};

export const compressionBenchmark: ToolRunner = {
	slug: "compression-benchmark",
	availability: "local",
	fields: [{ name: "in", label: "File to benchmark (≤50 MiB)", kind: "file", required: true }],
	async run({ values, onProgress, signal }) {
		const { benchmarkFile } = await import("@qbtools/engines/compression");
		const [input] = files(values, "in");
		if (!input) throw new Error("Provide a file via --in <file>.");
		const rows = await benchmarkFile(input, { onProgress, signal });
		return {
			summary: `Benchmarked ${rows.length} codecs on ${input.name} (${formatBytes(input.size)})`,
			outputs: [
				{
					type: "table",
					columns: ["Codec", "Level", "Compressed", "Ratio", "Time", "Verified"],
					rows: rows.map((row) => [
						row.label,
						row.extension,
						formatBytes(row.bytes),
						`${(row.ratio * 100).toFixed(1)}%`,
						`${row.ms.toFixed(1)} ms`,
						row.verified ? "✓" : "✗",
					]),
				},
			],
			data: { originalBytes: input.size, rows: rows.map(({ blob, ...row }) => row) },
		};
	},
};

export const developerRunners: ToolRunner[] = [codeFormatter, compressionBenchmark];
