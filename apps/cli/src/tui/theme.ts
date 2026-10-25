/**
 * TUI theme — the Gemini-inspired palette.
 *
 * The values are the Default dark theme shipped by Google Gemini CLI
 * (packages/cli/src/ui/themes/theme.ts: Background #000000, Foreground #FFFFFF,
 * Gray #AFAFAF, DarkGray #878787, InputBackground #5F5F5F, AccentBlue #87AFFF,
 * AccentPurple #D7AFFF, AccentCyan #87D7D7, AccentGreen #D7FFD7,
 * AccentYellow #FFFFAF, AccentRed #FF87AF) plus its signature logo gradient
 * (#4796E4 → #847ACE → #C3677F). Structure is Gemini's semantic split:
 * text / border / surface / status / ui, so call sites say what a color means
 * instead of what it is.
 *
 * Copy sits on the terminal's own background, like Gemini's: white primary,
 * #AFAFAF secondary, #878787 muted. Chrome (panel frames, the prompt box) is
 * gray; the pastel accents are signal only. Two fills exist: gray chips
 * (#5F5F5F with white copy) and the one bright highlight slab (#87AFFF with
 * near-black copy) that marks the selected card, so the cursor out-glows the
 * dimmed UI around it.
 *
 * PALETTE is the closed set — every color in this file comes from it, and the
 * wordmark, mascot and category ramps are checked against it in tests.
 * Category accents are glyph/label/status only, like the web mapping in
 * apps/web/src/lib/icons.tsx.
 */

/** The closed palette. Every token below is one of these values. */
const BLACK = "#000000";
const WHITE = "#ffffff";
const GRAY = "#afafaf";
const DARK_GRAY = "#878787";
const LIGHT_GRAY = "#dadada";
const INPUT_GRAY = "#5f5f5f";
const ACCENT_BLUE = "#87afff";
const ACCENT_PURPLE = "#d7afff";
const ACCENT_CYAN = "#87d7d7";
const ACCENT_GREEN = "#d7ffd7";
const ACCENT_YELLOW = "#ffffaf";
const ACCENT_RED = "#ff87af";
const GRADIENT_BLUE = "#4796e4";
const GRADIENT_PURPLE = "#847ace";
const GRADIENT_ROSE = "#c3677f";

export const PALETTE = [
	BLACK,
	WHITE,
	GRAY,
	DARK_GRAY,
	LIGHT_GRAY,
	INPUT_GRAY,
	ACCENT_BLUE,
	ACCENT_PURPLE,
	ACCENT_CYAN,
	ACCENT_GREEN,
	ACCENT_YELLOW,
	ACCENT_RED,
	GRADIENT_BLUE,
	GRADIENT_PURPLE,
	GRADIENT_ROSE,
] as const;

/** Gemini's signature gradient, blue → purple → rose. */
export const GRADIENT = [GRADIENT_BLUE, GRADIENT_PURPLE, GRADIENT_ROSE] as const;

export const theme = {
	text: {
		/** Headings, values, event messages — the loudest copy. */
		primary: WHITE,
		/** Labels, hints, timestamps — the workhorse tone. */
		secondary: GRAY,
		/** Faint metadata, placeholders, disabled affordances. */
		muted: DARK_GRAY,
		/** Gemini's emphasis accent: zone gems, key commands, mode names. */
		accent: ACCENT_PURPLE,
		/** Gemini's active/link blue: prompt path, active markers, category names. */
		active: ACCENT_BLUE,
	},
	border: {
		/** Structural rails — Gemini's border.default. */
		default: DARK_GRAY,
		/** The hero and inspector frames. */
		strong: GRAY,
		/** The header details' divider rail — brighter than the frames over the dark bg. */
		divider: LIGHT_GRAY,
	},
	surface: {
		/** Chip fill — Gemini's input background, behind chips and the CLI line. */
		chip: INPUT_GRAY,
		/** Copy painted on the chip fill. */
		onChip: WHITE,
		/** The selected card's slab — the one bright fill in the console. */
		highlight: ACCENT_BLUE,
		/** Copy painted on the highlight fill (and on pastel status fills). */
		onHighlight: BLACK,
	},
	status: {
		/** Alive, local, success, the run button. */
		success: ACCENT_GREEN,
		/** Caution, optional dependencies, help/update tags. */
		warning: ACCENT_YELLOW,
		/** Danger, failures, destructive confirmation. */
		error: ACCENT_RED,
	},
	ui: {
		/** Technical symbols and info tags — Gemini's ui.symbol cyan. */
		symbol: ACCENT_CYAN,
		/** The wordmark ramp and the active category rule. */
		gradient: GRADIENT,
	},
} as const;

/** Registry category → hue, drawn from the Gemini accent family. */
export const CATEGORY_COLORS: Record<string, string> = {
	image: ACCENT_CYAN,
	pdf: ACCENT_RED,
	text: ACCENT_BLUE,
	calculators: ACCENT_YELLOW,
	generators: ACCENT_PURPLE,
	media: GRADIENT_PURPLE,
	security: ACCENT_GREEN,
	developer: GRADIENT_BLUE,
};

export function categoryColor(categoryId: string): string {
	return CATEGORY_COLORS[categoryId] ?? theme.text.active;
}
