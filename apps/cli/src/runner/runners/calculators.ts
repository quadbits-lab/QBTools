/** Calculator runners: age, BMI, EMI, GPA, percentage — all pure engines. */

import {
	calculateAge,
	calculateBmi,
	calculateCgpa,
	calculateEmi,
	calculateGpa,
	formatNumber,
	gradeScales,
	parseDateInput,
	percentChange,
	percentOf,
	whatPercent,
	yearlySchedule,
	type AgeResult,
} from "@qbtools/engines/calc";
import { num, requireString, str, type ToolRunner } from "../types";

function ageOutputs(age: AgeResult) {
	return {
		summary: `${age.years} years, ${age.months} months, ${age.days} days`,
		table: [
			["Years / months / days", `${age.years} / ${age.months} / ${age.days}`],
			["Total months", String(age.totalMonths)],
			["Total weeks", String(age.totalWeeks)],
			["Total days", String(age.totalDays)],
			["Born on a", age.bornOnWeekday],
			["Next birthday", `${age.nextBirthday.toISOString().slice(0, 10)} (${age.daysToNextBirthday} days)`],
		] as string[][],
	};
}

export const ageCalculator: ToolRunner = {
	slug: "age-calculator",
	availability: "local",
	stdinField: "birth",
	fields: [
		{ name: "birth", label: "Date of birth (YYYY-MM-DD)", kind: "text", required: true, placeholder: "1995-06-15" },
		{ name: "asof", label: "Age as of (YYYY-MM-DD)", kind: "text", placeholder: "defaults to today" },
	],
	async run({ values }) {
		const birth = parseDateInput(requireString(values, "birth", "date of birth"));
		if (!birth) throw new Error("Birth date must be YYYY-MM-DD.");
		const asOfRaw = str(values, "asof").trim();
		const asOf = asOfRaw ? parseDateInput(asOfRaw) : null;
		if (asOfRaw && !asOf) throw new Error("As-of date must be YYYY-MM-DD.");
		const age = calculateAge(birth, asOf ?? new Date());
		if (!age) throw new Error("The birth date is in the future.");
		const { summary, table } = ageOutputs(age);
		return {
			summary,
			outputs: [{ type: "table", columns: ["Metric", "Value"], rows: table }],
			data: { ...age, nextBirthday: age.nextBirthday.toISOString().slice(0, 10) },
		};
	},
};

export const bmiCalculator: ToolRunner = {
	slug: "bmi-calculator",
	availability: "local",
	fields: [
		{ name: "weight", label: "Weight (kg)", kind: "number", required: true, min: 1, max: 1000 },
		{ name: "height", label: "Height (cm)", kind: "number", required: true, min: 30, max: 300 },
	],
	async run({ values }) {
		const result = calculateBmi(num(values, "weight", 0), num(values, "height", 0));
		if (!result) throw new Error("Enter a realistic weight and height.");
		return {
			summary: `BMI ${result.value.toFixed(1)} — ${result.category}`,
			outputs: [
				{
					type: "table",
					columns: ["Metric", "Value"],
					rows: [
						["BMI", result.value.toFixed(1)],
						["Category", result.category],
						["Healthy range", "18.5 – 24.9"],
					],
				},
			],
			data: result,
		};
	},
};

export const emiCalculator: ToolRunner = {
	slug: "emi-calculator",
	availability: "local",
	fields: [
		{ name: "principal", label: "Loan amount", kind: "number", required: true, min: 1 },
		{ name: "rate", label: "Annual interest rate (%)", kind: "number", required: true, min: 0, max: 100 },
		{ name: "months", label: "Tenure (months)", kind: "number", required: true, min: 1, max: 1200 },
	],
	async run({ values }) {
		const result = calculateEmi(
			num(values, "principal", 0),
			num(values, "rate", 0),
			num(values, "months", 0),
		);
		if (!result) throw new Error("Principal and tenure must be positive.");
		const years = yearlySchedule(result.schedule);
		return {
			summary: `EMI ${formatNumber(result.emi)} · total interest ${formatNumber(result.totalInterest)}`,
			outputs: [
				{
					type: "table",
					columns: ["Metric", "Value"],
					rows: [
						["Monthly EMI", formatNumber(result.emi)],
						["Total interest", formatNumber(result.totalInterest)],
						["Total payment", formatNumber(result.totalPayment)],
					],
				},
				{
					type: "table",
					columns: ["Year", "Principal", "Interest", "Balance"],
					rows: years.map(
						(row) =>
							[
								String(row.year),
								formatNumber(row.principal),
								formatNumber(row.interest),
								formatNumber(row.balance),
							] as string[],
					),
				},
			],
			data: {
				emi: result.emi,
				totalInterest: result.totalInterest,
				totalPayment: result.totalPayment,
				months: result.schedule.length,
			},
		};
	},
};

