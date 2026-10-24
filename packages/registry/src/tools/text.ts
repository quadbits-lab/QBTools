import type { ToolDef } from "../types";

export const textTools: ToolDef[] = [
	{
		slug: "extract-text",
		category: "text",
		name: "Image & PDF to Text",
		title: "Image & PDF to Text — Private OCR Online",
		tagline: "Read text from images and scanned documents.",
		description:
			"Extract English and Arabic text from images and PDFs on your device. Read scanned pages with OCR, edit the result and download a text file.",
		icon: "scan-text",
		keywords: ["OCR", "image to text", "PDF to text", "Arabic OCR", "scanned PDF"],
		howTo: [
			{ title: "Choose a file", text: "Add an image or PDF up to 50 MiB and 50 pages." },
			{ title: "Choose language", text: "Select English, Arabic or both, then extract text." },
			{
				title: "Review and save",
				text: "Check recognition results, edit them, copy or download TXT.",
			},
		],
		about: {
			what: "Existing PDF text is extracted directly. Scanned pages and images use local OCR without uploading document contents.",
			when: [
				"Copying text from a scan.",
				"Reading Arabic and English documents.",
				"Turning a photo into editable text.",
			],
		},
		faqs: [
			{
				q: "Is my document uploaded?",
				a: "No. The engine and language files download to your browser; your document stays on your device.",
			},
			{
				q: "Can OCR make mistakes?",
				a: "Yes. Review the result, especially with small text, handwriting or low-quality scans.",
			},
			{
				q: "Which limits apply?",
				a: "Files up to 50 MiB, PDFs up to 50 pages and images up to 24 megapixels. Device memory may impose lower limits.",
			},
		],
		related: ["word-counter", "compress-pdf", "image-to-pdf"],
		runtime: "browser",
		isNew: true,
	},
	{
		slug: "word-counter",
		category: "text",
		name: "Word Counter",
		title: "Word Counter — Count Words, Characters & Reading Time",
		tagline: "Live word, character, sentence and reading-time counts.",
		description:
			"Count words, characters, sentences and paragraphs as you type, plus reading time and top keywords. Free and private.",
		icon: "letters",
		keywords: [
			"word counter",
			"character counter",
			"count words",
			"letter count",
			"reading time",
			"essay word count",
		],
		howTo: [
			{ title: "Type or paste", text: "Paste your essay, post or message into the box." },
			{ title: "Read the counts", text: "Words, characters and more update as you type." },
			{ title: "Check limits", text: "Set a target to see how close you are to a word limit." },
		],
		about: {
			what: "The word counter instantly measures your text: words, characters with and without spaces, sentences, paragraphs, reading and speaking time, and the words you use most.",
			when: [
				"Writing an essay or assignment with a word limit.",
				"Keeping a social post under a character limit.",
				"Checking how long a speech will take to read.",
			],
		},
		faqs: [
			{
				q: "Is my text saved anywhere?",
				a: "No. Counting happens in your browser and your text is never sent to us.",
			},
			{
				q: "How is reading time calculated?",
				a: "We use an average of 238 words per minute for reading and 140 for speaking aloud.",
			},
		],
		related: ["case-converter", "grammar-checker", "paraphrasing-tool"],
		runtime: "browser",
		popular: 8,
	},
	{
		slug: "case-converter",
		category: "text",
		name: "Case Converter",
		title: "Case Converter — UPPERCASE, lowercase, Title Case & more",
		tagline: "Fix capital letters in one tap.",
		description:
			"Convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case and kebab-case instantly. Free.",
		icon: "case-sensitive",
		keywords: [
			"case converter",
			"uppercase",
			"lowercase",
			"title case",
			"sentence case",
			"camelcase",
			"snake case",
			"capitalize",
		],
		howTo: [
			{ title: "Paste text", text: "Type or paste the text you want to change." },
			{ title: "Pick a style", text: "Tap a button like Title Case or UPPERCASE." },
			{ title: "Copy", text: "Copy the result with one tap." },
		],
		about: {
			what: "The case converter rewrites the capital letters in your text. It's handy when you typed with Caps Lock on, need a proper headline, or need variable names for code.",
			when: [
				"You accidentally typed with CAPS LOCK on.",
				"You need a headline in Title Case.",
				"You're a developer converting names to camelCase or snake_case.",
			],
		},
		faqs: [
			{
				q: "What is Title Case?",
				a: "Each major word starts with a capital letter, while small words like “and” or “of” stay lowercase.",
			},
			{
				q: "What is Sentence case?",
				a: "Only the first letter of each sentence is capitalized, like normal writing.",
			},
		],
		related: ["word-counter", "grammar-checker", "paraphrasing-tool"],
		runtime: "browser",
	},
	{
		slug: "grammar-checker",
		category: "text",
		name: "Grammar Helper",
		title: "Free Grammar Checker — Fix Spelling & Grammar",
		tagline: "Fix spelling, grammar and punctuation in seconds.",
		description:
			"Paste your text and get corrected spelling, grammar and punctuation with a clear list of changes. Free AI grammar helper, no signup.",
		icon: "spell-check",
		keywords: [
			"grammar checker",
			"spell check",
			"fix grammar",
			"punctuation checker",
			"proofread",
			"correct english",
		],
		howTo: [
			{ title: "Paste your text", text: "Add up to 5,000 characters — an email, essay or post." },
			{ title: "Tap Check", text: "Our AI helper fixes mistakes and explains each change." },
			{ title: "Copy the result", text: "Review the corrections and copy the clean version." },
		],
		about: {
			what: "The grammar helper uses AI to correct spelling, grammar and punctuation while keeping your meaning and tone. It lists what changed so you can learn from it.",
			when: [
				"Before sending an important email or application.",
				"Checking homework or an essay.",
				"Writing in English as a second language.",
			],
		},
		faqs: [
			{
				q: "Is my text stored?",
				a: "Your text is sent securely to our AI provider to be checked and isn't saved by QBTools.",
			},
			{
				q: "Is there a length limit?",
				a: "Each check can be up to 5,000 characters. Split longer documents into parts.",
			},
			{
				q: "Can it make mistakes?",
				a: "Yes — AI is very good but not perfect. Always read the result before using it.",
			},
		],
		related: ["paraphrasing-tool", "word-counter", "case-converter"],
		runtime: "server-ai",
	},
	{
		slug: "paraphrasing-tool",
		category: "text",
		name: "Paraphrase Helper",
		title: "Paraphrasing Tool — Rewrite Sentences Free",
		tagline: "Say the same thing in fresh words and the tone you want.",
		description:
			"Rewrite sentences and paragraphs in a simple, formal, friendly or shorter style. Free AI paraphrasing helper with no signup.",
		icon: "wand-sparkles",
		keywords: [
			"paraphrasing tool",
			"paraphrase",
			"rewrite sentences",
			"reword",
			"rephrase",
			"simplify text",
		],
		howTo: [
			{ title: "Paste your text", text: "Add the sentence or paragraph you want to rewrite." },
			{ title: "Choose a style", text: "Pick Simple, Formal, Friendly or Shorter." },
			{ title: "Copy", text: "Read the new version and copy it." },
		],
		about: {
			what: "The paraphrase helper rewrites your text with new wording while keeping the meaning. Use it to make writing clearer, more formal, friendlier or shorter.",
			when: [
				"Making a hard paragraph easier to understand.",
				"Turning a casual note into a formal email.",
				"Shortening text to fit a limit.",
			],
		},
		faqs: [
			{
				q: "Can I use this for school work?",
				a: "Use it to understand and improve your own writing. Always follow your school's rules about AI tools and cite your sources.",
			},
			{
				q: "Is my text private?",
				a: "Text is sent securely to our AI provider for rewriting and isn't stored by QBTools.",
			},
		],
		related: ["grammar-checker", "word-counter", "case-converter"],
		runtime: "server-ai",
	},
];
