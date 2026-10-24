import { downloadBlob } from "@qbtools/engines/files";
import { Button } from "@qbtools/ui/button";
import { formatBytes } from "@qbtools/ui/utils";
import { CheckCircle2, Download } from "lucide-react";

export function ResultDownload({ blob, name, before, title = "Your file is ready", extra }: { blob: Blob; name: string; before?: number; title?: string; extra?: React.ReactNode }) {
	const saved = before ? 1 - blob.size / before : 0;
	return (
		<div className="flex flex-col items-start gap-3 rounded-2xl bg-positive-soft/60 p-5 sm:flex-row sm:items-center" aria-live="polite">
			<CheckCircle2 className="size-8 shrink-0 text-positive" />
			<div className="flex-1">
				<p className="font-bold">{title}</p>
				<p className="text-sm text-muted-foreground">
					{name} · {before ? <>{formatBytes(before)} → </> : null}
					<strong className="text-foreground">{formatBytes(blob.size)}</strong>
					{before && saved > 0.005 ? <> (−{Math.round(saved * 100)}%)</> : null}
				</p>
				{extra}
			</div>
			<Button size="lg" onClick={() => downloadBlob(blob, name)}>
				<Download /> Download
			</Button>
		</div>
	);
}
