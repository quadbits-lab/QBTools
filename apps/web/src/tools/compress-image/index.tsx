import { replaceExtension } from "@qbtools/engines/files";
import {
	canEncodeWebp,
	compressToTarget,
	decodeImage,
	drawToCanvas,
	encodeCanvas,
	FORMAT_EXT,
	formatFromMime,
} from "@qbtools/engines/image";
import { Button } from "@qbtools/ui/button";
import { Input, Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { Switch } from "@qbtools/ui/switch";
import { cn } from "@qbtools/ui/utils";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { type FileJob, FileResults, makeJob, runJobs } from "#/components/kit/file-results";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { numParam, type ToolWidgetProps } from "../types";

const QUICK_KB = [20, 50, 100, 200, 500, 1024];
type OutFormat = "auto" | "jpeg" | "webp";

export default function CompressImage({ params }: ToolWidgetProps) {
	const presetKb = numParam(params, "targetKb");
	const [mode, setMode] = useState<"size" | "quality">("size");
	const [targetKb, setTargetKb] = useState(presetKb ?? 100);
	const [quality, setQuality] = useState(75);
	const [format, setFormat] = useState<OutFormat>("auto");
	const [allowResize, setAllowResize] = useState(true);
	const [jobs, setJobs] = useState<FileJob[]>([]);
	const busy = jobs.some((j) => j.status === "working" || j.status === "queued");

	const process = async (file: File) => {
		const bitmap = await decodeImage(file);
		try {
			const source = formatFromMime(file.type);
			let out: "jpeg" | "webp" = format === "auto" ? (source === "webp" ? "webp" : "jpeg") : format;
			if (out === "webp" && !(await canEncodeWebp())) out = "jpeg";
			const name = replaceExtension(file.name, FORMAT_EXT[out]);
			if (mode === "size") {
				const result = await compressToTarget(bitmap, {
					targetBytes: targetKb * 1024,
					format: out,
					allowResize,
				});
				const resized =
					result.width !== bitmap.width
						? `Resized to ${result.width}×${result.height}px to fit.`
						: undefined;
				return {
					blob: result.blob,
					name,
					note: result.reachedTarget
						? resized
						: `Couldn't reach ${targetKb}KB — this is the smallest we could make it. Try turning on “reduce dimensions”.`,
				};
			}
			const canvas = await drawToCanvas(bitmap, {
				width: bitmap.width,
				height: bitmap.height,
				background: out === "jpeg" ? "#ffffff" : undefined,
			});
			return { blob: await encodeCanvas(canvas, out, quality / 100), name };
		} finally {
			bitmap.close();
		}
	};

	const add = (files: File[]) => {
		const next = files.map(makeJob);
		setJobs((list) => [...list, ...next]);
		void runJobs(next, setJobs, process);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
				<FileDrop
					accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
					multiple
					onFiles={add}
					hint="JPG, PNG, WebP or HEIC · as many as you like"
				/>
				<div className="flex flex-col gap-5">
					<Segmented
						label="Compression mode"
						value={mode}
						onChange={setMode}
						options={[
							{ value: "size", label: "Target size" },
							{ value: "quality", label: "Quality slider" },
						]}
					/>
					{mode === "size" ? (
						<div className="flex flex-col gap-3">
							<Field label="Make each image smaller than" htmlFor="target-kb">
								<div className="flex items-center gap-2">
									<Input
										id="target-kb"
										type="number"
										inputMode="numeric"
										min={5}
										value={targetKb}
										onChange={(e) => setTargetKb(Math.max(5, Number(e.target.value) || 5))}
										className="w-32 font-mono text-lg"
									/>
									<span className="font-medium">KB</span>
								</div>
							</Field>
							<div className="flex flex-wrap gap-2" role="group" aria-label="Quick sizes">
								{QUICK_KB.map((kb) => (
									<button
										key={kb}
										type="button"
										onClick={() => setTargetKb(kb)}
										aria-pressed={targetKb === kb}
										className={cn(
											"min-h-10 cursor-pointer border px-4 font-medium",
											targetKb === kb
												? "border-primary bg-primary text-primary-foreground"
												: "border-border hover:border-primary",
										)}
									>
										{kb >= 1024 ? `${kb / 1024}MB` : `${kb}KB`}
									</button>
								))}
							</div>
							<label className="flex items-center gap-3 font-medium">
								<Switch checked={allowResize} onCheckedChange={setAllowResize} /> Also reduce
								dimensions if needed
							</label>
						</div>
					) : (
						<Slider
							id="quality"
							label="Quality"
							valueLabel={`${quality}%`}
							min={10}
							max={95}
							value={quality}
							onChange={(e) => setQuality(Number(e.target.value))}
						/>
					)}
					<Field label="Save as" htmlFor="out-format">
						<Select
							id="out-format"
							value={format}
							onChange={(e) => setFormat(e.target.value as OutFormat)}
							className="max-w-xs"
						>
							<option value="auto">Best for photos (JPG, keeps WebP)</option>
							<option value="jpeg">JPG</option>
							<option value="webp">WebP (smaller, keeps transparency)</option>
						</Select>
					</Field>
				</div>
			</div>
			{jobs.length > 0 && (
				<>
					<FileResults
						jobs={jobs}
						onRemove={(id) => setJobs((list) => list.filter((j) => j.id !== id))}
					/>
					<Button
						variant="ghost"
						className="self-start"
						disabled={busy}
						onClick={() => setJobs([])}
					>
						<RotateCcw /> Start over
					</Button>
				</>
			)}
			<PrivacyNote />
		</div>
	);
}
