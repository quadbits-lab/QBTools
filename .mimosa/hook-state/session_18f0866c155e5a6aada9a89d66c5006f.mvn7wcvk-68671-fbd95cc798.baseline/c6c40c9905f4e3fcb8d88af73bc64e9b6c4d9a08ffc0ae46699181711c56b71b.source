import { downloadBlob, replaceExtension } from "@qbtools/engines/files";
import type { ExtractedText, OcrLanguage, OcrSession } from "@qbtools/engines/ocr";
import { Button } from "@qbtools/ui/button";
import { Field } from "@qbtools/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
import { useEffect, useRef, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { SaveToMedia } from "#/components/kit/save-to-media";
import { TaskProgress } from "#/components/kit/task-progress";
import { useTask } from "#/lib/processing/use-task";
import { ProcessingWorker } from "#/lib/processing/worker-client";
export default function ExtractText() {
	const [file, setFile] = useState<File | null>(null);
	const [language, setLanguage] = useState<OcrLanguage>("eng");
	const [forceOcr, setForceOcr] = useState(false);
	const [text, setText] = useState("");
	const [copyMessage, setCopyMessage] = useState("");
	const session = useRef<OcrSession | null>(null);
	const task = useTask<ExtractedText>();
	useEffect(() => () => session.current?.dispose(), []);
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="image/*,application/pdf,.pdf,.heic,.heif"
				title="Choose an image or PDF to extract text"
				hint="Up to 50 MiB · 50 PDF pages · images up to 24 megapixels"
				onFiles={(files) => {
					task.reset();
					setText("");
					setFile(files[0] ?? null);
				}}
			/>
			{file && <p>{file.name}</p>}
			<Field label="Text language" htmlFor="ocr-language">
				<Select
					value={language}
					disabled={task.busy}
					onValueChange={(val) => {
						task.reset();
						setText("");
						setLanguage(val as OcrLanguage);
					}}
				>
					<SelectTrigger id="ocr-language" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="eng">English</SelectItem>
						<SelectItem value="ara">Arabic</SelectItem>
						<SelectItem value="eng+ara">English + Arabic</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<label className="flex gap-2">
				<input
					type="checkbox"
					checked={forceOcr}
					disabled={task.busy}
					onChange={(e) => {
						task.reset();
						setText("");
						setForceOcr(e.target.checked);
					}}
				/>
				Force OCR on all PDF pages
			</label>
			<Button
				disabled={!file || task.busy}
				onClick={() => {
					if (!file) return;
					setText("");
					setCopyMessage("");
					void task.run(async (options) => {
						const engine = await import("@qbtools/engines/ocr");
						session.current ??= new engine.OcrSession(new ProcessingWorker());
						return engine.extractText(file, {
							...options,
							language,
							forceOcr,
							session: session.current,
						});
					});
				}}
			>
				Extract text
			</Button>
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.status === "cancelled" && <p>Text extraction cancelled.</p>}
			{task.result && (
				<OcrResults
					result={task.result}
					text={text}
					setText={setText}
					language={language}
					file={file}
					copyMessage={copyMessage}
					setCopyMessage={setCopyMessage}
				/>
			)}
			<p className="text-sm text-muted-foreground">
				PDF text is read directly where available. Scanned pages use OCR; check the result for
				recognition errors. Downloads preserve page order using page separators.
			</p>
			<PrivacyNote />
		</div>
	);
}
function OcrResults({
	result,
	text,
	setText,
	language,
	file,
	copyMessage,
	setCopyMessage,
}: {
	result: ExtractedText;
	text: string;
	setText: (text: string) => void;
	language: OcrLanguage;
	file: File | null;
	copyMessage: string;
	setCopyMessage: (text: string) => void;
}) {
	useEffect(() => setText(result.text), [result, setText]);
	return (
		<div className="flex flex-col gap-3">
			{result.pages.map((page) => (
				<p key={page.page}>
					Page {page.page}: {page.method === "ocr" ? "OCR" : "Existing text"}
					{page.warning && ` — ${page.warning}`}
				</p>
			))}
			<label className="flex flex-col gap-2">
				Extracted text
				<textarea
					aria-label="Extracted text"
					dir={language === "ara" ? "rtl" : "auto"}
					rows={14}
					className="border border-input p-3"
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>
			</label>
			<div className="flex gap-3">
				<Button
					onClick={async () => {
						try {
							await navigator.clipboard.writeText(text);
							setCopyMessage("Text copied.");
						} catch {
							setCopyMessage("Select and copy the text manually.");
						}
					}}
				>
					Copy text
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						downloadBlob(
							new Blob([text], { type: "text/plain;charset=utf-8" }),
							replaceExtension(file?.name ?? "extracted", "txt"),
						)
					}
				>
					Download TXT
				</Button>
				<SaveToMedia
					name={replaceExtension(file?.name ?? "extracted", "txt")}
					prepare={async () => new Blob([text], { type: "text/plain;charset=utf-8" })}
				/>
			</div>
			<p aria-live="polite">{copyMessage}</p>
		</div>
	);
}
