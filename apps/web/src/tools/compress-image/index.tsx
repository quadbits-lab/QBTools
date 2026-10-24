import { replaceExtension } from "@qbtools/engines/files";
import {
	compressToTarget,
	decodeImage,
	drawToCanvas,
	formatFromMime,
} from "@qbtools/engines/image";
import type { EncodingMode, OptimizedFormat } from "@qbtools/engines/image-codecs";
import { checkAbort, checkImageSize } from "@qbtools/engines/processing";
import { Button } from "@qbtools/ui/button";
import { Input, Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { Switch } from "@qbtools/ui/switch";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { FileResults } from "#/components/kit/file-results";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useFileQueue } from "#/lib/processing/use-file-queue";
import { OUTPUT_EXT, useImageEncoder } from "#/lib/processing/use-image-encoder";
import { numParam, type ToolWidgetProps } from "../types";
export default function CompressImage({ params }: ToolWidgetProps) {
	const [mode, setMode] = useState<"size" | "quality">("size");
	const [encoding, setEncoding] = useState<EncodingMode>("fast");
	const [targetKb, setTargetKb] = useState(numParam(params, "targetKb") ?? 100);
	const [quality, setQuality] = useState(75);
	const [format, setFormat] = useState<"auto" | OptimizedFormat>("auto");
	const [allowResize, setAllowResize] = useState(true);
	const { jobs, queue } = useFileQueue();
	const encode = useImageEncoder();
	const add = (files: File[]) =>
		queue.add(files, async (file, options) => {
			const bitmap = await decodeImage(file);
			try {
				checkAbort(options.signal);
				const source = formatFromMime(file.type);
				const out = format === "auto" ? (source === "webp" ? "webp" : "jpeg") : format;
				const optimized = encoding === "optimized" || out === "avif";
				if (optimized) checkImageSize(bitmap.width, bitmap.height);
				const name = replaceExtension(file.name, OUTPUT_EXT[out]);
				const save = (canvas: HTMLCanvasElement, q: number) =>
					encode(canvas, out, q, optimized ? "optimized" : "fast", options);
				if (mode === "size" && out !== "png") {
					const result = await compressToTarget(bitmap, {
						...options,
						targetBytes: targetKb * 1024,
						format: out,
						allowResize,
						optimized,
						encode: save,
					});
					return {
						blob: result.blob,
						name,
						note: !result.reachedTarget
							? `Couldn't reach ${targetKb}KB. Try a larger target or allow smaller dimensions.`
							: result.width !== bitmap.width
								? `Resized to ${result.width}×${result.height}px.`
								: undefined,
					};
				}
				const canvas = await drawToCanvas(bitmap, {
					width: bitmap.width,
					height: bitmap.height,
					background: out === "jpeg" ? "#ffffff" : undefined,
				});
				return { blob: await save(canvas, quality / 100), name };
			} finally {
				bitmap.close();
			}
		});
	return (
		<div className="flex flex-col gap-6">
			<FileDrop
				accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif"
				multiple
				onFiles={add}
				hint="JPG, PNG, WebP, AVIF or HEIC · files run one at a time"
			/>
			<Segmented
				label="Encoding mode"
				value={encoding}
				onChange={(value) => {
					setEncoding(value);
					if (value === "fast" && format === "avif") setFormat("jpeg");
				}}
				options={[
					{ value: "fast", label: "Fast" },
					{ value: "optimized", label: "Optimized" },
				]}
			/>
			<Field label="Save as" htmlFor="compress-format">
				<Select
					id="compress-format"
					value={format}
					onChange={(e) => {
						const value = e.target.value as typeof format;
						setFormat(value);
						if (value === "avif") setEncoding("optimized");
					}}
				>
					<option value="auto">Best for photos (JPG, keeps WebP)</option>
					<option value="jpeg">JPG</option>
					<option value="webp">WebP</option>
					<option value="png">PNG (lossless)</option>
					<option value="avif">AVIF (optimized)</option>
				</Select>
			</Field>
			{format === "png" ? (
				<p>
					PNG preserves transparency without quality loss. Final size depends on the image contents.
				</p>
			) : (
				<>
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
							<Field label="Make each image smaller than (KB)" htmlFor="target-kb">
								<Input
									id="target-kb"
									type="number"
									min={5}
									value={targetKb}
									onChange={(e) => setTargetKb(Math.max(5, Number(e.target.value) || 5))}
								/>
							</Field>
							<div className="flex flex-wrap gap-2">
								{[20, 50, 100, 200, 500, 1024].map((kb) => (
									<Button key={kb} variant="outline" onClick={() => setTargetKb(kb)}>
										{kb} KB
									</Button>
								))}
							</div>
							<label className="flex items-center gap-3">
								<Switch checked={allowResize} onCheckedChange={setAllowResize} />
								Also reduce dimensions if needed
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
				</>
			)}
			{encoding === "optimized" && (
				<p className="text-sm text-muted-foreground">
					More encoder controls, with additional loading and processing time. Quality values differ
					between formats. Maximum 24 megapixels.
				</p>
			)}
			<FileResults jobs={jobs} onRemove={(id) => queue.remove(id)} />
			{jobs.length > 0 && (
				<Button variant="ghost" onClick={() => queue.clear()}>
					Clear files and cancel processing
				</Button>
			)}
			<PrivacyNote />
		</div>
	);
}
