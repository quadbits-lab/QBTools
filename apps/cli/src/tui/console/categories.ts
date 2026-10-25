/**
 * Category short codes — the console speaks in the same terse vocabulary as
 * the tool slugs (`img:compress-image`), and the filter chips read the same
 * way (`.img`, `.pdf`, `.txt`).
 */

export const CATEGORY_CODES: Record<string, string> = {
	image: "img",
	pdf: "pdf",
	text: "txt",
	calculators: "calc",
	generators: "gen",
	media: "media",
	security: "sec",
	developer: "dev",
};

export function categoryCode(categoryId: string): string {
	return CATEGORY_CODES[categoryId] ?? categoryId.slice(0, 3);
}

/** "img:compress-image" — the key shown in the tool list. */
export function toolKey(categoryId: string, slug: string): string {
	return `${categoryCode(categoryId)}:${slug}`;
}
