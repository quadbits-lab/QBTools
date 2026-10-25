/** Compact color control: clickable swatch (native picker) plus hex text input. */
import { Field } from "@qbtools/ui/label";
import { cn } from "@qbtools/ui/utils";
import { useState } from "react";

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function ColorField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (hex: string) => void;
}) {
	const [draft, setDraft] = useState<string | null>(null);
	const shown = draft ?? value;
	const valid = HEX_PATTERN.test(shown);
	return (
		<Field label={label}>
			<div
				className={cn(
					"flex h-11 items-center gap-2 rounded-md border border-input bg-transparent pr-3 transition-shadow focus-within:ring-2 focus-within:ring-ring",
					!valid && "border-critical",
				)}
			>
				<label className="relative size-full w-11 shrink-0 cursor-pointer overflow-hidden rounded-l-md border-r border-input">
					<span
						className="absolute inset-0 ring-1 ring-inset ring-black/10"
						style={{ backgroundColor: valid ? shown : "#00000000" }}
						aria-hidden
					/>
					<input
						type="color"
						value={valid ? shown : "#000000"}
						onChange={(e) => {
							setDraft(null);
							onChange(e.target.value);
						}}
						className="absolute inset-0 cursor-pointer opacity-0"
						aria-label={`${label} picker`}
					/>
				</label>
				<input
					type="text"
					value={shown}
					spellCheck={false}
					onChange={(e) => {
						const next = e.target.value;
						setDraft(next);
						if (HEX_PATTERN.test(next)) onChange(next);
					}}
					onBlur={() => setDraft(null)}
					className="w-full bg-transparent font-mono text-sm uppercase outline-none placeholder:text-muted-foreground"
					placeholder="#1E293B"
					aria-label={`${label} hex value`}
				/>
			</div>
		</Field>
	);
}
