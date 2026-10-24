import { suffixFilename } from "@qbtools/engines/files";
import {
	DEFAULT_WATERMARK,
	WATERMARK_LIMITS,
	type WatermarkedPdf,
	type WatermarkSettings,
	watermarkPdf,
} from "@qbtools/engines/pdf-watermark";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { formatBytes } from "@qbtools/ui/utils";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";
import { TaskProgress } from "#/components/kit/task-progress";
import { useTask } from "#/lib/processing/use-task";

export default function WatermarkPdf() {
	const [file, setFile] = useState<File | null>(null);
	const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_WATERMARK);
	const task = useTask<WatermarkedPdf>();
	const update = (patch: Partial<WatermarkSettings>) => {
		task.reset();
		setSettings((current) => ({ ...current, ...patch }));
	};
	const ready = Boolean(file && (settings.kind === "text" ? settings.text.trim() : settings.image));
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="application/pdf,.pdf"
				onFiles={(files) => {
					task.reset();
					setFile(files[0] ?? null);
				}}
				hint="Choose a PDF · up to 100 MiB"
			/>
			{file && (
				<p>
					<strong>{file.name}</strong> · {formatBytes(file.size)}
				</p>
			)}
			<Segmented
				label="Watermark type"
				value={settings.kind}
				onChange={(kind) => update({ kind })}
				options={[
					{ value: "text", label: "Text" },
					{ value: "image", label: "Image" },
				]}
			/>
			{settings.kind === "text" ? (
				<div className="grid gap-4 sm:grid-cols-[1fr_auto]">
					<Field label="Watermark text" htmlFor="wm-text">
						<Input
							id="wm-text"
							value={settings.text}
							maxLength={WATERMARK_LIMITS.textLength}
							disabled={task.busy}
							onChange={(e) => update({ text: e.target.value })}
						/>
					</Field>
					<Field label="Colour" htmlFor="wm-color">
						<input
							id="wm-color"
							type="color"
							value={settings.color}
							disabled={task.busy}
							className="h-10 w-16 cursor-pointer border border-input bg-transparent"
							onChange={(e) => update({ color: e.target.value })}
						/>
					</Field>
				</div>
			) : (
				<>
					<FileDrop
						compact
						accept="image/png,image/jpeg,.png,.jpg,.jpeg"
						onFiles={(files) => update({ image: files[0] ?? null })}
						title="Choose a watermark image"
						hint="PNG or JPG · up to 10 MiB. PNG keeps transparency."
					/>
					{settings.image && (
						<p>
							<strong>{settings.image.name}</strong> · {formatBytes(settings.image.size)}
						</p>
					)}
				</>
			)}
			<Segmented
				label="Layout"
				value={settings.layout}
				onChange={(layout) => update({ layout, size: layout === "tile" ? 25 : 70 })}
				options={[
					{ value: "center", label: "One stamp" },
					{ value: "tile", label: "Repeat across page" },
				]}
			/>
			<div className="grid gap-4 sm:grid-cols-3">
				<Slider
					id="wm-opacity"
					label="Opacity"
					valueLabel={`${Math.round(settings.opacity * 100)}%`}
					min={5}
					max={100}
					value={Math.round(settings.opacity * 100)}
					disabled={task.busy}
					onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
				/>
				<Slider
					id="wm-size"
					label="Size"
					valueLabel={`${settings.size}% of width`}
					min={5}
					max={100}
					value={settings.size}
					disabled={task.busy}
					onChange={(e) => update({ size: Number(e.target.value) })}
				/>
				<Slider
					id="wm-rotation"
					label="Rotation"
					valueLabel={`${settings.rotation}°`}
					min={-90}
					max={90}
					value={settings.rotation}
					disabled={task.busy}
					onChange={(e) => update({ rotation: Number(e.target.value) })}
				/>
			</div>
			<Field label="Pages (leave empty for all)" htmlFor="wm-pages">
				<Input
					id="wm-pages"
					value={settings.pages}
					placeholder="e.g. 1-3, 5"
					disabled={task.busy}
					onChange={(e) => update({ pages: e.target.value })}
				/>
			</Field>
			<Button
				disabled={!ready || task.busy}
				onClick={() => {
					if (!file) return;
					void task.run((options) => watermarkPdf(file, settings, options));
				}}
			>
				Add watermark
			</Button>
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.status === "cancelled" && <p>PDF processing cancelled.</p>}
			{task.result && file && (
				<ResultDownload
					blob={task.result.blob}
					name={suffixFilename(file.name, "watermarked")}
					before={file.size}
					title={`Stamped ${task.result.stamped} of ${task.result.pageCount} pages`}
				/>
			)}
			<PrivacyNote />
		</div>
	);
}
