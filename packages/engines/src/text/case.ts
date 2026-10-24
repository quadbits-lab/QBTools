export type CaseMode =
	| "upper"
	| "lower"
	| "sentence"
	| "title"
	| "capitalized"
	| "alternating"
	| "inverse"
	| "camel"
	| "pascal"
	| "snake"
	| "kebab"
	| "constant";

export const caseModes: { mode: CaseMode; label: string; example: string }[] = [
	{ mode: "sentence", label: "Sentence case", example: "Hello world. How are you?" },
	{ mode: "lower", label: "lowercase", example: "hello world" },
	{ mode: "upper", label: "UPPERCASE", example: "HELLO WORLD" },
	{ mode: "title", label: "Title Case", example: "The Lord of the Rings" },
	{ mode: "capitalized", label: "Capitalized Case", example: "The Lord Of The Rings" },
	{ mode: "alternating", label: "aLtErNaTiNg", example: "hElLo wOrLd" },
	{ mode: "inverse", label: "iNVERSE", example: "hELLO wORLD" },
	{ mode: "camel", label: "camelCase", example: "helloWorld" },
	{ mode: "pascal", label: "PascalCase", example: "HelloWorld" },
	{ mode: "snake", label: "snake_case", example: "hello_world" },
	{ mode: "kebab", label: "kebab-case", example: "hello-world" },
	{ mode: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
];

const MINOR_WORDS = new Set(
	"a an and as at but by en for if in nor of on or per the to v vs via with from into over".split(
		" ",
	),
);

const upperFirst = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** Split identifiers and prose into words: "helloWorld_foo-bar" → hello, World, foo, bar */
function identifierWords(text: string): string[] {
	return text
		.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
		.replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);
}

export function convertCase(text: string, mode: CaseMode): string {
	switch (mode) {
		case "upper":
			return text.toUpperCase();
		case "lower":
			return text.toLowerCase();
		case "sentence":
			return text
				.toLowerCase()
				.replace(
					/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu,
					(_, prefix: string, letter: string) => prefix + letter.toUpperCase(),
				)
				.replace(/\bi\b/g, "I");
		case "capitalized":
			return text
				.toLowerCase()
				.replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, (_, p: string, l: string) => p + l.toUpperCase());
		case "title": {
			let index = 0;
			return text
				.toLowerCase()
				.replace(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu, (word, offset: number, whole: string) => {
					const isFirst = index++ === 0;
					const afterColon = /[:—–-]\s*$/.test(whole.slice(0, offset));
					return isFirst || afterColon || !MINOR_WORDS.has(word) ? upperFirst(word) : word;
				});
		}
		case "alternating": {
			let i = 0;
			return [...text]
				.map((ch) => (/\p{L}/u.test(ch) ? (i++ % 2 ? ch.toUpperCase() : ch.toLowerCase()) : ch))
				.join("");
		}
		case "inverse":
			return [...text]
				.map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()))
				.join("");
		case "camel":
			return identifierWords(text)
				.map((w, i) => (i === 0 ? w.toLowerCase() : upperFirst(w.toLowerCase())))
				.join("");
		case "pascal":
			return identifierWords(text)
				.map((w) => upperFirst(w.toLowerCase()))
				.join("");
		case "snake":
			return identifierWords(text)
				.map((w) => w.toLowerCase())
				.join("_");
		case "kebab":
			return identifierWords(text)
				.map((w) => w.toLowerCase())
				.join("-");
		case "constant":
			return identifierWords(text)
				.map((w) => w.toUpperCase())
				.join("_");
	}
}
