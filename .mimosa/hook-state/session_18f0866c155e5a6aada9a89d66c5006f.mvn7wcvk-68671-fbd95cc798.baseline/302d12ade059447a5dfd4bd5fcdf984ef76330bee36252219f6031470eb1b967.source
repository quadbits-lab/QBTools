import { formatDuration, textStats } from "@qbtools/engines/text";
import { Button } from "@qbtools/ui/button";
import { Input, Textarea } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Progress } from "@qbtools/ui/progress";
import { Eraser } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { CopyButton } from "#/components/kit/copy-button";
import { Stat } from "#/components/kit/stat";

const DRAFT_KEY = "qbtools.word-counter.draft";

export default function WordCounter() {
	const [text, setText] = useState("");
	const [target, setTarget] = useState("");
	const deferred = useDeferredValue(text);
	const stats = useMemo(() => textStats(deferred), [deferred]);

	// Keep the draft if the tab is closed by accident (this device only).
	useEffect(() => {
		try {
			setText(localStorage.getItem(DRAFT_KEY) ?? "");
		} catch {}
	}, []);
	useEffect(() => {
		const id = setTimeout(() => {
			try {
				localStorage.setItem(DRAFT_KEY, text);
			} catch {}
		}, 400);
		return () => clearTimeout(id);
	}, [text]);

	const targetWords = Number(target);
	return (
		<div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
			<div className="flex flex-col gap-3">
				<label htmlFor="wc-text" className="sr-only">
					Your text
				</label>
				<Textarea
					id="wc-text"
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Start typing or paste your text here…"
					className="min-h-80 text-[1.0625rem]"
				/>
				<div className="flex flex-wrap gap-2">
					<CopyButton text={text} label="Copy text" size="sm" />
					<Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
						<Eraser /> Clear
					</Button>
				</div>
			</div>
			<div className="flex flex-col gap-3" aria-live="polite">
				<div className="grid grid-cols-2 gap-3">
					<Stat label="Words" value={stats.words.toLocaleString("en")} tone="primary" />
					<Stat
						label="Characters"
						value={stats.characters.toLocaleString("en")}
						hint={`${stats.charactersNoSpaces.toLocaleString("en")} without spaces`}
					/>
					<Stat label="Sentences" value={stats.sentences.toLocaleString("en")} />
					<Stat label="Paragraphs" value={stats.paragraphs.toLocaleString("en")} />
					<Stat
						label="Reading time"
						value={formatDuration(stats.readingMinutes)}
						className="[&>span:nth-child(2)]:text-xl"
					/>
					<Stat
						label="Speaking time"
						value={formatDuration(stats.speakingMinutes)}
						className="[&>span:nth-child(2)]:text-xl"
					/>
				</div>
				<div className="border border-border p-4">
					<Field label="Word goal (optional)" htmlFor="wc-target">
						<Input
							id="wc-target"
							type="number"
							inputMode="numeric"
							min={1}
							placeholder="e.g. 500"
							value={target}
							onChange={(e) => setTarget(e.target.value)}
							className="font-mono"
						/>
					</Field>
					{targetWords > 0 && (
						<Progress
							className="mt-3"
							value={(stats.words / targetWords) * 100}
							label={
								stats.words >= targetWords
									? `Goal reached (${stats.words - targetWords} over)`
									: `${targetWords - stats.words} words to go`
							}
						/>
					)}
				</div>
				{stats.topKeywords.length > 0 && (
					<div className="border border-border p-4">
						<p className="mb-2 font-medium">Most used words</p>
						<ul className="flex flex-col gap-1.5">
							{stats.topKeywords.map((k) => (
								<li key={k.word} className="flex items-center justify-between gap-2 text-sm">
									<span className="truncate font-medium">{k.word}</span>
									<span className="font-mono text-muted-foreground">
										{k.count}× · {k.density.toFixed(1)}%
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
