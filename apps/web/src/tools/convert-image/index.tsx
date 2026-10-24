import { replaceExtension } from "@qbtools/engines/files";
import {
	canEncodeWebp,
	decodeImage,
	drawToCanvas,
	encodeCanvas,
	FORMAT_EXT,
	type ImageFormat,
} from "@qbtools/engines/image";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { type FileJob, FileResults, makeJob, runJobs } from "#/components/kit/file-results";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { strParam, type ToolWidgetProps } from "../types";

const TARGETS: { value: ImageFormat; label: string }[] = [
	{ value: "jpeg", label: "JPG" },
	{ value: "png", label: "PNG" },
	{ value: "webp", label: "WebP" },
];

export default function ConvertImage({ params }: ToolWidgetProps) {
	const preset = strParam(params, "to");
	const [to, setTo] = useState<ImageFormat>(
		preset === "png" ? "png" : preset === "webp" ? "webp" : "jpeg",
	);
	const [quality, setQuality] = useState(90);
	const [background, setBackground] = useState("#ffffff");
	const [jobs, setJobs] = useState<FileJob[]>([]);
	const [webpOk, setWebpOk] = useState(true);
	useEffect(() => void canEncodeWebp().then(setWebpOk), []);
	const busy = jobs.some((j) => j.status === "working" || j.status === "queued");

	const process = async (file: File) => {
		const bitmap = await decodeImage(file);
		try {
			const canvas = await drawToCanvas(bitmap, {
				width: bitmap.width,
				height: bitmap.height,
				background: to === "jpeg" ? background : undefined,
			});
			return {
				blob: await encodeCanvas(canvas, to, quality / 100),
				name: replaceExtension(file.name, FORMAT_EXT[to]),
			};
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
			<div className="grid gap-5 lg:grid-cols-2">
				<FileDrop
					accept="image/*,.heic,.heif"
					multiple
					onFiles={add}
					hint="JPG, PNG, WebP, GIF, BMP, AVIF or iPhone HEIC"
				/>
				<div className="flex flex-col gap-5">
					<div>
						<p className="mb-2 font-medium">Convert to</p>
						<Segmented label="Convert to" value={to} onChange={setTo} options={TARGETS} />
					</div>
					{to === "webp" && !webpOk && (
						<Notice tone="caution">
							Your browser can't save WebP, so files will be saved as JPG instead. Try Chrome, Edge
							or Firefox.
						</Notice>
					)}
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
						<Field
							label="Background for transparent areas"
							htmlFor="cv-bg"
							hint="JPG can't be see-through, so transparent parts get this color."
						>
							<Input
								id="cv-bg"
								type="color"
								value={background}
								onChange={(e) => setBackground(e.target.value)}
								className="w-24 cursor-pointer p-1"
							/>
						</Field>
					)}
					<p className="text-sm text-muted-foreground">
						Changed your mind? Pick a new format, then add the files again.
					</p>
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
