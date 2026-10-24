import { Button } from "@qbtools/ui/button";
import { Textarea } from "@qbtools/ui/input";
import { toast } from "@qbtools/ui/toaster";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Loader2, SpellCheck } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "#/components/kit/copy-button";
import type { GrammarChange } from "#/lib/ai-schemas";
import { aiTextFn } from "#/server/ai.functions";
import { AiPrivacyNote, AiTextInput, AiUnavailable, useAiStatus } from "../ai-text-shell";

export default function GrammarChecker() {
	const status = useAiStatus();
	const run = useServerFn(aiTextFn);
	const [text, setText] = useState("");
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<{ corrected: string; changes: GrammarChange[] } | null>(null);

	if (status && !status.available) return <AiUnavailable />;
	const maxChars = status?.maxChars ?? 5000;

	const check = async () => {
		setPending(true);
		setResult(null);
		try {
			const res = await run({ data: { mode: "grammar", text } });
			if (res.ok && res.mode === "grammar") setResult({ corrected: res.corrected, changes: res.changes });
			else if (!res.ok) toast.error(res.error);
		} catch {
			toast.error("Couldn't reach the AI helper. Check your connection and try again.");
		} finally {
			setPending(false);
		}
	};

	return (
		<div className="flex flex-col gap-5">
			<AiTextInput value={text} onChange={setText} maxChars={maxChars} placeholder="Paste an email, essay or message… e.g. “their going to the libary tomorow”" />
			<div className="flex flex-wrap items-center gap-4">
				<Button size="lg" onClick={check} disabled={pending || !status || !text.trim() || text.length > maxChars}>
					{pending ? <Loader2 className="animate-spin" /> : <SpellCheck />}
					{pending ? "Checking…" : "Check grammar"}
				</Button>
				<AiPrivacyNote />
			</div>
			{result && (
				<section aria-live="polite" className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
					<div>
						<label htmlFor="gc-out" className="mb-2 block font-semibold">
							Corrected text
						</label>
						<Textarea id="gc-out" readOnly value={result.corrected} className="min-h-56 bg-surface-2" />
						<div className="mt-3">
							<CopyButton text={result.corrected} label="Copy corrected text" variant="primary" />
						</div>
					</div>
					<div className="rounded-2xl border border-border p-5">
						<h3 className="font-bold">{result.changes.length === 0 ? "Looks good!" : `${result.changes.length} ${result.changes.length === 1 ? "fix" : "fixes"}`}</h3>
						{result.changes.length === 0 ? (
							<p className="mt-2 flex items-center gap-2 text-positive">
								<CheckCircle2 className="size-5" /> No mistakes found.
							</p>
						) : (
							<ul className="mt-3 flex max-h-80 flex-col gap-3 overflow-y-auto">
								{result.changes.map((c, i) => (
									<li key={i} className="rounded-xl bg-muted p-3 text-sm">
										<p className="flex flex-wrap items-center gap-2">
											<span className="text-critical line-through">{c.original}</span>
											<ArrowRight className="size-4 text-muted-foreground" />
											<span className="font-semibold text-positive">{c.corrected}</span>
										</p>
										<p className="mt-1 text-muted-foreground">{c.reason}</p>
									</li>
								))}
							</ul>
						)}
					</div>
				</section>
			)}
		</div>
	);
}
