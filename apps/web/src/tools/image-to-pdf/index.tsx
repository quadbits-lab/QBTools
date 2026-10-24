import { imagesToPdf, type PageSize } from "@qbtools/engines/pdf";
import { Button } from "@qbtools/ui/button";
import { Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Progress } from "@qbtools/ui/progress";
import { Segmented } from "@qbtools/ui/segmented";
import { FileImage, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { type OrderedFile, OrderedFiles, toOrdered } from "#/components/kit/ordered-files";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";

export default function ImageToPdf() {
	const [items, setItems] = useState<OrderedFile[]>([]);
	const [pageSize, setPageSize] = useState<PageSize>("a4");
	const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
	const [margin, setMargin] = useState(24);
	const [done, setDone] = useState<number | null>(null);
	const [result, setResult] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);

	const create = async () => {
		setError(null);
		setDone(0);
		try {
			setResult(await imagesToPdf(items.map((i) => i.file), { pageSize, orientation, marginPt: margin }, setDone));
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't create the PDF.");
		} finally {
			setDone(null);
		}
	};

	return (
		<div className="flex flex-col gap-5">
			<FileDrop accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" multiple compact={items.length > 0} title={items.length ? "Add more images" : undefined} onFiles={(files) => { setItems((l) => [...l, ...files.map(toOrdered)]); setResult(null); }} hint="JPG, PNG or WebP — each image becomes a page" />
			{items.length > 0 && (
				<>
					<OrderedFiles items={items} onChange={(next) => { setItems(next); setResult(null); }} />
					<div className="grid gap-4 sm:grid-cols-3">
						<Field label="Page size" htmlFor="ip-size">
							<Select id="ip-size" value={pageSize} onChange={(e) => { setPageSize(e.target.value as PageSize); setResult(null); }}>
								<option value="a4">A4</option>
								<option value="letter">US Letter</option>
								<option value="fit">Same as image</option>
							</Select>
						</Field>
						{pageSize !== "fit" && (
							<>
								<div className="flex flex-col gap-2">
									<span className="text-sm font-semibold">Orientation</span>
									<Segmented label="Orientation" value={orientation} onChange={(o) => { setOrientation(o); setResult(null); }} options={[{ value: "auto", label: "Auto" }, { value: "portrait", label: "Portrait" }, { value: "landscape", label: "Landscape" }]} />
								</div>
								<Field label="Margin" htmlFor="ip-margin">
									<Select id="ip-margin" value={margin} onChange={(e) => { setMargin(Number(e.target.value)); setResult(null); }}>
										<option value={0}>None</option>
										<option value={24}>Small</option>
										<option value={48}>Large</option>
									</Select>
								</Field>
							</>
						)}
					</div>
					{!result && (
						<Button size="lg" className="self-start" onClick={create} disabled={done !== null}>
							{done !== null ? <Loader2 className="animate-spin" /> : <FileImage />} Create PDF ({items.length} {items.length === 1 ? "page" : "pages"})
						</Button>
					)}
					{done !== null && <Progress value={(done / items.length) * 100} label={`Adding image ${Math.min(done + 1, items.length)} of ${items.length}`} />}
				</>
			)}
			{error && <Notice tone="critical">{error}</Notice>}
			{result && (
				<>
					<ResultDownload blob={result} name="images.pdf" title="Your PDF is ready" />
					<Button variant="ghost" className="self-start" onClick={() => { setItems([]); setResult(null); }}>
						<RotateCcw /> Start over
					</Button>
				</>
			)}
			<PrivacyNote />
		</div>
	);
}
