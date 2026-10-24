import { calculateBmi, feetInchesToCm, formatNumber, kgToLb, lbToKg } from "@qbtools/engines/calc";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { cn } from "@qbtools/ui/utils";
import { useState } from "react";
import { Notice } from "#/components/kit/notice";

const BANDS = [
	{ label: "Underweight", max: 18.5, className: "bg-cat-text" },
	{ label: "Healthy", max: 25, className: "bg-positive" },
	{ label: "Overweight", max: 30, className: "bg-caution" },
	{ label: "Obese", max: 40, className: "bg-critical" },
];
const MIN = 12;
const MAX = 40;

export default function BmiCalculator() {
	const [units, setUnits] = useState<"metric" | "imperial">("metric");
	const [cm, setCm] = useState("170");
	const [kg, setKg] = useState("65");
	const [ft, setFt] = useState("5");
	const [inches, setInches] = useState("7");
	const [lb, setLb] = useState("143");

	const heightCm = units === "metric" ? Number(cm) : feetInchesToCm(Number(ft), Number(inches || 0));
	const weightKg = units === "metric" ? Number(kg) : lbToKg(Number(lb));
	const result = calculateBmi(weightKg, heightCm);
	const marker = result ? ((Math.min(Math.max(result.bmi, MIN), MAX) - MIN) / (MAX - MIN)) * 100 : 0;
	const weight = (valueKg: number) => (units === "metric" ? `${formatNumber(valueKg, 1)} kg` : `${formatNumber(kgToLb(valueKg), 0)} lb`);

	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
			<div className="flex flex-col gap-5">
				<Segmented label="Units" value={units} onChange={setUnits} options={[{ value: "metric", label: "Metric (kg, cm)" }, { value: "imperial", label: "Imperial (lb, ft)" }]} />
				{units === "metric" ? (
					<>
						<Field label="Height (cm)" htmlFor="bmi-cm">
							<Input id="bmi-cm" type="number" inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} className="font-mono" />
						</Field>
						<Field label="Weight (kg)" htmlFor="bmi-kg">
							<Input id="bmi-kg" type="number" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} className="font-mono" />
						</Field>
					</>
				) : (
					<>
						<div className="grid grid-cols-2 gap-3">
							<Field label="Height (feet)" htmlFor="bmi-ft">
								<Input id="bmi-ft" type="number" inputMode="numeric" value={ft} onChange={(e) => setFt(e.target.value)} className="font-mono" />
							</Field>
							<Field label="Inches" htmlFor="bmi-in">
								<Input id="bmi-in" type="number" inputMode="decimal" value={inches} onChange={(e) => setInches(e.target.value)} className="font-mono" />
							</Field>
						</div>
						<Field label="Weight (lb)" htmlFor="bmi-lb">
							<Input id="bmi-lb" type="number" inputMode="decimal" value={lb} onChange={(e) => setLb(e.target.value)} className="font-mono" />
						</Field>
					</>
				)}
				<p className="text-sm text-muted-foreground">For adults 18+. Children and teens need age-specific charts.</p>
			</div>
			<div aria-live="polite">
				{result ? (
					<div className="flex flex-col gap-5">
						<div className="rounded-2xl bg-primary-soft/60 p-6">
							<p className="font-semibold text-muted-foreground">Your BMI</p>
							<p className="mt-1 font-mono text-5xl font-extrabold">{formatNumber(result.bmi, 1)}</p>
							<p className={cn("mt-2 text-xl font-bold", result.category === "healthy" ? "text-positive" : result.category === "underweight" ? "text-cat-text" : result.category === "overweight" ? "text-caution" : "text-critical")}>
								{result.label}
							</p>
						</div>
						<div>
							<div className="relative pt-5">
								<div className="absolute top-0 -translate-x-1/2 text-xs font-bold" style={{ left: `${marker}%` }}>
									▼
								</div>
								<div className="flex h-4 overflow-hidden rounded-full">
									{BANDS.map((band, i) => {
										const from = i === 0 ? MIN : (BANDS[i - 1]?.max ?? MIN);
										return <div key={band.label} className={band.className} style={{ width: `${((band.max - from) / (MAX - MIN)) * 100}%` }} />;
									})}
								</div>
							</div>
							<div className="mt-2 grid grid-cols-4 text-center text-xs text-muted-foreground">
								{BANDS.map((b) => (
									<span key={b.label}>{b.label}</span>
								))}
							</div>
						</div>
						<p className="rounded-xl border border-border p-4">
							A healthy weight for your height is about <strong>{weight(result.healthyMinKg)}</strong> to <strong>{weight(result.healthyMaxKg)}</strong>.
						</p>
					</div>
				) : (
					<Notice tone="caution">Enter your height and weight to see your BMI.</Notice>
				)}
			</div>
		</div>
	);
}
