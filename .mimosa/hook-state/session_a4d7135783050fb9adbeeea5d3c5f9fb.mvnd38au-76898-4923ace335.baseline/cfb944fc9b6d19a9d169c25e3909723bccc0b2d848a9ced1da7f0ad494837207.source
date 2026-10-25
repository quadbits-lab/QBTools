export type BmiCategory = "underweight" | "healthy" | "overweight" | "obese";

export interface BmiResult {
	bmi: number;
	category: BmiCategory;
	label: string;
	healthyMinKg: number;
	healthyMaxKg: number;
}

const LABELS: Record<BmiCategory, string> = {
	underweight: "Underweight",
	healthy: "Healthy weight",
	overweight: "Overweight",
	obese: "Obese",
};

export const BMI_HEALTHY_MIN = 18.5;
export const BMI_HEALTHY_MAX = 24.9;

export function bmiCategory(bmi: number): BmiCategory {
	if (bmi < 18.5) return "underweight";
	if (bmi < 25) return "healthy";
	if (bmi < 30) return "overweight";
	return "obese";
}

export function calculateBmi(weightKg: number, heightCm: number): BmiResult | null {
	if (!(weightKg > 0) || !(heightCm > 0)) return null;
	const meters = heightCm / 100;
	const bmi = weightKg / (meters * meters);
	const category = bmiCategory(bmi);
	return {
		bmi,
		category,
		label: LABELS[category],
		healthyMinKg: BMI_HEALTHY_MIN * meters * meters,
		healthyMaxKg: BMI_HEALTHY_MAX * meters * meters,
	};
}

export const lbToKg = (lb: number) => lb * 0.45359237;
export const kgToLb = (kg: number) => kg / 0.45359237;
export const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;
