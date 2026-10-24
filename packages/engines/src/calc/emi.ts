export interface EmiRow {
	month: number;
	payment: number;
	principal: number;
	interest: number;
	balance: number;
}

export interface EmiResult {
	emi: number;
	totalInterest: number;
	totalPayment: number;
	schedule: EmiRow[];
}

/**
 * EMI = P·r·(1+r)^n / ((1+r)^n − 1), r = monthly rate.
 * Returns null for non-positive principal or tenure.
 */
export function calculateEmi(
	principal: number,
	annualRatePct: number,
	months: number,
): EmiResult | null {
	if (!(principal > 0) || !(months >= 1) || !(annualRatePct >= 0)) return null;
	const n = Math.round(months);
	const r = annualRatePct / 12 / 100;
	const emi = r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);

	const schedule: EmiRow[] = [];
	let balance = principal;
	for (let month = 1; month <= n; month++) {
		const interest = balance * r;
		// Last row absorbs floating-point drift so the balance ends at exactly 0.
		const principalPart = month === n ? balance : emi - interest;
		balance = Math.max(0, balance - principalPart);
		schedule.push({
			month,
			payment: principalPart + interest,
			principal: principalPart,
			interest,
			balance,
		});
	}

	const totalPayment = schedule.reduce((sum, row) => sum + row.payment, 0);
	return { emi, totalInterest: totalPayment - principal, totalPayment, schedule };
}

/** Collapse a monthly schedule into yearly totals for compact display. */
export function yearlySchedule(schedule: EmiRow[]) {
	const years: { year: number; principal: number; interest: number; balance: number }[] = [];
	for (const row of schedule) {
		const year = Math.ceil(row.month / 12);
		const entry = years[year - 1] ?? { year, principal: 0, interest: 0, balance: 0 };
		entry.principal += row.principal;
		entry.interest += row.interest;
		entry.balance = row.balance;
		years[year - 1] = entry;
	}
	return years;
}
