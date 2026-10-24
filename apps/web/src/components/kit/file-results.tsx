import { downloadBlob, zipFiles } from "@qbtools/engines/files";
import { Badge } from "@qbtools/ui/badge";
import { Button } from "@qbtools/ui/button";
import { formatBytes } from "@qbtools/ui/utils";
import { AlertCircle, ArrowRight, Download, FileArchive, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useObjectUrl } from "./use-object-url";

export type { FileJob } from "../../lib/processing/file-jobs";
export { makeJob } from "../../lib/processing/file-jobs";

import type { FileJob } from "../../lib/processing/file-jobs";

function Thumb({ blob }: { blob?: Blob }) {
	const url = useObjectUrl(blob?.type.startsWith("image/") ? blob : undefined);
	return (
		<span className="checker-bg grid size-16 shrink-0 place-items-center overflow-hidden border border-border">
			{url ? <img src={url} alt="" className="max-h-full max-w-full object-contain" /> : null}
		</span>
	);
}

/** List of processed files with before → after sizes and downloads. */
export function FileResults({
	jobs,
	onRemove,
}: {
	jobs: FileJob[];
	onRemove?: (id: string) => void;
}) {
	const [zipping, setZipping] = useState(false);
	const done = jobs.filter((j) => j.status === "done" && j.result);
	const totalBefore = done.reduce((s, j) => s + j.file.size, 0);
	const totalAfter = done.reduce((s, j) => s + (j.result?.blob.size ?? 0), 0);

	return (
		<div className="flex flex-col gap-3">
			<ul className="flex flex-col gap-2" aria-live="polite">
				{jobs.map((job) => {
					const saved = job.result ? 1 - job.result.blob.size / job.file.size : 0;
					return (
						<li
							key={job.id}
							className="flex flex-wrap items-center gap-3 border border-border p-3 sm:flex-nowrap"
						>
							<Thumb blob={job.result?.blob ?? job.file} />
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">{job.result?.name ?? job.file.name}</p>
								<p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
									<span className="font-mono">{formatBytes(job.file.size)}</span>
									{job.result && (
										<>
											<ArrowRight className="size-3.5" />
											<span className="font-mono font-medium text-foreground">
												{formatBytes(job.result.blob.size)}
											</span>
											{saved > 0.005 ? (
												<Badge tone="positive">−{Math.round(saved * 100)}%</Badge>
											) : (
												<Badge>
													{saved < -0.005 ? `+${Math.round(-saved * 100)}%` : "same size"}
												</Badge>
											)}
										</>
									)}
								</p>
								{job.result?.note && <p className="text-sm text-caution">{job.result.note}</p>}
								{job.error && (
									<p className="flex items-center gap-1 text-sm text-critical">
										<AlertCircle className="size-4" /> {job.error}
									</p>
								)}
							</div>
							<div className="flex items-center gap-1">
								{["working", "queued", "loading", "processing"].includes(job.status) ? (
									<span className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
										<Loader2 className="size-4 animate-spin" />{" "}
										{job.progress?.label ?? (job.status === "queued" ? "Waiting…" : "Working…")}
									</span>
								) : job.result ? (
									<Button
										onClick={() => job.result && downloadBlob(job.result.blob, job.result.name)}
									>
										<Download /> Download
									</Button>
								) : null}
								{onRemove && (
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={`Remove ${job.file.name}`}
										onClick={() => onRemove(job.id)}
									>
										<X className="size-4" />
									</Button>
								)}
							</div>
						</li>
					);
				})}
			</ul>
			{done.length > 1 && (
				<div className="flex flex-wrap items-center justify-between gap-3 border border-foreground p-4">
					<p>
						<strong>{done.length} files</strong> · {formatBytes(totalBefore)} →{" "}
						<strong>{formatBytes(totalAfter)}</strong>
						{totalBefore > totalAfter && (
							<> (saved {Math.round((1 - totalAfter / totalBefore) * 100)}%)</>
						)}
					</p>
					<Button
						size="lg"
						disabled={zipping}
						onClick={async () => {
							setZipping(true);
							try {
								downloadBlob(
									await zipFiles(
										done.map((j) => ({
											name: j.result?.name ?? j.file.name,
											blob: j.result?.blob as Blob,
										})),
									),
									"qbtools-files.zip",
								);
							} finally {
								setZipping(false);
							}
						}}
					>
						{zipping ? <Loader2 className="animate-spin" /> : <FileArchive />} Download all (ZIP)
					</Button>
				</div>
			)}
		</div>
	);
}

/** Run jobs one at a time (keeps memory low on phones), updating state as they finish. */
export async function runJobs(
	jobs: FileJob[],
	setJobs: React.Dispatch<React.SetStateAction<FileJob[]>>,
	work: (file: File) => Promise<FileJob["result"]>,
) {
	for (const job of jobs) {
		setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, status: "working" } : j)));
		try {
			const result = await work(job.file);
			setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, status: "done", result } : j)));
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Something went wrong with this file.";
			setJobs((list) =>
				list.map((j) => (j.id === job.id ? { ...j, status: "error", error: message } : j)),
			);
		}
	}
}
