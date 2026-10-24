import { suffixFilename } from "@qbtools/engines/files";
import type { OptimizedPdf } from "@qbtools/engines/pdf-optimize";
import { Button } from "@qbtools/ui/button";
import { Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { formatBytes } from "@qbtools/ui/utils";
import { useEffect, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";
import { TaskProgress } from "#/components/kit/task-progress";
import { useTask } from "#/lib/processing/use-task";
import { ProcessingWorker } from "#/lib/processing/worker-client";
import { strParam, type ToolWidgetProps } from "../types";

type Level = "light" | "recommended" | "strong";
export default function CompressPdf({ params }: ToolWidgetProps) {
	const preset = strParam(params, "level");
	const [file, setFile] = useState<File | null>(null);
	const [mode, setMode] = useState<"preserve" | "scans">(
		strParam(params, "mode") === "scans" ? "scans" : "preserve",
	);
	const [level, setLevel] = useState<Level>(
		preset === "strong" || preset === "light" ? preset : "recommended",
	);
	const [worker] = useState(() => new ProcessingWorker());
	const task = useTask<OptimizedPdf>();
	useEffect(() => () => worker.dispose(), [worker]);
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="application/pdf,.pdf"
				onFiles={(files) => {
					task.reset();
					setFile(files[0] ?? null);
				}}
				hint="Choose a PDF · Preserve text mode supports up to 100 MiB"
			/>
			{file && (
				<p>
					<strong>{file.name}</strong> · {formatBytes(file.size)}
				</p>
			)}
			<Segmented
				label="PDF compression mode"
				value={mode}
				onChange={(value) => {
					task.reset();
					setMode(value);
				}}
				options={[
					{ value: "preserve", label: "Preserve text" },
					{ value: "scans", label: "Compress scans" },
				]}
			/>
			{mode === "preserve" ? (
				<p>
					Optimize PDF structure while preserving text, links, bookmarks and forms. Rewriting a PDF
					can invalidate digital signatures.
				</p>
			) : (
				<>
					<Notice tone="caution">
						Scan compression turns pages into images. Text will no longer be selectable. Keep the
						original.
					</Notice>
					<Field label="Compression level" htmlFor="pdf-level">
						<Select
							id="pdf-level"
							value={level}
							disabled={task.busy}
							onChange={(e) => {
								task.reset();
								setLevel(e.target.value as Level);
							}}
						>
							<option value="light">Light — best quality</option>
							<option value="recommended">Recommended</option>
							<option value="strong">Strong — smallest file</option>
						</Select>
					</Field>
				</>
			)}
			<Button
				disabled={!file || task.busy}
				onClick={() => {
					if (!file) return;
					void task.run(async (options) => {
						if (mode === "preserve") return worker.run<OptimizedPdf>("pdf", file, options);
						const { compressPdf } = await import("@qbtools/engines/pdf-render");
						const blob = await compressPdf(
							file,
							level,
							(done, total) =>
								options.onProgress?.({
									stage: "processing",
									fraction: done / total,
									label: `Compressing page ${done} of ${total}`,
								}),
							options,
						);
						return { blob, decreased: blob.size < file.size, warnings: [] };
					});
				}}
			>
				Compress PDF
			</Button>
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.status === "cancelled" && <p>PDF processing cancelled.</p>}
			{task.result && file && (
				<>
					{!task.result.decreased && (
						<Notice tone="info">
							{mode === "preserve"
								? "Already optimized — your original is available below."
								: "This output is not smaller. Keep your original or try Strong."}
						</Notice>
					)}
					{task.result.warnings.map((warning) => (
						<Notice key={warning} tone="caution">
							{warning}
						</Notice>
					))}
					<ResultDownload
						blob={task.result.blob}
						name={
							mode === "preserve" && !task.result.decreased
								? file.name
								: suffixFilename(file.name, "compressed")
						}
						before={file.size}
						title={task.result.decreased ? "Compressed!" : "PDF ready"}
					/>
				</>
			)}
			<PrivacyNote />
		</div>
	);
}
