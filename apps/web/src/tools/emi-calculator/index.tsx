import { calculateEmi, formatNumber, yearlySchedule } from "@qbtools/engines/calc";
import { Input, Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { useMemo, useState } from "react";
import { Notice } from "#/components/kit/notice";
import { Stat } from "#/components/kit/stat";

const CURRENCIES = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "AED ", PKR: "Rs ", NGN: "₦" } as const;

function NumberSlider({ id, label, value, onChange, min, max, step, suffix }: { id: string; label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix?: string }) {
	return (
		<Field label={label} htmlFor={id}>
			<div className="flex items-center gap-3">
				<Input id={id} type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ""} min={min} step={step} onChange={(e) => onChange(Number.parseFloat(e.target.value))} className="max-w-48 font-mono" />
				{suffix && <span className="text-muted-foreground">{suffix}</span>}
			</div>
			<input type="range" aria-label={`${label} slider`} min={min} max={max} step={step} value={Math.min(Math.max(value || 0, min), max)} onChange={(e) => onChange(Number(e.target.value))} className="h-8 w-full cursor-pointer" />
		</Field>
	);
}

export default function EmiCalculator() {
	const [currency, setCurrency] = useState<keyof typeof CURRENCIES>("INR");
	const [amount, setAmount] = useState(1_000_000);
	const [rate, setRate] = useState(8.5);
	const [tenure, setTenure] = useState(20);
	const [unit, setUnit] = useState<"years" | "months">("years");
	const [view, setView] = useState<"yearly" | "monthly">("yearly");

	const months = unit === "years" ? Math.round(tenure * 12) : Math.round(tenure);
	const result = useMemo(() => calculateEmi(amount, rate, months), [amount, rate, months]);
	const symbol = CURRENCIES[currency];
	const money = (n: number) => `${symbol}${formatNumber(n, 0)}`;
	const interestShare = result ? (result.totalInterest / result.totalPayment) * 100 : 0;

	return (
		<div className="flex flex-col gap-8">
			<div className="grid gap-6 lg:grid-cols-2">
				<div className="flex flex-col gap-5">
					<div className="flex items-end gap-3">
						<Field label="Currency" htmlFor="emi-cur" className="w-36">
							<Select id="emi-cur" value={currency} onChange={(e) => setCurrency(e.target.value as keyof typeof CURRENCIES)}>
								{Object.keys(CURRENCIES).map((c) => (
									<option key={c}>{c}</option>
								))}
							</Select>
						</Field>
					</div>
					<NumberSlider id="emi-amount" label="Loan amount" value={amount} onChange={setAmount} min={10_000} max={20_000_000} step={10_000} suffix={currency} />
					<NumberSlider id="emi-rate" label="Interest rate (per year)" value={rate} onChange={setRate} min={0} max={30} step={0.05} suffix="%" />
					<div className="flex flex-col gap-2">
						<NumberSlider id="emi-tenure" label="Loan tenure" value={tenure} onChange={setTenure} min={1} max={unit === "years" ? 30 : 360} step={1} suffix={unit} />
						<Segmented label="Tenure unit" value={unit} onChange={(u) => { setTenure(u === "months" ? Math.round(tenure * 12) : Math.max(1, Math.round(tenure / 12))); setUnit(u); }} options={[{ value: "years", label: "Years" }, { value: "months", label: "Months" }]} className="max-w-xs" />
					</div>
				</div>
				<div aria-live="polite">
					{result ? (
						<div className="flex h-full flex-col gap-4">
							<div className="rounded-2xl bg-primary p-6 text-primary-foreground">
								<p className="font-semibold opacity-90">Monthly EMI</p>
								<p className="mt-1 font-mono text-4xl font-extrabold tracking-tight sm:text-5xl">{money(result.emi)}</p>
								<p className="mt-2 opacity-90">for {months} months</p>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<Stat label="Total interest" value={money(result.totalInterest)} />
								<Stat label="Total payment" value={money(result.totalPayment)} />
							</div>
							<div>
								<div className="flex h-4 overflow-hidden rounded-full" role="img" aria-label={`Principal ${formatNumber(100 - interestShare, 0)}%, interest ${formatNumber(interestShare, 0)}%`}>
									<div className="bg-primary" style={{ width: `${100 - interestShare}%` }} />
									<div className="bg-accent" style={{ width: `${interestShare}%` }} />
								</div>
								<div className="mt-2 flex justify-between text-sm">
									<span className="flex items-center gap-2"><span className="size-3 rounded-full bg-primary" /> Principal {formatNumber(100 - interestShare, 0)}%</span>
									<span className="flex items-center gap-2"><span className="size-3 rounded-full bg-accent" /> Interest {formatNumber(interestShare, 0)}%</span>
								</div>
							</div>
						</div>
					) : (
						<Notice tone="caution">Enter a loan amount above 0 and a tenure of at least 1 month.</Notice>
					)}
				</div>
			</div>

			{result && (
				<section aria-labelledby="schedule">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h3 id="schedule" className="text-lg font-bold">Repayment schedule</h3>
						<Segmented label="Schedule view" value={view} onChange={setView} options={[{ value: "yearly", label: "Yearly" }, { value: "monthly", label: "Monthly" }]} />
					</div>
					<div className="mt-3 max-h-96 overflow-auto rounded-2xl border border-border">
						<table className="w-full text-right text-sm">
							<thead className="sticky top-0 bg-muted text-muted-foreground">
								<tr>
									<th className="px-4 py-3 text-left">{view === "yearly" ? "Year" : "Month"}</th>
									<th className="px-4 py-3">Principal</th>
									<th className="px-4 py-3">Interest</th>
									<th className="px-4 py-3">Balance</th>
								</tr>
							</thead>
							<tbody className="font-mono">
								{(view === "yearly"
									? yearlySchedule(result.schedule).map((y) => ({ key: y.year, ...y }))
									: result.schedule.map((m) => ({ key: m.month, ...m }))
								).map((row) => (
									<tr key={row.key} className="border-t border-border">
										<td className="px-4 py-2.5 text-left">{row.key}</td>
										<td className="px-4 py-2.5">{money(row.principal)}</td>
										<td className="px-4 py-2.5">{money(row.interest)}</td>
										<td className="px-4 py-2.5">{money(row.balance)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			)}
		</div>
	);
}
