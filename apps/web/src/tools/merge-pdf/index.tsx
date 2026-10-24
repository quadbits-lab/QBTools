import { mergePdfs, pdfPageCount } from "@qbtools/engines/pdf";
import { Button } from "@qbtools/ui/button";
import { Progress } from "@qbtools/ui/progress";
import { Files, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { type OrderedFile, OrderedFiles, toOrdered } from "#/components/kit/ordered-files";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";

export default function MergePdf() {
	const [items, setItems] = useState<OrderedFile[]>([]);
	const [pending, setPending] = useState(false);
	const [done, setDone] = useState(0);
	const [result, setResult] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);

	const add = async (files: File[]) => {
		setResult(null);
		const added = files.map(toOrdered);
		setItems((list) => [...list, ...added]);
		for (const item of added) {
			const pages = await pdfPageCount(item.file).catch(() => null);
			setItems((list) => list.map((i) => (i.id === item.id ? { ...i, meta: pages === null ? "can't read" : `${pages} pages` } : i)));
		}
		const { renderThumbnail } = await import("@qbtools/engines/pdf-render");
		for (const item of added) {
			const thumb = await renderThumbnail(item.file, 120);
			setItems((list) => list.map((i) => (i.id === item.id ? { ...i, thumb } : i)));
		}
	};

	const merge = async () => {
		setPending(true);
		setError(null);
		setDone(0);
		try {
			setResult(await mergePdfs(items.map((i) => i.file), setDone));
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't merge these files.");
		} finally {
			setPending(false);
		}
	};

	return (
		<div className="flex flex-col gap-5">
			<FileDrop accept="application/pdf,.pdf" multiple onFiles={add} compact={items.length > 0} title={items.length ? "Add more PDFs" : undefined} hint="Choose 2 or more PDF files" />
			{items.length > 0 && <OrderedFiles items={items} onChange={(next) => { setItems(next); setResult(null); }} />}
			{items.length === 1 && <Notice>Add at least one more PDF to merge.</Notice>}
			{items.length > 1 && !result && (
				<div className="flex flex-col gap-3">
					<Button size="lg" onClick={merge} disabled={pending} className="self-start">
						{pending ? <Loader2 className="animate-spin" /> : <Files />} Merge {items.length} PDFs
					</Button>
					{pending && <Progress value={(done / items.length) * 100} label={`Adding file ${Math.min(done + 1, items.length)} of ${items.length}`} />}
				</div>
			)}
			{error && <Notice tone="critical">{error}</Notice>}
			{result && (
				<>
					<ResultDownload blob={result} name="merged.pdf" title="Your PDFs are merged" />
					<Button variant="ghost" className="self-start" onClick={() => { setItems([]); setResult(null); }}>
						<RotateCcw /> Start over
					</Button>
				</>
			)}
			<PrivacyNote />
		</div>
	);
}
