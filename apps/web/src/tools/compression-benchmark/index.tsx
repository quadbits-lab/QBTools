import type { BenchmarkRow } from "@qbtools/engines/compression";
import { downloadBlob } from "@qbtools/engines/files";
import { LIMITS } from "@qbtools/engines/processing";
import { Button } from "@qbtools/ui/button";
import { Segmented } from "@qbtools/ui/segmented";
import { formatBytes } from "@qbtools/ui/utils";
import { useEffect, useMemo, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { TaskProgress } from "#/components/kit/task-progress";
import { useTask } from "#/lib/processing/use-task";
import { ProcessingWorker } from "#/lib/processing/worker-client";

type Sort = "size" | "speed";
const percent = (ratio: number) => `${(ratio * 100).toFixed(ratio < 0.1 ? 1 : 0)}%`;
const milliseconds = (ms: number) =>
	ms < 1000 ? `${Math.max(1, Math.round(ms))} ms` : `${(ms / 1000).toFixed(1)} s`;

export default function CompressionBenchmark() {
	const [file, setFile] = useState<File | null>(null);
	const [sort, setSort] = useState<Sort>("size");
	const [worker] = useState(() => new ProcessingWorker());
	const task = useTask<BenchmarkRow[]>();
	useEffect(() => () => worker.dispose(), [worker]);
	const rows = useMemo(
		() =>
			[...(task.result ?? [])].sort((a, b) => (sort === "size" ? a.bytes - b.bytes : a.ms - b.ms)),
		[task.result, sort],
	);
	const smallest = Math.min(...rows.map((row) => row.bytes));
	const fastest = Math.min(...rows.map((row) => row.ms));
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="*/*"
				title="Choose a file to compress"
				hint="Any file up to 50 MiB · text, JSON, CSS and logs shrink the most"
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
			{file && file.size > LIMITS.benchmarkBytes && (
				<Notice tone="critical">This file is over 50 MiB. Choose a smaller one.</Notice>
			)}
			<Button
				disabled={!file || task.busy || (file?.size ?? 0) > LIMITS.benchmarkBytes}
				onClick={() => {
					if (file)
						void task.run((options) => worker.run<BenchmarkRow[]>("benchmark", file, options));
				}}
			>
				Run benchmark
			</Button>
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.status === "cancelled" && <p>Benchmark cancelled.</p>}
			{file && rows.length > 0 && (
				<div className="flex flex-col gap-4" aria-live="polite">
					<Segmented
						label="Sort results by"
						value={sort}
						onChange={setSort}
						options={[
							{ value: "size", label: "Smallest first" },
							{ value: "speed", label: "Fastest first" },
						]}
					/>
					{rows.every((row) => row.ratio > 0.95) && (
						<Notice tone="info">
							This file barely shrinks. It is probably already compressed, like an image, video or
							archive.
						</Notice>
					)}
					<div className="overflow-x-auto">
						<table className="w-full min-w-[34rem] text-left text-sm">
							<caption className="sr-only">Compression results for {file.name}</caption>
							<thead>
								<tr className="label-mono">
									<th scope="col" className="py-2 pr-3">
										Method
									</th>
									<th scope="col" className="py-2 pr-3">
										Size
									</th>
									<th scope="col" className="py-2 pr-3">
										Of original
									</th>
									<th scope="col" className="py-2 pr-3">
										Time
									</th>
									<th scope="col" className="py-2 pr-3">
										Checked
									</th>
									<th scope="col" className="py-2">
										<span className="sr-only">Download</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr key={row.id} className="border-t border-input">
										<th scope="row" className="py-2 pr-3 font-medium">
											{row.label}
										</th>
										<td className="py-2 pr-3">
											{formatBytes(row.bytes)}
											{row.bytes === smallest && <span className="ml-2 text-xs">smallest</span>}
										</td>
										<td className="py-2 pr-3">{percent(row.ratio)}</td>
										<td className="py-2 pr-3">
											{milliseconds(row.ms)}
											{row.ms === fastest && <span className="ml-2 text-xs">fastest</span>}
										</td>
										<td className="py-2 pr-3">{row.verified ? "Yes" : "Mismatch"}</td>
										<td className="py-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => downloadBlob(row.blob, `${file.name}.${row.extension}`)}
											>
												Download
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<p className="text-sm text-muted-foreground">
						Every result was decompressed and compared with your original. Times depend on your
						device; use them to compare methods, not as absolute speeds. Gzip and deflate use your
						browser's default level.
					</p>
				</div>
			)}
			<PrivacyNote />
		</div>
	);
}
