import {
	calculateCgpa,
	calculateGpa,
	formatNumber,
	type GradeScaleId,
	gradeScales,
} from "@qbtools/engines/calc";
import { Button } from "@qbtools/ui/button";
import { Input, Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Stat } from "#/components/kit/stat";

interface Row {
	id: number;
	name: string;
	credits: string;
	grade: string;
}

let nextId = 1;
const newRow = (grade: string): Row => ({ id: nextId++, name: "", credits: "3", grade });

export default function GpaCalculator() {
	const [scaleId, setScaleId] = useState<GradeScaleId>("4");
	const scale = gradeScales[scaleId];
	const [rows, setRows] = useState<Row[]>(() => [newRow("A"), newRow("B+"), newRow("A-")]);
	const [prevCgpa, setPrevCgpa] = useState("");
	const [prevCredits, setPrevCredits] = useState("");

	const gpa = useMemo(() => {
		const pointsFor = (grade: string) =>
			scale.grades.find((g) => g.grade === grade)?.points ?? Number.NaN;
		return calculateGpa(
			rows.map((r) => ({ credits: Number(r.credits), points: pointsFor(r.grade) })),
		);
	}, [rows, scale]);
	const cgpa =
		gpa && prevCgpa && prevCredits
			? calculateCgpa(Number(prevCgpa), Number(prevCredits), gpa)
			: null;

	const update = (id: number, patch: Partial<Row>) =>
		setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

	return (
		<div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
			<div className="flex flex-col gap-4">
				<Segmented
					label="Grading scale"
					value={scaleId}
					onChange={(id) => {
						setScaleId(id);
						const first = gradeScales[id].grades[1]?.grade ?? "A";
						setRows((list) => list.map((r) => ({ ...r, grade: first })));
					}}
					options={[
						{ value: "4", label: "4.0 scale (A–F)" },
						{ value: "10", label: "10-point (O–F)" },
					]}
					className="max-w-md"
				/>
				<ul className="flex flex-col gap-3">
					{rows.map((row, index) => (
						<li
							key={row.id}
							className="grid grid-cols-[1fr_5.5rem_6.5rem_auto] items-end gap-2 sm:gap-3"
						>
							<Field
								label={index === 0 ? "Course (optional)" : <span className="sr-only">Course</span>}
								htmlFor={`c-${row.id}`}
							>
								<Input
									id={`c-${row.id}`}
									placeholder={`Course ${index + 1}`}
									value={row.name}
									onChange={(e) => update(row.id, { name: e.target.value })}
								/>
							</Field>
							<Field
								label={index === 0 ? "Credits" : <span className="sr-only">Credits</span>}
								htmlFor={`cr-${row.id}`}
							>
								<Input
									id={`cr-${row.id}`}
									type="number"
									inputMode="decimal"
									min={0}
									step={0.5}
									value={row.credits}
									onChange={(e) => update(row.id, { credits: e.target.value })}
									className="font-mono"
								/>
							</Field>
							<Field
								label={index === 0 ? "Grade" : <span className="sr-only">Grade</span>}
								htmlFor={`g-${row.id}`}
							>
								<Select
									id={`g-${row.id}`}
									value={row.grade}
									onChange={(e) => update(row.id, { grade: e.target.value })}
								>
									{scale.grades.map((g) => (
										<option key={g.grade} value={g.grade}>
											{g.grade} ({g.points})
										</option>
									))}
								</Select>
							</Field>
							<Button
								variant="ghost"
								size="icon"
								aria-label={`Remove course ${index + 1}`}
								onClick={() => setRows((list) => list.filter((r) => r.id !== row.id))}
								disabled={rows.length === 1}
							>
								<Trash2 />
							</Button>
						</li>
					))}
				</ul>
				<Button
					variant="secondary"
					onClick={() => setRows((list) => [...list, newRow(scale.grades[0]?.grade ?? "A")])}
					className="self-start"
				>
					<Plus /> Add course
				</Button>
			</div>
			<div className="flex flex-col gap-4" aria-live="polite">
				<div className="bg-primary p-6 text-primary-foreground">
					<p className="font-medium opacity-90">Semester GPA</p>
					<p className="mt-1 font-mono text-5xl font-medium">
						{gpa ? formatNumber(gpa.gpa, 2) : "—"}
					</p>
					<p className="mt-1 opacity-90">out of {scale.max}</p>
				</div>
				<Stat label="Total credits" value={gpa ? formatNumber(gpa.totalCredits, 1) : "0"} />
				<div className="border border-border p-5">
					<p className="font-medium">Cumulative CGPA (optional)</p>
					<div className="mt-3 grid grid-cols-2 gap-3">
						<Field label="Previous CGPA" htmlFor="prev-cgpa">
							<Input
								id="prev-cgpa"
								type="number"
								inputMode="decimal"
								step={0.01}
								min={0}
								max={scale.max}
								value={prevCgpa}
								onChange={(e) => setPrevCgpa(e.target.value)}
								className="font-mono"
							/>
						</Field>
						<Field label="Credits so far" htmlFor="prev-credits">
							<Input
								id="prev-credits"
								type="number"
								inputMode="decimal"
								min={0}
								value={prevCredits}
								onChange={(e) => setPrevCredits(e.target.value)}
								className="font-mono"
							/>
						</Field>
					</div>
					{cgpa !== null && (
						<p className="mt-4 text-lg">
							New CGPA:{" "}
							<strong className="font-mono text-2xl text-primary">{formatNumber(cgpa, 2)}</strong>
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
