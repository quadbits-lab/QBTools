/** p% of x */
export function percentOf(percent: number, value: number): number {
	return (percent / 100) * value;
}

/** x is what % of y (null when y is 0). */
export function whatPercent(part: number, whole: number): number | null {
	return whole === 0 ? null : (part / whole) * 100;
}

/** % change from → to (null when from is 0). */
export function percentChange(from: number, to: number): number | null {
	return from === 0 ? null : ((to - from) / Math.abs(from)) * 100;
}

/** Round for display without trailing zeros: 12.5000 → "12.5". */
export function formatNumber(value: number, maxDecimals = 2): string {
	return new Intl.NumberFormat("en", { maximumFractionDigits: maxDecimals }).format(value);
}
