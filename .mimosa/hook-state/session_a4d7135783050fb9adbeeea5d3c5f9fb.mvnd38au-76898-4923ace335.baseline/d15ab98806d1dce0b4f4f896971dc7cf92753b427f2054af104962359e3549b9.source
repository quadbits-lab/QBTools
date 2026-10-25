/** Export, deployment metadata and project-file controls. */
import type { RenderedDesign } from "@qbtools/engines/graphic";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Switch } from "@qbtools/ui/switch";
import { formatBytes } from "@qbtools/ui/utils";
import { Download, FileDown, Loader2 } from "lucide-react";
import { CopyButton } from "#/components/kit/copy-button";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { Section } from "#/components/kit/section";
import { useObjectUrl } from "#/components/kit/use-object-url";

export function ExportSection({
	format,
	onFormatChange,
	scale,
	onScaleChange,
	optimize,
	onOptimizeChange,
	onExport,
	exportBusy,
	exportError,
	exportResult,
	exportName,
	onDownload,
}: {
	format: "png" | "jpeg" | "webp";
	onFormatChange: (f: "png" | "jpeg" | "webp") => void;
	scale: "1x" | "2x";
	onScaleChange: (s: "1x" | "2x") => void;
	optimize: boolean;
	onOptimizeChange: (v: boolean) => void;
	onExport: () => void;
	exportBusy: boolean;
	exportError: string | null;
	exportResult: RenderedDesign | null;
	exportName: string;
	onDownload: () => void;
}) {
	const resultUrl = useObjectUrl(exportResult?.blob);
	return (
		<Section title="Image file">
			<div className="grid grid-cols-2 gap-3">
				<Field label="Format">
					<Segmented
						label="Format"
						value={format}
						onChange={onFormatChange}
						options={[
							{ value: "png", label: "PNG" },
							{ value: "jpeg", label: "JPG" },
							{ value: "webp", label: "WebP" },
						]}
					/>
				</Field>
				<Field label="Scale">
					<Segmented
						label="Scale"
						value={scale}
						onChange={(v) => onScaleChange(v as "1x" | "2x")}
						options={[
							{ value: "1x", label: "1×" },
							{ value: "2x", label: "2×" },
						]}
					/>
				</Field>
			</div>
			<div className="flex items-center justify-between rounded-lg border border-input px-3 py-2.5">
				<span className="text-sm">Extra PNG compression</span>
				<Switch
					checked={optimize}
					onCheckedChange={onOptimizeChange}
					aria-label="Optimize file sizes"
				/>
			</div>
			<Button size="lg" className="w-full" onClick={onExport} disabled={exportBusy}>
				{exportBusy ? <Loader2 className="animate-spin" /> : <FileDown />} Export image
			</Button>
			{exportError ? <Notice tone="critical">{exportError}</Notice> : null}
			{exportResult ? (
				<div className="flex items-center gap-3 rounded-lg border border-input bg-surface-2 p-3">
					{resultUrl ? (
						<img
							src={resultUrl}
							alt="Exported banner"
							className="h-14 w-24 shrink-0 rounded-md object-cover outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
						/>
					) : null}
					<div className="flex min-w-0 flex-col gap-1.5">
						<p className="truncate text-sm">
							{exportName} · <strong>{formatBytes(exportResult.blob.size)}</strong>
						</p>
						<Button size="sm" variant="secondary" className="self-start" onClick={onDownload}>
							<Download /> Download
						</Button>
					</div>
				</div>
			) : null}
		</Section>
	);
}

export function MetadataSection({
	imageUrl,
	onImageUrlChange,
	snippet,
	previewUrl,
	canvas,
}: {
	imageUrl: string;
	onImageUrlChange: (url: string) => void;
	snippet: string;
	previewUrl?: string;
	canvas: { width: number; height: number };
}) {
	const ratio = canvas.width / canvas.height;
	const cardWidth = Math.round(84 * ratio);
	return (
		<Section title="Deployment">
			<Field label="Image URL" hint="Used in the copied metadata snippet">
				<Input value={imageUrl} onChange={(e) => onImageUrlChange(e.target.value)} />
			</Field>
			<CopyButton text={snippet} label="Copy OG/Twitter metadata" />
			<div>
				<span className="label-mono text-subtle">How it will appear</span>
				<div className="mt-2 flex flex-wrap items-end gap-3">
					<div className="flex flex-col items-center gap-1.5">
						<div
							className="overflow-hidden rounded-lg bg-surface-2 outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
							style={{ width: cardWidth, height: 84 }}
						>
							{previewUrl ? (
								<img src={previewUrl} alt="Link card preview" className="size-full object-cover" />
							) : null}
						</div>
						<span className="label-mono text-subtle">Link card</span>
					</div>
					<div className="flex flex-col items-center gap-1.5">
						<div className="size-14 overflow-hidden rounded-full bg-surface-2 outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10">
							{previewUrl ? (
								<img src={previewUrl} alt="Chat preview" className="size-full object-cover" />
							) : null}
						</div>
						<span className="label-mono text-subtle">Chat</span>
					</div>
				</div>
			</div>
		</Section>
	);
}

export function ProjectSection({
	onSaveProject,
	onLoadProject,
	projectError,
	autosaveHint,
}: {
	onSaveProject: () => void;
	onLoadProject: (files: File[]) => void;
	projectError: string | null;
	autosaveHint?: string;
}) {
	return (
		<Section title="Project file" eyebrow="Editable design">
			<Button variant="secondary" size="sm" className="self-start" onClick={onSaveProject}>
				<Download /> Save project (.qbdesign.json)
			</Button>
			<FileDrop
				accept=".json,application/json,.qbdesign.json"
				onFiles={onLoadProject}
				compact
				title="Import project file"
				hint="Restores an editable design saved from this editor"
			/>
			{autosaveHint ? <p className="text-xs text-muted-foreground">{autosaveHint}</p> : null}
			{projectError ? <Notice tone="critical">{projectError}</Notice> : null}
		</Section>
	);
}