export const gpaCalculator: ToolRunner = {
	slug: "gpa-calculator",
	availability: "local",
	fields: [
		{
			name: "scale",
			label: "Grade scale",
			kind: "select",
			default: "4",
			options: [
				{ label: "4.0 scale (A=4)", value: "4" },
				{ label: "10.0 scale", value: "10" },
			],
		},
		{
			name: "courses",
			label: "Courses as credits:points pairs, comma separated",
			kind: "text",
			required: true,
			placeholder: "3:3.7,4:4.0,2:3.0",
		},
		{ name: "prevGpa", label: "Previous CGPA (optional)", kind: "number" },
		{ name: "prevCredits", label: "Previous credits (optional)", kind: "number" },
	],
	async run({ values }) {
		const scaleId = (str(values, "scale", "4") === "10" ? "10" : "4") as "4" | "10";
		const scale = gradeScales[scaleId];
		const raw = requireString(values, "courses", "courses");
		const pairs = raw.split(",").map((part) => part.trim()).filter(Boolean);
		const courses = [];
		for (const pair of pairs) {
			const [creditsText, pointsText] = pair.split(":");
			const credits = Number(creditsText);
			const points = Number(pointsText);
			if (!Number.isFinite(credits) || !Number.isFinite(points) || credits <= 0) {
				throw new Error(`Couldn't parse "${pair}" — use credits:points like 3:3.7`);
			}
			if (points < scale.min || points > scale.max) {
				throw new Error(`Points ${points} are outside the ${scale.max}-point scale.`);
			}
			courses.push({ credits, points });
		}
		const semester = calculateGpa(courses);
		if (!semester) throw new Error("Enter at least one course with credits.");
		const prevGpa = num(values, "prevGpa", Number.NaN);
		const prevCredits = num(values, "prevCredits", 0);
		const cgpa =
			Number.isFinite(prevGpa) && prevCredits > 0
				? calculateCgpa(prevGpa, prevCredits, semester)
				: null;
		return {
			summary: `GPA ${semester.gpa.toFixed(2)} / ${scale.max}`,
			outputs: [
				{
					type: "table",
					columns: ["Metric", "Value"],
					rows: [
						["GPA", `${semester.gpa.toFixed(2)} / ${scale.max}`],
						["Credits", String(semester.totalCredits)],
						["Quality points", String(semester.qualityPoints)],
						...(cgpa !== null ? [["CGPA", cgpa.toFixed(2)]] : []),
					],
				},
			],
			data: { ...semester, cgpa },
		};
	},
};

export const percentageCalculator: ToolRunner = {
	slug: "percentage-calculator",
	availability: "local",
	fields: [
		{
			name: "mode",
			label: "Calculation",
			kind: "select",
			default: "of",
			options: [
				{ label: "X% of Y", value: "of" },
				{ label: "X is what % of Y", value: "what" },
				{ label: "% change from X to Y", value: "change" },
			],
		},
		{ name: "x", label: "X", kind: "number", required: true },
		{ name: "y", label: "Y", kind: "number", required: true },
	],
	async run({ values }) {
		const mode = str(values, "mode", "of");
		const x = num(values, "x", 0);
		const y = num(values, "y", 0);
		if (mode === "of") {
			const result = percentOf(x, y);
			return {
				summary: `${formatNumber(x)}% of ${formatNumber(y)} = ${formatNumber(result)}`,
				outputs: [{ type: "text", text: `${formatNumber(x)}% of ${formatNumber(y)} is ${formatNumber(result)}` }],
				data: { result },
			};
		}
		if (mode === "what") {
			const result = whatPercent(x, y);
			if (result === null) throw new Error("Y must not be zero for this calculation.");
			return {
				summary: `${formatNumber(x)} is ${formatNumber(result)}% of ${formatNumber(y)}`,
				outputs: [{ type: "text", text: `${formatNumber(x)} is ${formatNumber(result)}% of ${formatNumber(y)}` }],
				data: { result },
			};
		}
		const change = percentChange(x, y);
		if (change === null) throw new Error("X must not be zero for a percentage change.");
		const direction = change >= 0 ? "increase" : "decrease";
		return {
			summary: `${formatNumber(Math.abs(change))}% ${direction}`,
			outputs: [
				{ type: "text", text: `${formatNumber(x)} → ${formatNumber(y)} is a ${formatNumber(Math.abs(change))}% ${direction}` },
			],
			data: { change },
		};
	},
};

export const calculatorRunners: ToolRunner[] = [
	ageCalculator,
	bmiCalculator,
	emiCalculator,
	gpaCalculator,
	percentageCalculator,
];
