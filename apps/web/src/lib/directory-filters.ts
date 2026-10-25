/** Shared directory filter types and option lists (desktop toolbar + mobile sheet). */

export type DirectoryTag = "all" | "popular" | "browser" | "ai";
export type DirectorySort = "popular" | "name" | "category";

export const DIRECTORY_TAG_OPTIONS: ReadonlyArray<{ value: DirectoryTag; label: string }> = [
	{ value: "all", label: "All" },
	{ value: "popular", label: "Popular" },
	{ value: "browser", label: "Private" },
	{ value: "ai", label: "AI" },
];

export const DIRECTORY_SORT_OPTIONS: ReadonlyArray<{ value: DirectorySort; label: string }> = [
	{ value: "popular", label: "Popular" },
	{ value: "name", label: "A–Z" },
	{ value: "category", label: "Category" },
];
