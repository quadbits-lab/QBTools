import { formatNumber, percentChange, percentOf, whatPercent } from "@qbtools/engines/calc";
import { Input } from "@qbtools/ui/input";
import { cn } from "@qbtools/ui/utils";
import { useState } from "react";

const num = (v: string) => (v.trim() === "" ? Number.NaN : Number(v));

function NumberInput({
	value,
	onChange,
	label,
}: {
	value: string;
	onChange: (v: string) => void;
	label: string;
}) {
	return (
		<Input
			type="number"
			inputMode="decimal"
			aria-label={label}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="w-32 font-mono text-lg"
		/>
	);
}

function Card({
	title,
	children,
	answer,
	working,
}: {
	title: string;
	children: React.ReactNode;
	answer: string | null;
	working: string | null;
}) {
	return (
		<section className="flex flex-col gap-4 border border-border p-5">
			<h3 className="font-medium">{title}</h3>
			<div className="flex flex-wrap items-center gap-3 text-lg">{children}</div>
			<div aria-live="polite" className={cn("p-4", answer ? "bg-muted" : "bg-muted")}>
				{answer ? (
					<>
						<p className="font-mono text-3xl font-medium text-primary">{answer}</p>
						{working && <p className="mt-1 text-sm text-muted-foreground">{working}</p>}
					</>
				) : (
					<p className="text-muted-foreground">Enter both numbers to see the answer.</p>
				)}
			</div>
		</section>
	);
}

export default function PercentageCalculator() {
	const [a1, setA1] = useState("20");
	const [a2, setA2] = useState("150");
	const [b1, setB1] = useState("45");
	const [b2, setB2] = useState("60");
	const [c1, setC1] = useState("80");
	const [c2, setC2] = useState("100");

	const r1 =
		Number.isFinite(num(a1)) && Number.isFinite(num(a2)) ? percentOf(num(a1), num(a2)) : null;
	const r2 =
		Number.isFinite(num(b1)) && Number.isFinite(num(b2)) ? whatPercent(num(b1), num(b2)) : null;
	const r3 =
		Number.isFinite(num(c1)) && Number.isFinite(num(c2)) ? percentChange(num(c1), num(c2)) : null;

	return (
		<div className="grid gap-5 lg:grid-cols-3">
			<Card
				title="What is X% of Y?"
				answer={r1 === null ? null : formatNumber(r1, 4)}
				working={r1 === null ? null : `${a1} ÷ 100 × ${a2} = ${formatNumber(r1, 4)}`}
			>
				<span>What is</span>
				<NumberInput label="Percent" value={a1} onChange={setA1} />
				<span>% of</span>
				<NumberInput label="Number" value={a2} onChange={setA2} />
				<span>?</span>
			</Card>
			<Card
				title="X is what % of Y?"
				answer={r2 === null ? null : `${formatNumber(r2, 4)}%`}
				working={r2 === null ? null : `${b1} ÷ ${b2} × 100 = ${formatNumber(r2, 4)}%`}
			>
				<NumberInput label="Part" value={b1} onChange={setB1} />
				<span>is what % of</span>
				<NumberInput label="Whole" value={b2} onChange={setB2} />
				<span>?</span>
			</Card>
			<Card
				title="Percentage increase / decrease"
				answer={r3 === null ? null : `${r3 > 0 ? "+" : ""}${formatNumber(r3, 4)}%`}
				working={
					r3 === null
						? null
						: `(${c2} − ${c1}) ÷ ${c1} × 100 — ${r3 >= 0 ? "an increase" : "a decrease"}`
				}
			>
				<span>From</span>
				<NumberInput label="From value" value={c1} onChange={setC1} />
				<span>to</span>
				<NumberInput label="To value" value={c2} onChange={setC2} />
			</Card>
		</div>
	);
}
