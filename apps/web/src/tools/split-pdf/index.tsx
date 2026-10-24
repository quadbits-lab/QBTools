import { downloadBlob, zipFiles } from "@qbtools/engines/files";
import { parsePageRanges, pdfPageCount, splitPdf } from "@qbtools/engines/pdf";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { formatBytes } from "@qbtools/ui/utils";
import { FileArchive, Loader2, RotateCcw, Scissors } from "lucide-react";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";

export default function SplitPdf() {
	const [file, setFile] = useState<File | null>(null);
	const [pages, setPages] = useState(0);
	const [mode, setMode] = useState<"ranges" | "every">("ranges");
	const [ranges, setRanges] = useState("1");
	const [pending, setPending] = useState(false);
	const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
	const [error, setError] = useState<string | null>(null);

	const load = async (files: File[]) => {
		const f = files[0];
		if (!f) return;
		setError(null);
		setResults([]);
		try {
			const count = await pdfPageCount(f);
			setFile(f);
			setPages(count);
			setRanges(count > 1 ? `1-${Math.min(2, count)}` : "1");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't open this PDF.");
		}
	};

	let rangeError: string | null = null;
	let selected = 0;
	if (file && mode === "ranges") {
		try {
			selected = parsePageRanges(ranges, pages).length;
		} catch (e) {
			rangeError = e instanceof Error ? e.message : "Invalid pages";
		}
	}

	const run = async () => {
		if (!file) return;
		setPending(true);
		setError(null);
		try {
			setResults(
				await splitPdf(file, mode === "ranges" ? { kind: "ranges", ranges } : { kind: "every" }),
			);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't split this PDF.");
		} finally {
			setPending(false);
		}
	};

	if (!file) {
		return (
			<div className="flex flex-col gap-4">
				<FileDrop accept="application/pdf,.pdf" onFiles={load} hint="Choose one PDF" />
				{error && <Notice tone="critical">{error}</Notice>}
				<PrivacyNote />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			<p>
				<strong>{file.name}</strong> · {pages} pages · {formatBytes(file.size)}
			</p>
			<Segmented
				label="Split mode"
				value={mode}
				onChange={(m) => {
					setMode(m);
					setResults([]);
				}}
				options={[
					{ value: "ranges", label: "Choose pages" },
					{ value: "every", label: "Every page separately" },
				]}
				className="max-w-lg"
			/>
			{mode === "ranges" && (
				<Field
					label="Pages to keep"
					htmlFor="ranges"
					error={rangeError}
					hint={`Example: 1-3, 5, 8-  (this PDF has pages 1–${pages}). ${selected ? `${selected} page${selected === 1 ? "" : "s"} selected.` : ""}`}
					className="max-w-md"
				>
					<Input
						id="ranges"
						value={ranges}
						onChange={(e) => {
							setRanges(e.target.value);
							setResults([]);
						}}
						aria-invalid={Boolean(rangeError)}
						className="font-mono"
					/>
				</Field>
			)}
			{results.length === 0 && (
				<Button
					size="lg"
					className="self-start"
					onClick={run}
					disabled={pending || Boolean(rangeError)}
				>
					{pending ? <Loader2 className="animate-spin" /> : <Scissors />}{" "}
					{mode === "ranges" ? "Extract pages" : `Split into ${pages} files`}
				</Button>
			)}
			{error && <Notice tone="critical">{error}</Notice>}
			{results.length === 1 && results[0] && (
				<ResultDownload blob={results[0].blob} name={results[0].name} />
			)}
			{results.length > 1 && (
				<div className="flex flex-wrap items-center gap-3 rounded-2xl bg-positive-soft/60 p-5">
					<p className="flex-1 font-bold">{results.length} PDFs ready</p>
					<Button
						size="lg"
						onClick={async () =>
							downloadBlob(await zipFiles(results), file.name.replace(/\.pdf$/i, "-pages.zip"))
						}
					>
						<FileArchive /> Download all (ZIP)
					</Button>
				</div>
			)}
			<Button
				variant="ghost"
				className="self-start"
				onClick={() => {
					setFile(null);
					setResults([]);
				}}
			>
				<RotateCcw /> Choose another PDF
			</Button>
			<PrivacyNote />
		</div>
	);
}
