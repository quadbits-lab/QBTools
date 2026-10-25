import { Button } from "@qbtools/ui/button";
import { Segmented } from "@qbtools/ui/segmented";
import { toast } from "@qbtools/ui/toaster";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, WandSparkles } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "#/components/kit/copy-button";
import type { Tone } from "#/lib/ai-schemas";
import { aiTextFn } from "#/server/ai.functions";
import { AiPrivacyNote, AiTextInput, AiUnavailable, useAiStatus } from "../ai-text-shell";

const TONE_OPTIONS: { value: Tone; label: string }[] = [
	{ value: "simple", label: "Simple" },
	{ value: "formal", label: "Formal" },
	{ value: "friendly", label: "Friendly" },
	{ value: "shorter", label: "Shorter" },
	{ value: "creative", label: "Creative" },
];

export default function ParaphrasingTool() {
	const status = useAiStatus();
	const run = useServerFn(aiTextFn);
	const [text, setText] = useState("");
	const [tone, setTone] = useState<Tone>("simple");
	const [pending, setPending] = useState(false);
	const [versions, setVersions] = useState<string[]>([]);

	if (status && !status.available) return <AiUnavailable />;
	const maxChars = status?.maxChars ?? 5000;

	const rewrite = async () => {
		setPending(true);
		setVersions([]);
		try {
			const res = await run({ data: { mode: "paraphrase", tone, text } });
			if (res.ok && res.mode === "paraphrase") setVersions(res.versions);
			else if (!res.ok) toast.error(res.error);
		} catch {
			toast.error("Couldn't reach the AI helper. Check your connection and try again.");
		} finally {
			setPending(false);
		}
	};

	return (
		<div className="flex flex-col gap-5">
			<AiTextInput
				value={text}
				onChange={setText}
				maxChars={maxChars}
				placeholder="Paste the sentence or paragraph you want to rewrite…"
			/>
			<div>
				<p className="mb-2 font-medium">Style</p>
				<Segmented
					label="Style"
					value={tone}
					onChange={setTone}
					options={TONE_OPTIONS}
					className="max-w-2xl"
				/>
			</div>
			<div className="flex flex-wrap items-center gap-4">
				<Button
					size="lg"
					onClick={rewrite}
					disabled={pending || !status || !text.trim() || text.length > maxChars}
				>
					{pending ? <Loader2 className="animate-spin" /> : <WandSparkles />}
					{pending ? "Rewriting…" : "Rewrite"}
				</Button>
				<AiPrivacyNote />
			</div>
			{versions.length > 0 && (
				<section aria-live="polite" className="grid gap-4 md:grid-cols-2">
					{versions.map((version, i) => (
						<div key={i} className="flex flex-col gap-3 border border-border p-5">
							<p className="text-sm font-medium text-muted-foreground">Version {i + 1}</p>
							<p className="leading-relaxed whitespace-pre-wrap">{version}</p>
							<CopyButton text={version} size="sm" className="self-start" />
						</div>
					))}
				</section>
			)}
		</div>
	);
}
