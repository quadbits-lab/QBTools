/**
 * The app logo — the pixel mascot, drawn at 13×12→13×10 so the rendered
 * block sits at a ~5/4 width:height ratio (5 terminal rows ≈ 10 width units,
 * so 13 columns land close to 5/4 on a typical terminal). `×` is the bright
 * tone, `-` a shaded tone and space is empty. Each output row paints its top
 * pixel as the upper half (`▀`) and its bottom pixel as the lower half (`▄`)
 * of one full block (`█`).
 *
 * Palette tones only: the mascot shares the wordmark's family — Gemini's
 * active blue for the solid body, its accent purple for shading — so the icon
 * reads as part of the console's palette.
 */

import { theme } from "../theme";

const BRIGHT = theme.text.active;
const SHADE = theme.text.accent;

/** `×` = bright tone, `-` = shaded tone, space = empty. */
const ART: string[] = [
	"        ----×",
	"       ----××",
	"      ---××××",
	"     ---×××××",
	"××××- -××××××",
	"×××-  --×××××",
	" ××××----    ",
	"  ××××----   ",
	"   ×××----   ",
	"    ×----    ",
];

/** Output row → the two art rows it spans (even pairing, 10 rows → 5). */
const PAIRS: Array<[number, number]> = [
	[0, 1],
	[2, 3],
	[4, 5],
	[6, 7],
	[8, 9],
];

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

const WIDTH = Math.max(...ART.map((line) => line.length));

function pixel(row: number, column: number): string {
	return ART[row]?.[column] ?? " ";
}

function colorOf(pixelChar: string): string | undefined {
	if (pixelChar === "×") return BRIGHT;
	if (pixelChar === "-") return SHADE;
	return undefined;
}

function cell(top: string, bottom: string): Cell {
	const topColor = colorOf(top);
	const bottomColor = colorOf(bottom);
	if (topColor && bottomColor) {
		return topColor === bottomColor
			? { char: "█", color: topColor }
			: { char: "▀", color: topColor, background: bottomColor };
	}
	if (topColor) return { char: "▀", color: topColor };
	if (bottomColor) return { char: "▄", color: bottomColor };
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

export const LOGO_ICON_ROWS: LogoRun[][] = PAIRS.map(([top, bottom]) =>
	toRuns(
		Array.from({ length: WIDTH }, (_, column) => cell(pixel(top, column), pixel(bottom, column))),
	),
);

export const LOGO_ICON_WIDTH = WIDTH;
export const LOGO_ICON_HEIGHT = PAIRS.length;
