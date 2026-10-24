import { suffixFilename } from "@qbtools/engines/files";
import { Button } from "@qbtools/ui/button";
import { Progress } from "@qbtools/ui/progress";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { FileDown, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";
import { strParam, type ToolWidgetProps } from "../types";

const LEVELS = {
	light: { label: "Light", hint: "Best quality, smaller savings" },
	recommended: { label: "Recommended", hint: "Good quality, good savings" },
	strong: { label: "Strong", hint: "Smallest file, lower quality" },
} as const;
type Level = keyof typeof LEVELS;

export default function CompressPdf({ params }: ToolWidgetProps) {
	const preset = strParam(params, "level");
	const [file, setFile] = useState<File | null>(null);
	const [level, setLevel] = useState<Level>(preset === "strong" || preset === "light" ? preset : "recommended");
	const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
	const [result, setResult] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);

	const run = async () => {
		if (!file) return;
		setError(null);
		setResult(null);
		setProgress({ done: 0, total: 1 });
		try {
			const { compressPdf } = await import("@qbtools/engines/pdf-render");
			const out = await compressPdf(file, level, (done, total) => setProgress({ done, total }));
			setResult(out);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't compress this PDF.");
		} finally {
			setProgress(null);
		}
	};

	if (!file) {
		return (
			<div className="flex flex-col gap-4">
				<FileDrop accept="application/pdf,.pdf" onFiles={(files) => files[0] && setFile(files[0])} hint="Choose one PDF — scans and photo PDFs shrink the most" />
				<PrivacyNote />
			</div>
		);
	}

	const grew = result && result.size >= file.size;
	return (
		<div className="flex flex-col gap-5">
			<p>
				<strong>{file.name}</strong> · {formatBytes(file.size)}
			</p>
			<div role="radiogroup" aria-label="Compression level" className="grid gap-3 sm:grid-cols-3">
				{(Object.keys(LEVELS) as Level[]).map((key) => (
					<button
						key={key}
						type="button"
						role="radio"
						aria-checked={level === key}
						onClick={() => { setLevel(key); setResult(null); }}
						className={cn("flex cursor-pointer flex-col items-start rounded-2xl border-2 p-4 text-left", level === key ? "border-primary bg-primary-soft/50" : "border-border hover:border-primary/50")}
					>
						<span className="font-bold">{LEVELS[key].label}</span>
						<span className="text-sm text-muted-foreground">{LEVELS[key].hint}</span>
					</button>
				))}
			</div>
			{!result && (
				<Button size="lg" className="self-start" onClick={run} disabled={Boolean(progress)}>
					{progress ? <Loader2 className="animate-spin" /> : <FileDown />} Compress PDF
				</Button>
			)}
			{progress && <Progress value={(progress.done / progress.total) * 100} label={`Compressing page ${Math.min(progress.done + 1, progress.total)} of ${progress.total}`} />}
			{error && <Notice tone="critical">{error}</Notice>}
			{result && grew && <Notice tone="caution">This PDF is already well optimized — compressing made it bigger. Keep your original, or try Strong.</Notice>}
			{result && <ResultDownload blob={result} name={suffixFilename(file.name, "compressed")} before={file.size} title="Compressed!" extra={<p className="text-sm text-muted-foreground">Text in the result can't be selected. Keep your original for editing.</p>} />}
			<Button variant="ghost" className="self-start" onClick={() => { setFile(null); setResult(null); }}>
				<RotateCcw /> Choose another PDF
			</Button>
			<PrivacyNote />
		</div>
	);
}
