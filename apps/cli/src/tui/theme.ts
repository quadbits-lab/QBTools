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
	borderStrong: "#3a3a3a",
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

/** Vertical brightness ramp for the wordmark, top → bottom — monochrome grayscale. */
export const logoRamp = ["#f2f2f2", "#c9c9c9", "#a0a0a0", "#777777", "#525252"] as const;

/** Dark tint of each accent, used as the selected card's background fill. */
export const accentTints: Record<AccentId, string> = {
	emerald: "#0f2b20",
	rose: "#2b1520",
	indigo: "#191c33",
	amber: "#2a2110",
	violet: "#1f1830",
	sky: "#0f242e",
	teal: "#0e2a26",
};

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
