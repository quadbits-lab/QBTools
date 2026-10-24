import { suffixFilename } from "@qbtools/engines/files";
import type { OcrSession } from "@qbtools/engines/ocr";
import type { SearchablePdf } from "@qbtools/engines/pdf-searchable";
import { LIMITS } from "@qbtools/engines/processing";
import { Button } from "@qbtools/ui/button";
import { formatBytes } from "@qbtools/ui/utils";
import { useEffect, useRef, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";
import { TaskProgress } from "#/components/kit/task-progress";
import { useTask } from "#/lib/processing/use-task";
import { ProcessingWorker } from "#/lib/processing/worker-client";

export default function OcrPdf() {
	const [file, setFile] = useState<File | null>(null);
	const [forceOcr, setForceOcr] = useState(false);
	const session = useRef<OcrSession | null>(null);
	const task = useTask<SearchablePdf>();
	useEffect(() => () => session.current?.dispose(), []);
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="application/pdf,.pdf"
				title="Choose a scanned PDF"
				hint={`Up to 50 MiB and ${LIMITS.ocrPages} pages · English text`}
				onFiles={(files) => {
					task.reset();
					setFile(files[0] ?? null);
				}}
			/>
			{file && (
				<p>
					<strong>{file.name}</strong> · {formatBytes(file.size)}
				</p>
			)}
			<label className="flex gap-2">
				<input
					type="checkbox"
					checked={forceOcr}
					disabled={task.busy}
					onChange={(e) => {
						task.reset();
						setForceOcr(e.target.checked);
					}}
				/>
				Run OCR on every page, even pages that already have text
			</label>
			<Button
				disabled={!file || task.busy}
				onClick={() => {
					if (!file) return;
					void task.run(async (options) => {
						const [ocr, searchable] = await Promise.all([
							import("@qbtools/engines/ocr"),
							import("@qbtools/engines/pdf-searchable"),
						]);
						session.current ??= new ocr.OcrSession(new ProcessingWorker());
						return searchable.makeSearchablePdf(file, {
							...options,
							session: session.current,
							forceOcr,
						});
					});
				}}
			>
				Make searchable
			</Button>
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.status === "cancelled" && <p>OCR cancelled.</p>}
			{task.result && file && (
				<>
					{task.result.words === 0 && task.result.ocrPages > 0 && (
						<Notice tone="caution">
							No readable text was found. Try a sharper scan, or check that the text is English.
						</Notice>
					)}
					<p aria-live="polite">
						{task.result.ocrPages} {task.result.ocrPages === 1 ? "page" : "pages"} read with OCR (
						{task.result.words} words), {task.result.keptPages} already had text.
					</p>
					<ResultDownload
						blob={task.result.blob}
						name={suffixFilename(file.name, "searchable")}
						before={file.size}
						title="Your PDF is searchable"
					/>
				</>
			)}
			<p className="text-sm text-muted-foreground">
				Recognition can make mistakes, so check important passages. Pages are kept exactly as they
				are; the recognised text is added invisibly on top.
			</p>
			<PrivacyNote />
		</div>
	);
}
