/** One recognised word with its box in pixels of the recognised image, origin top-left. */
export interface OcrWord {
	text: string;
	x0: number;
	y0: number;
	x1: number;
	y1: number;
	confidence: number;
}
export interface OcrLayout {
	text: string;
	words: OcrWord[];
}
interface BlockLike {
	paragraphs?: {
		lines?: {
			words?: {
				text: string;
				confidence: number;
				bbox: { x0: number; y0: number; x1: number; y1: number };
			}[];
		}[];
	}[];
}
/** Flatten tesseract's blocks → paragraphs → lines → words into reading-order words. */
export function flattenWords(blocks: BlockLike[] | null | undefined): OcrWord[] {
	const words: OcrWord[] = [];
	for (const block of blocks ?? [])
		for (const paragraph of block.paragraphs ?? [])
			for (const line of paragraph.lines ?? [])
				for (const word of line.words ?? []) {
					const text = word.text.trim();
					const { x0, y0, x1, y1 } = word.bbox;
					if (text && x1 > x0 && y1 > y0)
						words.push({ text, x0, y0, x1, y1, confidence: word.confidence });
				}
	return words;
}
