export type GradeScaleId = "4" | "10";

export interface GradeScale {
	id: GradeScaleId;
	label: string;
	max: number;
	grades: { grade: string; points: number }[];
}

export const gradeScales: Record<GradeScaleId, GradeScale> = {
	"4": {
		id: "4",
		label: "4.0 scale",
		max: 4,
		grades: [
			{ grade: "A+", points: 4 },
			{ grade: "A", points: 4 },
			{ grade: "A-", points: 3.7 },
			{ grade: "B+", points: 3.3 },
			{ grade: "B", points: 3 },
			{ grade: "B-", points: 2.7 },
			{ grade: "C+", points: 2.3 },
			{ grade: "C", points: 2 },
			{ grade: "C-", points: 1.7 },
			{ grade: "D+", points: 1.3 },
			{ grade: "D", points: 1 },
			{ grade: "F", points: 0 },
		],
	},
	"10": {
		id: "10",
		label: "10-point scale",
		max: 10,
		grades: [
			{ grade: "O", points: 10 },
			{ grade: "A+", points: 9 },
			{ grade: "A", points: 8 },
			{ grade: "B+", points: 7 },
			{ grade: "B", points: 6 },
			{ grade: "C", points: 5 },
			{ grade: "P", points: 4 },
			{ grade: "F", points: 0 },
		],
	},
};

export interface Course {
	credits: number;
	points: number;
}

export interface GpaResult {
	gpa: number;
	totalCredits: number;
	qualityPoints: number;
}

export function calculateGpa(courses: Course[]): GpaResult | null {
	const valid = courses.filter((c) => c.credits > 0 && Number.isFinite(c.points));
	const totalCredits = valid.reduce((sum, c) => sum + c.credits, 0);
	if (totalCredits === 0) return null;
	const qualityPoints = valid.reduce((sum, c) => sum + c.credits * c.points, 0);
	return { gpa: qualityPoints / totalCredits, totalCredits, qualityPoints };
}

/** Combine a previous CGPA with this semester, weighted by credits. */
export function calculateCgpa(
	previousCgpa: number,
	previousCredits: number,
	semester: GpaResult,
): number {
	if (!(previousCredits > 0)) return semester.gpa;
	return (
		(previousCgpa * previousCredits + semester.qualityPoints) /
		(previousCredits + semester.totalCredits)
	);
}
