export type CategoryId = "image" | "pdf" | "text" | "calculators" | "generators" | "media" | "security";

/** Lucide icon name (kebab-case). The app maps names to components. */
export type IconName = string;

export interface Category {
	id: CategoryId;
	name: string;
	/** Short noun used in sentences: "image tools". */
	plural: string;
	tagline: string;
	description: string;
	icon: IconName;
}

export interface Faq {
	q: string;
	a: string;
}

export interface Step {
	title: string;
	text: string;
}

/**
 * A preset is an SEO landing page for one tool with options prefilled,
 * e.g. /tools/compress-image/to-100kb.
 */
export interface ToolPreset {
	slug: string;
	/** Page H1 and <title> stem: "Compress Image to 100KB". */
	title: string;
	description: string;
	/** One paragraph shown above the tool, unique per preset. */
	intro: string;
	keywords: string[];
	/** Passed to the widget as initial options. */
	params: Record<string, string | number | boolean>;
}

export type ToolRuntime = "browser" | "server-ai";

export interface ToolDef {
	slug: string;
	category: CategoryId;
	/** Short display name: "Compress Image". */
	name: string;
	/** SEO <title> stem. */
	title: string;
	/** One line under the H1. */
	tagline: string;
	/** Meta description (≤ 160 chars). */
	description: string;
	icon: IconName;
	keywords: string[];
	howTo: [Step, Step, Step];
	about: { what: string; when: string[] };
	faqs: Faq[];
	related: string[];
	runtime: ToolRuntime;
	presets?: ToolPreset[];
	/** Lower = more popular; tools with a rank appear in "Popular tools". */
	popular?: number;
	/** Shown on cards as a small badge. */
	isNew?: boolean;
}
