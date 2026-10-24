import {
	estimateEntropy,
	generatePassphrase,
	generatePassword,
	type PassphraseOptions,
	type PasswordOptions,
	passphraseEntropy,
	passwordPoolSize,
	strengthFromEntropy,
} from "@qbtools/engines/generators";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { Switch } from "@qbtools/ui/switch";
import { cn } from "@qbtools/ui/utils";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "#/components/kit/copy-button";
import { PrivacyNote } from "#/components/kit/privacy-note";

const STRENGTH_TONE = ["bg-critical", "bg-critical", "bg-caution", "bg-positive", "bg-positive"];

function Toggle({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 border border-border px-4">
			<span className="font-medium">{label}</span>
			<Switch checked={checked} onCheckedChange={onChange} />
		</label>
	);
}

export default function PasswordGenerator() {
	const [mode, setMode] = useState<"password" | "passphrase">("password");
	const [pw, setPw] = useState<PasswordOptions>({
		length: 18,
		lowercase: true,
		uppercase: true,
		digits: true,
		symbols: true,
		excludeAmbiguous: false,
	});
	const [pp, setPp] = useState<PassphraseOptions>({
		words: 5,
		separator: "-",
		capitalize: true,
		includeNumber: true,
	});
	const [value, setValue] = useState("");
	const [check, setCheck] = useState("");

	const noSets = !pw.lowercase && !pw.uppercase && !pw.digits && !pw.symbols;
	const generate = useCallback(() => {
		if (mode === "password") {
			if (!noSets) setValue(generatePassword(pw));
		} else {
			setValue(generatePassphrase(pp));
		}
	}, [mode, pw, pp, noSets]);

	useEffect(generate, [generate]);

	const bits =
		mode === "password"
			? pw.length * Math.log2(Math.max(passwordPoolSize(pw), 1))
			: passphraseEntropy(pp);
	const strength = strengthFromEntropy(noSets ? 0 : bits);
	const checkStrength = check ? strengthFromEntropy(estimateEntropy(check)) : null;

	return (
		<div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
			<div className="flex flex-col gap-5">
				<Segmented
					label="Type"
					value={mode}
					onChange={setMode}
					options={[
						{ value: "password", label: "Random password" },
						{ value: "passphrase", label: "Passphrase (easy to remember)" },
					]}
				/>
				<div className="bg-surface-2 p-5">
					<output
						aria-live="polite"
						className="block min-h-16 font-mono text-2xl leading-snug font-medium break-all select-all sm:text-3xl"
					>
						{noSets && mode === "password" ? "Choose at least one character type" : value}
					</output>
					<div className="mt-4">
						<div className="flex gap-1.5" aria-hidden="true">
							{[0, 1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className={cn(
										"h-2 flex-1",
										i <= strength.score ? STRENGTH_TONE[strength.score] : "bg-muted",
									)}
								/>
							))}
						</div>
						<p className="mt-2 text-sm">
							<strong>{strength.label}</strong> · {Math.round(strength.entropyBits)} bits · a
							computer would need {strength.crackTime} to guess it
						</p>
					</div>
					<div className="mt-4 flex flex-wrap gap-2">
						<CopyButton text={value} size="lg" variant="primary" />
						<Button size="lg" variant="secondary" onClick={generate}>
							<RefreshCw /> New one
						</Button>
					</div>
				</div>
				{mode === "password" ? (
					<div className="flex flex-col gap-3">
						<Slider
							id="pw-length"
							label="Length"
							valueLabel={`${pw.length} characters`}
							min={6}
							max={64}
							value={pw.length}
							onChange={(e) => setPw({ ...pw, length: Number(e.target.value) })}
						/>
						<div className="grid gap-2 sm:grid-cols-2">
							<Toggle
								label="Lowercase (a–z)"
								checked={pw.lowercase}
								onChange={(v) => setPw({ ...pw, lowercase: v })}
							/>
							<Toggle
								label="Uppercase (A–Z)"
								checked={pw.uppercase}
								onChange={(v) => setPw({ ...pw, uppercase: v })}
							/>
							<Toggle
								label="Numbers (0–9)"
								checked={pw.digits}
								onChange={(v) => setPw({ ...pw, digits: v })}
							/>
							<Toggle
								label="Symbols (!@#…)"
								checked={pw.symbols}
								onChange={(v) => setPw({ ...pw, symbols: v })}
							/>
							<Toggle
								label="Avoid look-alikes (l, 1, O, 0)"
								checked={pw.excludeAmbiguous}
								onChange={(v) => setPw({ ...pw, excludeAmbiguous: v })}
							/>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						<Slider
							id="pp-words"
							label="Words"
							valueLabel={`${pp.words} words`}
							min={3}
							max={10}
							value={pp.words}
							onChange={(e) => setPp({ ...pp, words: Number(e.target.value) })}
						/>
						<div className="grid gap-2 sm:grid-cols-2">
							<Toggle
								label="Capitalize words"
								checked={pp.capitalize}
								onChange={(v) => setPp({ ...pp, capitalize: v })}
							/>
							<Toggle
								label="Add a number"
								checked={pp.includeNumber}
								onChange={(v) => setPp({ ...pp, includeNumber: v })}
							/>
						</div>
						<Field label="Separator" htmlFor="pp-sep">
							<Input
								id="pp-sep"
								value={pp.separator}
								maxLength={3}
								onChange={(e) => setPp({ ...pp, separator: e.target.value })}
								className="w-24 font-mono"
							/>
						</Field>
					</div>
				)}
				<PrivacyNote text="Created with your browser's secure random generator. Never sent or saved." />
			</div>
			<div className="flex flex-col gap-3 border border-border p-5">
				<h3 className="font-medium">How strong is my current password?</h3>
				<p className="text-sm text-muted-foreground">
					Type it here to check. It stays on this page and is never sent anywhere.
				</p>
				<Input
					type="password"
					value={check}
					onChange={(e) => setCheck(e.target.value)}
					autoComplete="off"
					aria-label="Password to check"
				/>
				{checkStrength && (
					<p>
						<strong>{checkStrength.label}</strong> — guessed in {checkStrength.crackTime}.
					</p>
				)}
				<ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
					<li>Use a different password for every account.</li>
					<li>Store them in a password manager.</li>
					<li>Turn on two-factor authentication where you can.</li>
				</ul>
			</div>
		</div>
	);
}
