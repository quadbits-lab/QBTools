import { Badge } from "@qbtools/ui/badge";
import { Textarea } from "@qbtools/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Notice } from "#/components/kit/notice";
import { aiStatusFn } from "#/server/ai.functions";

/** Shared input area + availability check for the AI text helpers. */
export function useAiStatus() {
	const status = useServerFn(aiStatusFn);
	const [state, setState] = useState<{ available: boolean; maxChars: number } | null>(null);
	useEffect(() => {
		status()
			.then(setState)
			.catch(() => setState({ available: false, maxChars: 5000 }));
	}, [status]);
	return state;
}

export function AiTextInput({
	value,
	onChange,
	maxChars,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	maxChars: number;
	placeholder: string;
}) {
	const over = value.length > maxChars;
	return (
		<div>
			<label htmlFor="ai-text" className="mb-2 flex items-center justify-between font-semibold">
				Your text
				<span
					className={
						over ? "font-mono text-sm text-critical" : "font-mono text-sm text-muted-foreground"
					}
				>
					{value.length.toLocaleString("en")} / {maxChars.toLocaleString("en")}
				</span>
			</label>
			<Textarea
				id="ai-text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="min-h-56"
				aria-invalid={over}
			/>
		</div>
	);
}

export function AiUnavailable() {
	return (
		<Notice tone="caution">
			The AI helper isn't switched on for this site yet. In the meantime, try our{" "}
			<a href="/tools/word-counter" className="font-semibold underline">
				Word Counter
			</a>{" "}
			or{" "}
			<a href="/tools/case-converter" className="font-semibold underline">
				Case Converter
			</a>
			.
		</Notice>
	);
}

export function AiPrivacyNote() {
	return (
		<p className="flex items-center gap-2 text-sm text-muted-foreground">
			<Badge tone="primary">
				<Sparkles /> AI
			</Badge>
			Your text is sent securely to our AI provider to process it and is not stored by QBTools.
		</p>
	);
}
