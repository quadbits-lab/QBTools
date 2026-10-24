import { downloadBlob, suffixFilename } from "@qbtools/engines/files";
import {
	canEncodeWebp,
	decodeImage,
	drawToCanvas,
	encodeCanvas,
	FORMAT_EXT,
	formatFromMime,
	type ImageFormat,
} from "@qbtools/engines/image";
import { Button } from "@qbtools/ui/button";
import { Input, Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Switch } from "@qbtools/ui/switch";
import { formatBytes } from "@qbtools/ui/utils";
import { Download, Loader2, Lock, RotateCcw, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useObjectUrl } from "#/components/kit/use-object-url";
import { boolParam, numParam, strParam, type ToolWidgetProps } from "../types";

const PRESETS = [
	{ label: "Passport 35×45mm", w: 413, h: 531 },
	{ label: "Instagram square", w: 1080, h: 1080 },
	{ label: "Instagram portrait", w: 1080, h: 1350 },
	{ label: "Facebook cover", w: 820, h: 312 },
	{ label: "YouTube thumbnail", w: 1280, h: 720 },
	{ label: "WhatsApp DP", w: 500, h: 500 },
	{ label: "Full HD", w: 1920, h: 1080 },
];

type Fit = "stretch" | "contain" | "cover";

export default function ResizeImage({ params }: ToolWidgetProps) {
	const [file, setFile] = useState<File | null>(null);
	const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
	const [mode, setMode] = useState<"pixels" | "percent">("pixels");
	const [width, setWidth] = useState(numParam(params, "width") ?? 0);
	const [height, setHeight] = useState(numParam(params, "height") ?? 0);
	const [percent, setPercent] = useState(50);
	const [keepRatio, setKeepRatio] = useState(boolParam(params, "keepRatio") ?? true);
	const [fit, setFit] = useState<Fit>((strParam(params, "fit") as Fit | undefined) ?? "cover");
	const [format, setFormat] = useState<ImageFormat | "same">("same");
	const [result, setResult] = useState<Blob | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const presetSize = numParam(params, "width") !== undefined;
	const preview = useObjectUrl(result);

	useEffect(() => () => bitmap?.close(), [bitmap]);

	const load = async (files: File[]) => {
		const f = files[0];
		if (!f) return;
		setError(null);
		setResult(null);
		try {
			const bmp = await decodeImage(f);
			setFile(f);
			setBitmap(bmp);
			if (!presetSize) {
				setWidth(bmp.width);
				setHeight(bmp.height);
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't open this image.");
		}
	};

	const ratio = bitmap ? bitmap.width / bitmap.height : 1;
	const target =
		mode === "percent" && bitmap
			? {
					w: Math.max(1, Math.round((bitmap.width * percent) / 100)),
					h: Math.max(1, Math.round((bitmap.height * percent) / 100)),
				}
			: { w: width, h: height };

	const run = async () => {
		if (!bitmap || !file || target.w < 1 || target.h < 1) return;
		if (target.w * target.h > 50_000_000)
			return setError("That's too big — please keep it under about 7000×7000 pixels.");
		setPending(true);
		setError(null);
		try {
			let out: ImageFormat = format === "same" ? formatFromMime(file.type) : format;
			if (out === "webp" && !(await canEncodeWebp())) out = "jpeg";
			const canvas = await drawToCanvas(bitmap, {
				width: target.w,
				height: target.h,
				fit: mode === "percent" || keepRatio ? "stretch" : fit,
				background: out === "jpeg" ? "#ffffff" : undefined,
			});
			setResult(await encodeCanvas(canvas, out, 0.92));
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't resize this image.");
		} finally {
			setPending(false);
		}
	};

	if (!bitmap || !file) {
		return (
			<div className="flex flex-col gap-4">
				<FileDrop
					accept="image/*,.heic,.heif"
					onFiles={load}
					hint={
						presetSize ? `Will be resized to ${width}×${height} pixels` : "JPG, PNG, WebP or HEIC"
					}
				/>
				{error && <Notice tone="critical">{error}</Notice>}
				<PrivacyNote />
			</div>
		);
	}

	const ext = FORMAT_EXT[format === "same" ? formatFromMime(file.type) : format];
	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
			<div className="flex flex-col gap-5">
				<p className="text-sm text-muted-foreground">
					Original:{" "}
					<strong className="font-mono text-foreground">
						{bitmap.width}×{bitmap.height}px
					</strong>{" "}
					· {formatBytes(file.size)}
				</p>
				<Segmented
					label="Resize by"
					value={mode}
					onChange={setMode}
					options={[
						{ value: "pixels", label: "Pixels" },
						{ value: "percent", label: "Percentage" },
					]}
				/>
				{mode === "pixels" ? (
					<>
						<div className="flex items-end gap-2">
							<Field label="Width (px)" htmlFor="rs-w" className="flex-1">
								<Input
									id="rs-w"
									type="number"
									inputMode="numeric"
									min={1}
									value={width || ""}
									onChange={(e) => {
										const w = Number(e.target.value);
										setWidth(w);
										if (keepRatio) setHeight(Math.round(w / ratio));
									}}
									className="font-mono"
								/>
							</Field>
							<Button
								variant="ghost"
								size="icon"
								aria-label={keepRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
								aria-pressed={keepRatio}
								onClick={() => setKeepRatio(!keepRatio)}
							>
								{keepRatio ? <Lock /> : <Unlock />}
							</Button>
							<Field label="Height (px)" htmlFor="rs-h" className="flex-1">
								<Input
									id="rs-h"
									type="number"
									inputMode="numeric"
									min={1}
									value={height || ""}
									onChange={(e) => {
										const h = Number(e.target.value);
										setHeight(h);
										if (keepRatio) setWidth(Math.round(h * ratio));
									}}
									className="font-mono"
								/>
							</Field>
						</div>
						<label className="flex items-center gap-3 font-medium">
							<Switch checked={keepRatio} onCheckedChange={setKeepRatio} /> Keep aspect ratio
						</label>
						{!keepRatio && (
							<Field label="If the shape changes" htmlFor="rs-fit">
								<Select id="rs-fit" value={fit} onChange={(e) => setFit(e.target.value as Fit)}>
									<option value="cover">Crop to fill (recommended)</option>
									<option value="contain">Fit inside with borders</option>
									<option value="stretch">Stretch</option>
								</Select>
							</Field>
						)}
						<div className="flex flex-wrap gap-2" role="group" aria-label="Ready-made sizes">
							{PRESETS.map((p) => (
								<button
									key={p.label}
									type="button"
									onClick={() => {
										setKeepRatio(false);
										setWidth(p.w);
										setHeight(p.h);
										setFit("cover");
									}}
									className="min-h-10 cursor-pointer border border-border px-3 text-sm font-medium hover:border-primary"
								>
									{p.label}
								</button>
							))}
						</div>
					</>
				) : (
					<Field label={`Scale to ${percent}% → ${target.w}×${target.h}px`} htmlFor="rs-pct">
						<input
							id="rs-pct"
							type="range"
							min={5}
							max={200}
							step={5}
							value={percent}
							onChange={(e) => setPercent(Number(e.target.value))}
							className="h-8 w-full cursor-pointer"
						/>
					</Field>
				)}
				<Field label="Save as" htmlFor="rs-format">
					<Select
						id="rs-format"
						value={format}
						onChange={(e) => setFormat(e.target.value as ImageFormat | "same")}
						className="max-w-xs"
					>
						<option value="same">Same as original</option>
						<option value="jpeg">JPG</option>
						<option value="png">PNG</option>
						<option value="webp">WebP</option>
					</Select>
				</Field>
				<div className="flex flex-wrap gap-2">
					<Button size="lg" onClick={run} disabled={pending || target.w < 1 || target.h < 1}>
						{pending && <Loader2 className="animate-spin" />} Resize to {target.w}×{target.h}
					</Button>
					<Button
						size="lg"
						variant="ghost"
						onClick={() => {
							setFile(null);
							setBitmap(null);
							setResult(null);
						}}
					>
						<RotateCcw /> New image
					</Button>
				</div>
				{error && <Notice tone="critical">{error}</Notice>}
			</div>
			<div className="flex flex-col gap-3">
				<div className="checker-bg grid min-h-64 place-items-center overflow-hidden border border-border">
					{preview ? (
						<img
							src={preview}
							alt="Resized result"
							className="max-h-96 max-w-full object-contain"
						/>
					) : (
						<p className="text-slate-500">Your resized image will appear here</p>
					)}
				</div>
				{result && (
					<Button
						size="lg"
						onClick={() =>
							downloadBlob(result, suffixFilename(file.name, `${target.w}x${target.h}`, ext))
						}
					>
						<Download /> Download ({formatBytes(result.size)})
					</Button>
				)}
				<PrivacyNote />
			</div>
		</div>
	);
}
