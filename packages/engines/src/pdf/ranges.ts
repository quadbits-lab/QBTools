/**
 * Parse "1-3, 5, 8-" into zero-based page indexes (in order, de-duplicated).
 * Throws a friendly Error for invalid input.
 */
export function parsePageRanges(input: string, pageCount: number): number[] {
	const result: number[] = [];
	const seen = new Set<number>();
	const parts = input
		.split(/[,;\s]+/)
		.map((p) => p.trim())
		.filter(Boolean);
	if (parts.length === 0) throw new Error("Type the pages you want, like 1-3, 5.");
	for (const part of parts) {
		const match = /^(\d*)\s*[-–]\s*(\d*)$/.exec(part) ?? /^(\d+)$/.exec(part);
		if (!match) throw new Error(`“${part}” isn't a page or range. Use numbers like 2 or 4-7.`);
		const isRange = part.includes("-") || part.includes("–");
		const start = match[1] ? Number(match[1]) : 1;
		const end = isRange ? (match[2] ? Number(match[2]) : pageCount) : start;
		if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
			throw new Error(`This PDF has ${pageCount} pages — “${part}” is outside that.`);
		}
		const [from, to] = start <= end ? [start, end] : [end, start];
		for (let page = from; page <= to; page++) {
			if (!seen.has(page)) {
				seen.add(page);
				result.push(page - 1);
			}
		}
	}
	return result;
}
