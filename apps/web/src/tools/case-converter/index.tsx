import { type CaseMode, caseModes, convertCase } from "@qbtools/engines/text";
import { Button } from "@qbtools/ui/button";
import { Textarea } from "@qbtools/ui/input";
import { cn } from "@qbtools/ui/utils";
import { Eraser } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "#/components/kit/copy-button";

export default function CaseConverter() {
	const [text, setText] = useState("");
	const [mode, setMode] = useState<CaseMode | null>(null);
	const output = mode ? convertCase(text, mode) : text;

	return (
		<div className="flex flex-col gap-5">
			<div>
				<label htmlFor="cc-in" className="mb-2 block font-medium">
					Your text
				</label>
				<Textarea
					id="cc-in"
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Type or paste text here…"
					className="min-h-40"
				/>
			</div>
			<div
				role="group"
				aria-label="Choose a case"
				className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
			>
				{caseModes.map((m) => (
					<button
						key={m.mode}
						type="button"
						aria-pressed={mode === m.mode}
						onClick={() => setMode(m.mode)}
						className={cn(
							"flex min-h-14 cursor-pointer flex-col items-start justify-center border px-4 py-2 text-left transition-colors",
							mode === m.mode
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-surface hover:border-primary",
						)}
					>
						<span className="font-medium">{m.label}</span>
						<span
							className={cn(
								"truncate text-xs",
								mode === m.mode ? "opacity-85" : "text-muted-foreground",
							)}
						>
							{m.example}
						</span>
					</button>
				))}
			</div>
			<div>
				<label htmlFor="cc-out" className="mb-2 block font-medium">
					Result
				</label>
				<Textarea id="cc-out" readOnly value={output} className="min-h-40 bg-surface-2" />
			</div>
			<div className="flex flex-wrap gap-2">
				<CopyButton text={output} label="Copy result" size="lg" variant="primary" />
				<Button
					variant="secondary"
					size="lg"
					onClick={() => mode && setText(output)}
					disabled={!mode || !text}
				>
					Use result as input
				</Button>
				<Button
					variant="ghost"
					size="lg"
					onClick={() => {
						setText("");
						setMode(null);
					}}
					disabled={!text}
				>
					<Eraser /> Clear
				</Button>
			</div>
		</div>
	);
}
