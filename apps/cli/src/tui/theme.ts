/**
 * TUI theme — ported from packages/ui/src/theme.css (dark is the QBTools
 * default) so the terminal app matches the web app's monochrome design.
 * Category accents are icons/status only, exactly like the web mapping in
 * apps/web/src/lib/icons.tsx.
 */

export const theme = {
	bg: "#111111",
	fg: "#f8f8f8",
	card: "#1a1a1a",
	secondary: "#212121",
	muted: "#292929",
	textDim: "#b7b7b7",
	textSubtle: "#8f8f8f",
	border: "#191919",
	borderStrong: "#2e2e2e",
	input: "#373737",
	destructive: "#f87171",
	success: "#e5e5e5",
} as const;

export const accents = {
	emerald: "#34d399",
	rose: "#fb7185",
	indigo: "#818cf8",
	amber: "#fbbf24",
	violet: "#a78bfa",
	sky: "#38bdf8",
	teal: "#2dd4bf",
} as const;

export type AccentId = keyof typeof accents;

/** web (apps/web/src/lib/icons.tsx) → CLI accent, per registry category. */
export const CATEGORY_ACCENTS: Record<string, AccentId> = {
	image: "emerald",
	pdf: "rose",
	text: "indigo",
	calculators: "amber",
	generators: "violet",
	media: "sky",
	security: "teal",
	developer: "sky",
};

export function categoryAccent(categoryId: string): AccentId {
	return CATEGORY_ACCENTS[categoryId] ?? "indigo";
}