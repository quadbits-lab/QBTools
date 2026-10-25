/**
 * The QBTools CLI wordmark — the hero logo.
 *
 * Letters are 10-pixel-tall bitmap outlines drawn from a glyph table, then
 * rendered at half resolution through the ▀/▄ pairing trick: each of the 5
 * output rows carries two pixel rows, so a two-tone grayscale gradient falls
 * down the letters (a solid pixel spanning both halves renders as ▀ with the
 * two shades, never as ▄/█, which could only ever show one). Achromatic by
 * design, like the rest of the console.
 *
 * Glyph widths vary (round letters six pixels, stems three) so the
 * proportions stay natural; the total width is derived from the table, never
 * hand-typed, and every output row spans it exactly.
 */

const GLYPH_HEIGHT = 10;

/** Bright → dark, one shade per pixel row (two shades per output row). */
const RAMP = [
	"#f2f2f2",
	"#e8e8e8",
	"#dcdcdc",
	"#d0d0d0",
	"#c4c4c4",
	"#a8a8a8",
	"#909090",
	"#787878",
	"#646464",
	"#525252",
] as const;

/** Width of the blank between words, in pixels. (Glyph gaps are one pixel.) */
const WORD_GAP = 3;

/** Ten rows each. `#` = ink, `.` = empty. */
const GLYPHS: Record<string, string[]> = {
	Q: [
		".####.",
		"#....#",
		"#....#",
		"#....#",
		"#....#",
		"#....#",
		"#....#",
		"#....#",
		".####.",
		"....##",
	],
	B: ["####.", "#...#", "#...#", "#...#", "####.", "#...#", "#...#", "#...#", "#...#", "####."],
	T: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", ".#.", ".#.", ".#.", ".#."],
	O: [
		".####.",
		"#....#",
		"#....#",
		"#....#",
		"#....#",
		"#....#",
		"#....#",
		"#....#",
		"#....#",
		".####.",
	],
	L: ["#...", "#...", "#...", "#...", "#...", "#...", "#...", "#...", "#...", "####"],
	S: [".###.", "#...#", "#....", "#....", ".###.", "....#", "....#", "#...#", "#...#", ".###."],
	C: [".###.", "#...#", "#....", "#....", "#....", "#....", "#....", "#....", "#...#", ".###."],
	I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
	" ": Array.from({ length: GLYPH_HEIGHT }, () => ".".repeat(WORD_GAP)),
};

export interface LogoRun {
	text: string;
	color?: string;
	background?: string;
}

interface Cell {
	char: string;
	color?: string;
	background?: string;
}

/** Output row → the two pixel rows it spans (pairing 10 pixel rows → 5). */
const PAIRS: Array<[number, number]> = Array.from({ length: GLYPH_HEIGHT / 2 }, (_, row) => [
	row * 2,
	row * 2 + 1,
]);

function inkOf(glyph: string[], row: number, column: number): boolean {
	return glyph[row]?.[column] === "#";
}

function cellOf(topInk: boolean, bottomInk: boolean, topRow: number, bottomRow: number): Cell {
	const topColor = RAMP[topRow];
	const bottomColor = RAMP[bottomRow];
	if (topInk && bottomInk) {
		return topColor === bottomColor
			? { char: "█", color: topColor }
			: { char: "▀", color: topColor, background: bottomColor };
	}
	if (topInk) return { char: "▀", color: topColor };
	if (bottomInk) return { char: "▄", color: bottomColor };
	return { char: " " };
}

function toRuns(cells: Cell[]): LogoRun[] {
	const runs: LogoRun[] = [];
	for (const item of cells) {
		const last = runs[runs.length - 1];
		if (
			last &&
			last.text.at(-1) === item.char &&
			last.color === item.color &&
			last.background === item.background
		) {
			last.text += item.char;
		} else {
			runs.push({ text: item.char, color: item.color, background: item.background });
		}
	}
	return runs;
}

/**
 * Compose the text into per-output-row cell grids. Each output row carries
 * two pixel rows; glyphs are separated by one blank pixel, words by
 * WORD_GAP blanks. Returns `undefined` for text outside the font.
 */
function cellsOf(text: string): Cell[][] | undefined {
	const glyphs = [...text.toUpperCase()].map((char) => GLYPHS[char]);
	const known = glyphs.filter((glyph) => glyph !== undefined);
	if (known.length !== glyphs.length) return undefined;
	const cells: Cell[][] = PAIRS.map(() => []);
	for (const [glyphIndex, glyph] of known.entries()) {
		const width = glyph[0]?.length ?? 0;
		for (const [pairRow, [rowA, rowB]] of PAIRS.entries()) {
			const row = cells[pairRow];
			if (!row) continue;
			for (let x = 0; x < width; x++) {
				row.push(cellOf(inkOf(glyph, rowA, x), inkOf(glyph, rowB, x), rowA, rowB));
			}
		}
		const trailing = glyphIndex === glyphs.length - 1 ? 0 : 1;
		if (trailing > 0) {
			for (const row of cells) row.push({ char: " " });
		}
	}
	return cells;
}

/** Render text in the pixel font as five uncolored rows (▀▄█ cells). */
export function renderWordmark(text: string): string[] {
	const cells = cellsOf(text);
	if (!cells) return [];
	return cells.map((row) => row.map((cell) => cell.char).join(""));
}

export const LOGO_TEXT = "QBTOOLS CLI";
export const LOGO_LINES = renderWordmark(LOGO_TEXT);
export const LOGO_WIDTH = LOGO_LINES[0]?.length ?? 0;
export const LOGO_HEIGHT = LOGO_LINES.length;
export const LOGO_ROWS: LogoRun[][] = cellsOf(LOGO_TEXT)?.map((cells) => toRuns(cells)) ?? [];
