export interface TextStats {
	words: number;
	characters: number;
	charactersNoSpaces: number;
	sentences: number;
	paragraphs: number;
	lines: number;
	readingMinutes: number;
	speakingMinutes: number;
	averageWordLength: number;
	longestWord: string;
	topKeywords: { word: string; count: number; density: number }[];
}

export const READING_WPM = 238;
export const SPEAKING_WPM = 140;

const KEYWORD_STOPWORDS = new Set(
	"a an and are as at be but by for from has have he her his i in is it its me my of on or our she so that the their them they this to was we were what when which who will with you your not do does did can just than then there these those been being into out up about if no yes all any".split(
		" ",
	),
);

const WORD_RE = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function textStats(text: string, keywordLimit = 8): TextStats {
	const words = text.match(WORD_RE) ?? [];
	const trimmed = text.trim();
	const sentences = trimmed
		? (trimmed.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/gu) ?? []).filter((s) =>
				/[\p{L}\p{N}]/u.test(s),
			).length
		: 0;
	const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;

	const counts = new Map<string, number>();
	for (const word of words) {
		const key = word.toLowerCase();
		if (key.length < 3 || KEYWORD_STOPWORDS.has(key) || /^\d+$/.test(key)) continue;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	const topKeywords = [...counts.entries()]
		.filter(([, count]) => count > 1)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, keywordLimit)
		.map(([word, count]) => ({ word, count, density: (count / words.length) * 100 }));

	const graphemes = [...text].length;
	return {
		words: words.length,
		characters: graphemes,
		charactersNoSpaces: [...text.replace(/\s/g, "")].length,
		sentences,
		paragraphs,
		lines: text ? text.split("\n").length : 0,
		readingMinutes: words.length / READING_WPM,
		speakingMinutes: words.length / SPEAKING_WPM,
		averageWordLength: words.length ? words.reduce((s, w) => s + w.length, 0) / words.length : 0,
		longestWord: words.reduce((longest, w) => (w.length > longest.length ? w : longest), ""),
		topKeywords,
	};
}

/** "0 min", "45 sec", "3 min 20 sec" */
export function formatDuration(minutes: number): string {
	const totalSeconds = Math.round(minutes * 60);
	if (totalSeconds === 0) return "0 sec";
	if (totalSeconds < 60) return `${totalSeconds} sec`;
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return s ? `${m} min ${s} sec` : `${m} min`;
}
