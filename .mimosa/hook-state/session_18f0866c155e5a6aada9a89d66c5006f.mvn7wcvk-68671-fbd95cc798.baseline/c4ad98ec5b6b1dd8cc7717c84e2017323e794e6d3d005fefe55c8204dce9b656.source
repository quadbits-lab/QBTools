export interface AgeResult {
	years: number;
	months: number;
	days: number;
	totalDays: number;
	totalWeeks: number;
	totalMonths: number;
	nextBirthday: Date;
	daysToNextBirthday: number;
	bornOnWeekday: string;
}

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Parse "YYYY-MM-DD" as a UTC calendar date (no timezone drift). */
export function parseDateInput(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;
	const [, y, m, d] = match.map(Number) as [number, number, number, number];
	const date = new Date(Date.UTC(y, m - 1, d));
	return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
}

export function toDateInput(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number): number {
	return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addMonths(date: Date, count: number): Date {
	const year = date.getUTCFullYear() + Math.floor((date.getUTCMonth() + count) / 12);
	const month = (((date.getUTCMonth() + count) % 12) + 12) % 12;
	return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), daysInMonth(year, month))));
}

/** Birthday in `year`; 29 Feb falls back to 28 Feb in non-leap years. */
function birthdayIn(year: number, birth: Date): Date {
	const month = birth.getUTCMonth();
	const day = Math.min(birth.getUTCDate(), daysInMonth(year, month));
	return new Date(Date.UTC(year, month, day));
}

export function calculateAge(birth: Date, asOf: Date): AgeResult | null {
	if (asOf.getTime() < birth.getTime()) return null;

	// Whole months: the largest m where birth + m months (day clamped to the month's end) ≤ asOf.
	let totalMonths =
		(asOf.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
		asOf.getUTCMonth() -
		birth.getUTCMonth();
	if (addMonths(birth, totalMonths).getTime() > asOf.getTime()) totalMonths -= 1;
	const anchor = addMonths(birth, totalMonths);
	const years = Math.floor(totalMonths / 12);
	const months = totalMonths % 12;
	const days = Math.round((asOf.getTime() - anchor.getTime()) / DAY_MS);

	const totalDays = Math.round((asOf.getTime() - birth.getTime()) / DAY_MS);
	let nextBirthday = birthdayIn(asOf.getUTCFullYear(), birth);
	if (nextBirthday.getTime() <= asOf.getTime()) {
		nextBirthday = birthdayIn(asOf.getUTCFullYear() + 1, birth);
	}

	return {
		years,
		months,
		days,
		totalDays,
		totalWeeks: Math.floor(totalDays / 7),
		totalMonths,
		nextBirthday,
		daysToNextBirthday: Math.round((nextBirthday.getTime() - asOf.getTime()) / DAY_MS),
		bornOnWeekday: WEEKDAYS[birth.getUTCDay()] ?? "",
	};
}
