import { imagesToPdf, type PageSize } from "@qbtools/engines/pdf";
import { Button } from "@qbtools/ui/button";
import { Field } from "@qbtools/ui/label";
import { Progress } from "@qbtools/ui/progress";
import { Segmented } from "@qbtools/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
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
			setResult(
				await imagesToPdf(
					items.map((i) => i.file),
					{ pageSize, orientation, marginPt: margin },
					setDone,
				),
			);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't create the PDF.");
		} finally {
			setDone(null);
		}
	};

	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
				multiple
				compact={items.length > 0}
				title={items.length ? "Add more images" : undefined}
				onFiles={(files) => {
					setItems((l) => [...l, ...files.map(toOrdered)]);
					setResult(null);
				}}
				hint="JPG, PNG or WebP — each image becomes a page"
			/>
			{items.length > 0 && (
				<>
					<OrderedFiles
						items={items}
						onChange={(next) => {
							setItems(next);
							setResult(null);
						}}
					/>
					<div className="grid gap-4 sm:grid-cols-3">
						<Field label="Page size" htmlFor="ip-size">
							<Select
								value={pageSize}
								onValueChange={(val) => {
									setPageSize(val as PageSize);
									setResult(null);
								}}
							>
								<SelectTrigger id="ip-size" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="a4">A4</SelectItem>
									<SelectItem value="letter">US Letter</SelectItem>
									<SelectItem value="fit">Same as image</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						{pageSize !== "fit" && (
							<>
								<div className="flex flex-col gap-2">
									<span className="text-sm font-medium">Orientation</span>
									<Segmented
										label="Orientation"
										value={orientation}
										onChange={(o) => {
											setOrientation(o);
											setResult(null);
										}}
										options={[
											{ value: "auto", label: "Auto" },
											{ value: "portrait", label: "Portrait" },
											{ value: "landscape", label: "Landscape" },
										]}
									/>
								</div>
								<Field label="Margin" htmlFor="ip-margin">
									<Select
										value={String(margin)}
										onValueChange={(val) => {
											setMargin(Number(val));
											setResult(null);
										}}
									>
										<SelectTrigger id="ip-margin" className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="0">None</SelectItem>
											<SelectItem value="24">Small</SelectItem>
											<SelectItem value="48">Large</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							</>
						)}
					</div>
					{!result && (
						<Button size="lg" className="self-start" onClick={create} disabled={done !== null}>
							{done !== null ? <Loader2 className="animate-spin" /> : <FileImage />} Create PDF (
							{items.length} {items.length === 1 ? "page" : "pages"})
						</Button>
					)}
					{done !== null && (
						<Progress
							value={(done / items.length) * 100}
							label={`Adding image ${Math.min(done + 1, items.length)} of ${items.length}`}
						/>
					)}
				</>
			)}
			{error && <Notice tone="critical">{error}</Notice>}
			{result && (
				<>
					<ResultDownload blob={result} name="images.pdf" title="Your PDF is ready" />
					<Button
						variant="ghost"
						className="self-start"
						onClick={() => {
							setItems([]);
							setResult(null);
						}}
					>
						<RotateCcw /> Start over
					</Button>
				</>
			)}
			<PrivacyNote />
		</div>
	);
}
