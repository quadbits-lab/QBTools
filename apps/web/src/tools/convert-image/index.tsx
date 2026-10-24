import { replaceExtension } from "@qbtools/engines/files";
import { decodeImage, drawToCanvas } from "@qbtools/engines/image";
import type { EncodingMode, OptimizedFormat } from "@qbtools/engines/image-codecs";
import { checkAbort, checkImageSize } from "@qbtools/engines/processing";
import { Button } from "@qbtools/ui/button";
import { Input, Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { FileResults } from "#/components/kit/file-results";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useFileQueue } from "#/lib/processing/use-file-queue";
import { OUTPUT_EXT, useImageEncoder } from "#/lib/processing/use-image-encoder";
import { strParam, type ToolWidgetProps } from "../types";
export default function ConvertImage({ params }: ToolWidgetProps) {
	const preset = strParam(params, "to");
	const [to, setTo] = useState<OptimizedFormat>(
		preset === "png" || preset === "webp" || preset === "avif" ? preset : "jpeg",
	);
	const [mode, setMode] = useState<EncodingMode>(preset === "avif" ? "optimized" : "fast");
	const [quality, setQuality] = useState(90);
	const [background, setBackground] = useState("#ffffff");
	const { jobs, queue } = useFileQueue();
	const encode = useImageEncoder();
	const add = (files: File[]) =>
		queue.add(files, async (file, options) => {
			const bitmap = await decodeImage(file);
			try {
				checkAbort(options.signal);
				if (mode === "optimized" || to === "avif") checkImageSize(bitmap.width, bitmap.height);
				const canvas = await drawToCanvas(bitmap, {
					width: bitmap.width,
					height: bitmap.height,
					background: to === "jpeg" ? background : undefined,
				});
				return {
					blob: await encode(canvas, to, quality / 100, mode, options),
					name: replaceExtension(file.name, OUTPUT_EXT[to]),
				};
			} finally {
				bitmap.close();
			}
		});
	return (
		<div className="flex flex-col gap-6">
			<FileDrop
				accept="image/*,.heic,.heif"
				multiple
				onFiles={add}
				hint="JPG, PNG, WebP, GIF, BMP, AVIF or HEIC · still images only"
			/>
			<Segmented
				label="Encoding mode"
				value={mode}
				onChange={(value) => {
					setMode(value);
					if (value === "fast" && to === "avif") setTo("jpeg");
				}}
				options={[
					{ value: "fast", label: "Fast" },
					{ value: "optimized", label: "Optimized" },
				]}
			/>
			<Field label="Convert to" htmlFor="convert-to">
				<Select
					id="convert-to"
					value={to}
					onChange={(e) => {
						const value = e.target.value as OptimizedFormat;
						setTo(value);
						if (value === "avif") setMode("optimized");
					}}
				>
					{Object.entries(OUTPUT_EXT).map(([format, ext]) => (
						<option key={format} value={format}>
							{ext.toUpperCase()}
						</option>
					))}
				</Select>
			</Field>
			{to !== "png" && (
				<Slider
					id="cv-quality"
					label="Quality"
					valueLabel={`${quality}%`}
					min={40}
					max={100}
					value={quality}
					onChange={(e) => setQuality(Number(e.target.value))}
				/>
			)}
			{to === "jpeg" && (
				<Field label="Background for transparent areas" htmlFor="cv-bg">
					<Input
						id="cv-bg"
						type="color"
						value={background}
						onChange={(e) => setBackground(e.target.value)}
					/>
				</Field>
			)}
			<p className="text-sm text-muted-foreground">
				PNG preserves pixels and transparency. Optimized mode supports images up to 24 megapixels.
				Quality values differ between formats. Settings apply to newly added files.
			</p>
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
