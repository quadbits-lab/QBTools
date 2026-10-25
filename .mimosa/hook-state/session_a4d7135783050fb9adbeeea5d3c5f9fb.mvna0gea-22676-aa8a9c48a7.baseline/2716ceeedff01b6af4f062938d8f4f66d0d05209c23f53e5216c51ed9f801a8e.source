import { LIMITS } from "../processing";

export const LANGUAGES = [
	{ id: "javascript", label: "JavaScript / JSX", extensions: ["js", "jsx", "mjs", "cjs"] },
	{ id: "typescript", label: "TypeScript / TSX", extensions: ["ts", "tsx", "mts", "cts"] },
	{ id: "json", label: "JSON", extensions: ["json", "jsonc"] },
	{ id: "css", label: "CSS", extensions: ["css"] },
	{ id: "scss", label: "SCSS", extensions: ["scss"] },
	{ id: "less", label: "Less", extensions: ["less"] },
	{ id: "html", label: "HTML", extensions: ["html", "htm"] },
	{ id: "markdown", label: "Markdown", extensions: ["md", "markdown"] },
	{ id: "yaml", label: "YAML", extensions: ["yml", "yaml"] },
	{ id: "sql", label: "SQL", extensions: ["sql"] },
] as const;
export type LanguageId = (typeof LANGUAGES)[number]["id"];
export const SQL_DIALECTS = [
	{ id: "sql", label: "Standard SQL" },
	{ id: "postgresql", label: "PostgreSQL" },
	{ id: "mysql", label: "MySQL" },
	{ id: "sqlite", label: "SQLite" },
	{ id: "transactsql", label: "SQL Server (T-SQL)" },
] as const;
export type SqlDialect = (typeof SQL_DIALECTS)[number]["id"];
export interface FormatSettings {
	language: LanguageId;
	indent: "spaces" | "tabs";
	/** Spaces per indent level, 2–8. */
	tabWidth: number;
	/** Preferred line width, 40–200. */
	printWidth: number;
	semicolons: boolean;
	singleQuote: boolean;
	sqlDialect: SqlDialect;
}
export const DEFAULT_SETTINGS: FormatSettings = {
	language: "javascript",
	indent: "spaces",
	tabWidth: 2,
	printWidth: 80,
	semicolons: true,
	singleQuote: false,
	sqlDialect: "sql",
};
export function languageForFilename(name: string): LanguageId | null {
	const extension = name.toLowerCase().split(".").pop() ?? "";
	return (
		LANGUAGES.find((item) => (item.extensions as readonly string[]).includes(extension))?.id ?? null
	);
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Prettier errors start with a one-line description followed by a code frame. */
export function friendlyError(error: unknown) {
	const message = error instanceof Error ? error.message : String(error);
	const first = message
		.split("\n")[0]
		?.replace(/^\w*Error:\s*/, "")
		.trim();
	return first ? `This code couldn't be parsed: ${first}` : "This code couldn't be parsed.";
}
type Plugin = unknown;
async function plugins(
	language: Exclude<LanguageId, "sql">,
): Promise<{ parser: string; plugins: Plugin[] }> {
	switch (language) {
		case "javascript":
			return {
				parser: "babel",
				plugins: [await import("prettier/plugins/babel"), await import("prettier/plugins/estree")],
			};
		case "typescript":
			return {
				parser: "typescript",
				plugins: [
					await import("prettier/plugins/typescript"),
					await import("prettier/plugins/estree"),
				],
			};
		case "json":
			return {
				parser: "json",
				plugins: [await import("prettier/plugins/babel"), await import("prettier/plugins/estree")],
			};
		case "css":
		case "scss":
		case "less":
			return { parser: language, plugins: [await import("prettier/plugins/postcss")] };
		case "html":
			return { parser: "html", plugins: [await import("prettier/plugins/html")] };
		case "markdown":
			return { parser: "markdown", plugins: [await import("prettier/plugins/markdown")] };
		case "yaml":
			return { parser: "yaml", plugins: [await import("prettier/plugins/yaml")] };
	}
}
/** Format source code. Throws an Error with a one-line message when it can't be parsed. */
export async function formatCode(source: string, input: Partial<FormatSettings> = {}) {
	const settings = { ...DEFAULT_SETTINGS, ...input };
	if (source.length > LIMITS.formatChars) throw new Error("Use 1,000,000 characters or fewer.");
	if (!source.trim()) throw new Error("Paste some code to format.");
	const tabWidth = clamp(Math.round(settings.tabWidth), 2, 8);
	try {
		if (settings.language === "sql") {
			const { format } = await import("sql-formatter");
			return format(source, {
				language: settings.sqlDialect,
				tabWidth,
				useTabs: settings.indent === "tabs",
				keywordCase: "upper",
			});
		}
		const { format } = await import("prettier/standalone");
		const { parser, plugins: loaded } = await plugins(settings.language);
		return await format(source, {
			parser,
			plugins: loaded as never,
			tabWidth,
			useTabs: settings.indent === "tabs",
			printWidth: clamp(Math.round(settings.printWidth), 40, 200),
			semi: settings.semicolons,
			singleQuote: settings.singleQuote,
		});
	} catch (error) {
		throw new Error(friendlyError(error));
	}
}
/** Remove all optional whitespace from JSON. */
export function minifyJson(source: string) {
	if (source.length > LIMITS.formatChars) throw new Error("Use 1,000,000 characters or fewer.");
	try {
		return JSON.stringify(JSON.parse(source));
	} catch (error) {
		throw new Error(friendlyError(error));
	}
}
