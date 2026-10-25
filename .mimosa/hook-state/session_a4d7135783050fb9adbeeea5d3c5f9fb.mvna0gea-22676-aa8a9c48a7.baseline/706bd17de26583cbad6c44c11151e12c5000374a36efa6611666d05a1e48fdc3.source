import type { ToolDef } from "../types";

export const developerTools: ToolDef[] = [
	{
		slug: "code-formatter",
		category: "developer",
		name: "Code Formatter",
		title: "Code Formatter — Prettify JavaScript, JSON, CSS, SQL",
		tagline: "Tidy up code in a click, without sending it anywhere.",
		description:
			"Format JavaScript, TypeScript, JSON, CSS, HTML, Markdown, YAML and SQL, or minify JSON. Runs in your browser, so your code and secrets stay on your device.",
		icon: "braces",
		keywords: [
			"code formatter",
			"json formatter",
			"prettify code",
			"sql formatter",
			"format javascript online",
		],
		howTo: [
			{
				title: "Paste your code",
				text: "Paste code or drop a file. The language is picked from the file name.",
			},
			{
				title: "Choose your style",
				text: "Set spaces or tabs, indent size, line width, semicolons and quotes.",
			},
			{ title: "Format and copy", text: "Press Format, then copy the result or download it." },
		],
		about: {
			what: "Formatting rewrites whitespace, line breaks and quotes to a consistent style without changing what the code does. It uses the Prettier formatter for web languages and a dedicated formatter for SQL, entirely in your browser. Code with a syntax error is reported rather than guessed at.",
			when: [
				"You received minified JSON or JavaScript and need to read it.",
				"A query or config file needs consistent indentation before review.",
				"You want to tidy a snippet without pasting it into an online service.",
			],
		},
		faqs: [
			{
				q: "Is my code sent to a server?",
				a: "No. Formatting runs in your browser. Nothing is uploaded, so it is safe for code that contains keys or customer data. Still, never share real secrets.",
			},
			{
				q: "Which languages are supported?",
				a: "JavaScript, TypeScript, JSON, CSS, SCSS, Less, HTML, Markdown, YAML and SQL (standard, PostgreSQL, MySQL, SQLite and SQL Server).",
			},
			{
				q: "Why did it say my code couldn't be parsed?",
				a: "The formatter refuses code with syntax errors instead of guessing. Fix the error shown, such as a missing bracket or comma, and try again.",
			},
		],
		related: ["compression-benchmark", "case-converter", "hash-generator", "word-counter"],
		runtime: "browser",
		isNew: true,
	},
	{
		slug: "compression-benchmark",
		category: "developer",
		name: "Compression Benchmark",
		title: "Compression Benchmark — Gzip vs Brotli vs Zstandard",
		tagline: "See which compression shrinks your file the most.",
		description:
			"Compress a file with gzip, deflate, Brotli and Zstandard at several levels and compare size and speed. Everything runs in your browser and results are verified.",
		icon: "gauge",
		keywords: [
			"compression benchmark",
			"brotli vs gzip",
			"zstd compression online",
			"compare compression",
			"brotli compress online",
		],
		howTo: [
			{
				title: "Add a file",
				text: "Drop any file up to 50 MiB, such as a text, JSON, CSS or log file.",
			},
			{
				title: "Run the benchmark",
				text: "Each method compresses your file and is checked by decompressing it again.",
			},
			{
				title: "Compare and download",
				text: "Sort by size or speed and download any compressed result.",
			},
		],
		about: {
			what: "The benchmark runs gzip and deflate from your browser, and Brotli and Zstandard from WebAssembly, at low, medium and high levels. Each result is decompressed and compared with the original so the numbers can be trusted. Timings depend on your device and are best used to compare methods against each other.",
			when: [
				"You are choosing a compression setting for a website or API.",
				"You want to know if a log or data file will shrink enough to be worth archiving.",
				"You need a quick Brotli or Zstandard file without installing tools.",
			],
		},
		faqs: [
			{
				q: "Why are very high levels skipped for large files?",
				a: "Brotli quality 11 and Zstandard level 19 are slow. They run only on files up to 8 MiB and 16 MiB, so the page stays responsive.",
			},
			{
				q: "Why does my photo or video barely shrink?",
				a: "JPEG, MP4, ZIP and similar files are already compressed. Compression works best on text, code, JSON and logs.",
			},
			{
				q: "Is my file uploaded?",
				a: "No. Compression runs in your browser. Nothing is uploaded unless you choose Save to Media.",
			},
		],
		related: ["code-formatter", "compress-pdf", "compress-image", "file-encryptor"],
		runtime: "browser",
		isNew: true,
	},
];
