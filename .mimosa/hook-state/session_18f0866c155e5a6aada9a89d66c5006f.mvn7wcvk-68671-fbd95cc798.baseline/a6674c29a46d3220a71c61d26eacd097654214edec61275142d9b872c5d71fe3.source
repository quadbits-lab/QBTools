import { calculateAge, parseDateInput, toDateInput } from "@qbtools/engines/calc";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Cake, PartyPopper } from "lucide-react";
import { useMemo, useState } from "react";
import { Notice } from "#/components/kit/notice";
import { Stat } from "#/components/kit/stat";

const plural = (n: number, word: string) =>
	`${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;

export default function AgeCalculator() {
	const today = toDateInput(
		new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())),
	);
	const [birth, setBirth] = useState("2000-01-01");
	const [asOf, setAsOf] = useState(today);

	const result = useMemo(() => {
		const b = parseDateInput(birth);
		const a = parseDateInput(asOf);
		return b && a ? calculateAge(b, a) : null;
	}, [birth, asOf]);

	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
			<div className="flex flex-col gap-5">
				<Field label="Date of birth" htmlFor="dob">
					<Input
						id="dob"
						type="date"
						value={birth}
						max={asOf}
						onChange={(e) => setBirth(e.target.value)}
					/>
				</Field>
				<Field
					label="Age on this date"
					htmlFor="asof"
					hint="Leave as today, or pick a deadline date."
				>
					<Input id="asof" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
				</Field>
			</div>
			<div aria-live="polite">
				{result ? (
					<div className="flex flex-col gap-4">
						<div className="border border-input p-6">
							<p className="text-sm font-medium text-muted-foreground">Your age</p>
							<p className="mt-1 text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
								{plural(result.years, "year")}, {plural(result.months, "month")},{" "}
								{plural(result.days, "day")}
							</p>
							<p className="mt-2 text-muted-foreground">Born on a {result.bornOnWeekday}.</p>
						</div>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							<Stat label="Total months" value={result.totalMonths.toLocaleString("en")} />
							<Stat label="Total weeks" value={result.totalWeeks.toLocaleString("en")} />
							<Stat label="Total days" value={result.totalDays.toLocaleString("en")} />
						</div>
						<div className="flex items-center gap-4 border border-border p-5">
							{result.daysToNextBirthday === 365 || result.daysToNextBirthday === 366 ? (
								<PartyPopper className="size-7 shrink-0" strokeWidth={1.5} />
							) : (
								<Cake className="size-7 shrink-0" strokeWidth={1.5} />
							)}
							<p>
								Next birthday:{" "}
								<strong>
									{result.nextBirthday.toLocaleDateString("en", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
										timeZone: "UTC",
									})}
								</strong>{" "}
								— in {plural(result.daysToNextBirthday, "day")}.
							</p>
						</div>
					</div>
				) : (
					<Notice tone="caution">
						Please choose a date of birth that's before the “age on” date.
					</Notice>
				)}
			</div>
		</div>
	);
}
