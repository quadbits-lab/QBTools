/**
 * The QBTools CLI wordmark.
 *
 * A 4×5 slab font, rendered from a glyph table rather than a hand-typed
 * string so the rows can never drift out of alignment. The console draws it
 * with a vertical brightness ramp to echo the beveled look of the wordmark.
 */

const GLYPH_HEIGHT = 5;

/** 4-wide × 5-tall cells. `#` is solid, ` ` is empty. */
const GLYPHS: Record<string, string[]> = {
	Q: ["####", "#  #", "#  #", "# ##", " ## "],
	B: ["####", "#  #", "####", "#  #", "####"],
	T: ["####", " #  ", " #  ", " #  ", " #  "],
	O: ["####", "#  #", "#  #", "#  #", "####"],
	L: ["#   ", "#   ", "#   ", "#   ", "####"],
	S: ["####", "#   ", "####", "   #", "####"],
	C: ["####", "#   ", "#   ", "#   ", "####"],
	I: ["####", " #  ", " #  ", " #  ", "####"],
};

const BLANK = ["    ", "    ", "    ", "    ", "    "];

/** Render text in the slab font. Spaces separate cells by one column. */
export function renderWordmark(text: string): string[] {
	const cells = [...text.toUpperCase()].map((char) => GLYPHS[char] ?? BLANK);
	const rows: string[] = [];
	for (let row = 0; row < GLYPH_HEIGHT; row++) {
		rows.push(cells.map((cell) => cell[row] ?? "    ").join(" "));
	}
	return rows;
}

export const LOGO_TEXT = "QBTOOLS CLI";
export const LOGO_LINES = renderWordmark(LOGO_TEXT);
export const LOGO_WIDTH = LOGO_LINES[0]?.length ?? 0;
export const LOGO_HEIGHT = LOGO_LINES.length;
