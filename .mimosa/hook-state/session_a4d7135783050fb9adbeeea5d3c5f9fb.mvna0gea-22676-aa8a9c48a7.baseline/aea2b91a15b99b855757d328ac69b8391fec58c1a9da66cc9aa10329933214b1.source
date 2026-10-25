import { describe, expect, test } from "bun:test";
import {
	calculateAge,
	calculateBmi,
	calculateCgpa,
	calculateEmi,
	calculateGpa,
	feetInchesToCm,
	lbToKg,
	parseDateInput,
	percentChange,
	percentOf,
	whatPercent,
	yearlySchedule,
} from "./index";

const d = (s: string) => {
	const date = parseDateInput(s);
	if (!date) throw new Error(s);
	return date;
};

describe("age", () => {
	test("parses valid dates and rejects impossible ones", () => {
		expect(parseDateInput("2024-02-29")).not.toBeNull();
		expect(parseDateInput("2023-02-29")).toBeNull();
		expect(parseDateInput("not a date")).toBeNull();
	});

	test("exact years months days", () => {
		const age = calculateAge(d("1990-05-15"), d("2026-10-24"));
		expect(age).toMatchObject({ years: 36, months: 5, days: 9 });
	});

	test("borrows days from the previous month", () => {
		const age = calculateAge(d("2000-01-31"), d("2000-03-01"));
		expect(age).toMatchObject({ years: 0, months: 1, days: 1 });
	});

	test("birthday today means next birthday is in a year", () => {
		const age = calculateAge(d("2000-10-24"), d("2026-10-24"));
		expect(age?.years).toBe(26);
		expect(age?.daysToNextBirthday).toBe(365);
	});

	test("29 Feb birthday falls back to 28 Feb", () => {
		const age = calculateAge(d("2004-02-29"), d("2025-01-01"));
		expect(age?.nextBirthday.toISOString().slice(0, 10)).toBe("2025-02-28");
	});

	test("future birth date returns null", () => {
		expect(calculateAge(d("2030-01-01"), d("2026-01-01"))).toBeNull();
	});

	test("weekday", () => {
		expect(calculateAge(d("2000-01-01"), d("2026-01-01"))?.bornOnWeekday).toBe("Saturday");
	});
});

describe("emi", () => {
	test("standard loan", () => {
		const result = calculateEmi(1_000_000, 8.5, 240);
		expect(result?.emi).toBeCloseTo(8678.23, 1);
		expect(result?.schedule).toHaveLength(240);
		expect(result?.schedule.at(-1)?.balance).toBe(0);
		expect(result?.totalPayment).toBeCloseTo((result?.emi ?? 0) * 240, 0);
	});

	test("zero interest", () => {
		const result = calculateEmi(12_000, 0, 12);
		expect(result?.emi).toBe(1000);
		expect(result?.totalInterest).toBeCloseTo(0, 6);
	});

	test("invalid input", () => {
		expect(calculateEmi(0, 10, 12)).toBeNull();
		expect(calculateEmi(1000, 10, 0)).toBeNull();
	});

	test("yearly schedule sums to principal", () => {
		const result = calculateEmi(500_000, 9, 60);
		const years = yearlySchedule(result?.schedule ?? []);
		expect(years).toHaveLength(5);
		expect(years.reduce((s, y) => s + y.principal, 0)).toBeCloseTo(500_000, 4);
	});
});

describe("percentage", () => {
	test("modes", () => {
		expect(percentOf(20, 150)).toBe(30);
		expect(whatPercent(45, 60)).toBe(75);
		expect(percentChange(80, 100)).toBe(25);
		expect(percentChange(100, 80)).toBe(-20);
		expect(whatPercent(1, 0)).toBeNull();
		expect(percentChange(0, 5)).toBeNull();
	});
});

describe("gpa", () => {
	test("weighted by credits", () => {
		const result = calculateGpa([
			{ credits: 3, points: 4 },
			{ credits: 4, points: 3 },
			{ credits: 2, points: 2 },
		]);
		expect(result?.gpa).toBeCloseTo(28 / 9, 6);
		expect(result?.totalCredits).toBe(9);
	});

	test("cgpa combines semesters", () => {
		const semester = calculateGpa([{ credits: 20, points: 3 }]);
		if (!semester) throw new Error("no gpa");
		expect(calculateCgpa(4, 20, semester)).toBe(3.5);
		expect(calculateCgpa(4, 0, semester)).toBe(3);
	});

	test("no credits", () => {
		expect(calculateGpa([{ credits: 0, points: 4 }])).toBeNull();
	});
});

describe("bmi", () => {
	test("metric", () => {
		const result = calculateBmi(70, 175);
		expect(result?.bmi).toBeCloseTo(22.86, 2);
		expect(result?.category).toBe("healthy");
		expect(result?.healthyMinKg).toBeCloseTo(56.66, 1);
	});

	test("categories", () => {
		expect(calculateBmi(50, 180)?.category).toBe("underweight");
		expect(calculateBmi(90, 180)?.category).toBe("overweight");
		expect(calculateBmi(110, 180)?.category).toBe("obese");
	});

	test("imperial conversions", () => {
		expect(lbToKg(154)).toBeCloseTo(69.85, 2);
		expect(feetInchesToCm(5, 9)).toBeCloseTo(175.26, 2);
	});
});
