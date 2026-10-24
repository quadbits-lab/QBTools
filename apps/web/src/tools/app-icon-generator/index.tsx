/**
 * App Icon Generator — iOS asset catalogs and Android adaptive/launcher icons
 * from one browser-local design. Renders and packaging run in a worker.
 */
import { downloadBlob } from "@qbtools/engines/files";
import type {
	AppIconExportOptions,
	DesignProject,
	DesignSettings,
	GeneratedAssetSet,
	IconDesign,
	RenderedDesign,
} from "@qbtools/engines/graphic";
import {
	defaultIconDesign,
	parseDesign,
	projectFileName,
	serializeDesign,
} from "@qbtools/engines/graphic";
import { Button } from "@qbtools/ui/button";
import { Slider } from "@qbtools/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qbtools/ui/tabs";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { Download, FileArchive, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useObjectUrl } from "#/components/kit/use-object-url";
import { graphicAssets } from "#/lib/graphic-assets";
import { useGraphicPreview } from "#/lib/graphic-preview";
import { ProcessingWorker } from "#/lib/processing/worker-client";
import type { ToolWidgetProps } from "#/tools/types";
import { ArtworkEditor, CropControls } from "../favicon-generator/artwork";

const MONOCHROME_MODES = [
	{ value: "alpha", label: "From alpha" },
	{ value: "luminance", label: "From brightness" },
] as const;

export default function AppIconGenerator({ params: _params }: ToolWidgetProps) {
	const [design, setDesign] = useState<IconDesign>(() => defaultIconDesign("app-icon"));
	const [exportOptions, setExportOptions] = useState<AppIconExportOptions>({
		platforms: ["ios", "android"],
		iosDarkMode: {
			enabled: true,
			background: { type: "color", color: "#111827" },
			foreground: "#ffffff",
		},
		iosTintedMode: {
			enabled: true,
			background: { type: "color", color: "#f4f4f5" },
			foreground: "#18181b",
		},
		monochrome: { mode: "alpha", threshold: 128 },
		optimize: true,
	});
	const [assets, setAssets] = useState<GeneratedAssetSet | null>(null);
	const [assetError, setAssetError] = useState<string | null>(null);
	const [zipBusy, setZipBusy] = useState(false);

	const previewWorker = useState(() => new ProcessingWorker())[0];
	const exportWorker = useState(() => new ProcessingWorker())[0];
	useEffect(
		() => () => {
			previewWorker.dispose();
			exportWorker.dispose();
		},
		[previewWorker, exportWorker],
	);

	const renderPreview = useCallback(
		async (target: IconDesign) => {
			const result = await previewWorker.run<RenderedDesign>("graphic-render", {
				design: { tool: "app-icon", design: target } satisfies DesignSettings,
				renderOptions: {
					width: 512,
					height: 512,
					preview: true,
					format: "png",
					quality: 0.9,
					optimize: false,
				},
				assets: graphicAssets(),
			});
			return { blob: result.blob, warnings: result.warnings ?? [] };
		},
		[previewWorker],
	);
	const preview = useGraphicPreview(design, renderPreview);
	const previewUrl = useObjectUrl(preview.blob);

	const togglePlatform = (platform: "ios" | "android") => {
		const set = new Set(exportOptions.platforms);
		if (set.has(platform)) {
			if (set.size === 1) return; // keep at least one
			set.delete(platform);
		} else {
			set.add(platform);
		}
		setExportOptions({ ...exportOptions, platforms: [...set].sort() as ("ios" | "android")[] });
	};

	const generate = async () => {
		setAssetError(null);
		setZipBusy(true);
		setAssets(null);
		try {
			const result = await exportWorker.run<GeneratedAssetSet>("graphic-appicon", {
				design: { ...design, tool: "app-icon" },
				options: exportOptions,
				assets: graphicAssets(),
			});
			setAssets(result);
		} catch (e) {
			setAssetError(e instanceof Error ? e.message : "The icon kit could not be generated.");
		} finally {
			setZipBusy(false);
		}
	};

	const saveProject = () => {
		const blob = serializeDesign({
			device: "app-icon",
			version: 1,
			settings: { tool: "app-icon", design },
			meta: { name: "App icon", savedAt: new Date().toISOString() },
		} satisfies DesignProject);
		downloadBlob(blob, projectFileName("app-icon", "app-icon"));
	};

	const allWarnings = [...preview.warnings, ...(assets?.warnings ?? [])];
	const uniqueWarnings = [...new Map(allWarnings.map((w) => [w.message, w])).values()];

	return (
		<div className="flex flex-col gap-8">
			<PrivacyNote text="Rendering and packaging happen on this device — your artwork never leaves the browser." />

			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
				{/* Previews */}
				<div className="flex flex-col gap-4">
					<Tabs defaultValue="ios">
						<TabsList>
							<TabsTrigger value="ios">iOS</TabsTrigger>
							<TabsTrigger value="android">Android</TabsTrigger>
						</TabsList>

						<TabsContent value="ios">
							<div className="flex flex-col gap-4">
								<span className="label-mono text-subtle">Home screen preview (runtime mask)</span>
								<div className="flex items-end gap-4">
									{(
										[
											{ label: "Any / Light", src: previewUrl, overlayClass: undefined },
											{
												label: "Dark override",
												src: exportOptions.iosDarkMode.enabled ? previewUrl : undefined,
												overlayClass: "bg-zinc-950/85",
											},
											{
												label: "Tinted override",
												src: exportOptions.iosTintedMode.enabled ? previewUrl : undefined,
												overlayClass: "bg-zinc-500/70",
											},
										] as const
									).map((variant) => (
										<div key={variant.label} className="flex flex-col items-center gap-1">
											<div className="relative size-20 overflow-hidden rounded-[22.37%] border border-input bg-surface-2">
												{variant.src ? (
													<>
														<img src={variant.src} alt={variant.label} className="size-full" />
														{variant.overlayClass ? (
															<span className={cn("absolute inset-0", variant.overlayClass)} />
														) : null}
													</>
												) : (
													<span className="grid size-full place-items-center text-xs text-subtle">
														off
													</span>
												)}
											</div>
											<span className="label-mono text-subtle">{variant.label}</span>
										</div>
									))}
								</div>
								<Notice tone="info">
									Exported corners stay square — iOS rounds them at runtime. The modern catalog
									exports Any/Dark/Tinted 1024 px images; a legacy slot matrix is included.
								</Notice>
							</div>
						</TabsContent>

						<TabsContent value="android">
							<div className="flex flex-col gap-4">
								<div className="flex items-end gap-4">
									{["circle", "squircle", "rounded-square", "square"].map((shape) => (
										<div key={shape} className="flex flex-col items-center gap-1">
											<div className="relative size-20">
												{preview.blob ? (
													<img
														src={previewUrl}
														alt={`${shape} appearance`}
														className={cn(
															"size-full",
															shape === "circle" && "rounded-full",
															shape === "squircle" && "rounded-[28%]",
															shape === "rounded-square" && "rounded-xl",
														)}
													/>
												) : null}
												<span
													aria-hidden
													className={cn(
														"absolute inset-[16.5%] border-2 border-dashed border-amber-400/70",
														shape === "circle" && "rounded-full",
														shape === "squircle" && "rounded-[30%]",
														shape === "rounded-square" && "rounded-lg",
														shape === "square" && "rounded-xs",
													)}
												/>
											</div>
											<span className="label-mono text-subtle">{shape}</span>
										</div>
									))}
								</div>
								<p className="text-xs text-muted-foreground">
									Inner outline = 66 dp safe circle on the 108 dp adaptive canvas. Exported artwork
									is clamped inside it.
								</p>
							</div>
						</TabsContent>
					</Tabs>

					{uniqueWarnings.length > 0 && (
						<Notice tone="caution">
							<ul className="list-disc pl-4">
								{uniqueWarnings.map((w) => (
									<li key={w.message}>
										{w.message}
										{w.skipped ? " (this output is skipped)" : ""}
									</li>
								))}
							</ul>
						</Notice>
					)}
				</div>

				{/* Controls */}
				<div className="flex flex-col gap-4">
					<ArtworkEditor design={design} onChange={setDesign} />
					{design.artwork.source?.kind === "raster" ? (
						<CropControls design={design} onChange={setDesign} />
					) : null}

					<details className="border-t border-input pt-4" open>
						<summary className="label-mono cursor-pointer text-subtle">
							iOS variant overrides
						</summary>
						<div className="mt-3 flex flex-col gap-3">
							{(["iosDarkMode", "iosTintedMode"] as const).map((key) => {
								const variant = exportOptions[key];
								const label = key === "iosDarkMode" ? "Dark" : "Tinted";
								return (
									<div key={key} className="flex flex-col gap-2 rounded-md border border-input p-3">
										<label className="label-mono flex cursor-pointer items-center justify-between text-subtle">
											{label} override
											<input
												type="checkbox"
												checked={variant.enabled}
												onChange={(e) =>
													setExportOptions({
														...exportOptions,
														[key]: { ...variant, enabled: e.target.checked },
													})
												}
												className="size-4"
											/>
										</label>
										{variant.enabled && (
											<div className="grid grid-cols-2 gap-3">
												<label className="flex flex-col gap-1">
													<span className="label-mono text-subtle">Background</span>
													<input
														type="color"
														value={
															variant.background.type === "color"
																? variant.background.color
																: "#000000"
														}
														onChange={(e) =>
															setExportOptions({
																...exportOptions,
																[key]: {
																	...variant,
																	background: { type: "color", color: e.target.value },
																},
															})
														}
														className="h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
														aria-label={`${label} background`}
													/>
												</label>
												<label className="flex flex-col gap-1">
													<span className="label-mono text-subtle">Icon/foreground</span>
													<input
														type="color"
														value={variant.foreground}
														onChange={(e) =>
															setExportOptions({
																...exportOptions,
																[key]: { ...variant, foreground: e.target.value },
															})
														}
														className="h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
														aria-label={`${label} foreground`}
													/>
												</label>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</details>

					<details
						className="border-t border-input pt-4"
						open={exportOptions.platforms.includes("android")}
					>
						<summary className="label-mono cursor-pointer text-subtle">Android monochrome</summary>
						<div className="mt-3 flex flex-col gap-3">
							<div className="grid grid-cols-2 gap-2">
								{MONOCHROME_MODES.map((mode) => (
									<button
										key={mode.value}
										type="button"
										onClick={() =>
											setExportOptions({
												...exportOptions,
												monochrome: { ...exportOptions.monochrome, mode: mode.value },
											})
										}
										className={cn(
											"min-h-11 cursor-pointer border px-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em]",
											exportOptions.monochrome.mode === mode.value
												? "border-foreground bg-primary text-primary-foreground"
												: "border-input text-muted-foreground hover:text-foreground",
										)}
									>
										{mode.label}
									</button>
								))}
							</div>
							<Slider
								label="Monochrome threshold"
								value={exportOptions.monochrome.threshold}
								min={0}
								max={255}
								step={1}
								valueLabel={String(exportOptions.monochrome.threshold)}
								onChange={(e) =>
									setExportOptions({
										...exportOptions,
										monochrome: { ...exportOptions.monochrome, threshold: Number(e.target.value) },
									})
								}
							/>
						</div>
					</details>

					<div className="flex flex-col gap-3 border-t border-input pt-4">
						<span className="label-mono text-subtle">Export platforms</span>
						<div className="flex gap-2">
							{(["ios", "android"] as const).map((platform) => (
								<Button
									key={platform}
									size="sm"
									variant={exportOptions.platforms.includes(platform) ? "primary" : "secondary"}
									onClick={() => togglePlatform(platform)}
								>
									{platform === "ios" ? "iOS only" : "Android only"}
								</Button>
							))}
							<Button
								size="sm"
								variant={exportOptions.platforms.length === 2 ? "primary" : "secondary"}
								onClick={() =>
									setExportOptions({ ...exportOptions, platforms: ["ios", "android"] })
								}
							>
								Combined
							</Button>
						</div>
						<label className="label-mono flex cursor-pointer items-center justify-between text-subtle">
							Optimize file sizes
							<input
								type="checkbox"
								checked={exportOptions.optimize}
								onChange={(e) => setExportOptions({ ...exportOptions, optimize: e.target.checked })}
								className="size-4"
							/>
						</label>
						<Button size="lg" onClick={() => void generate()} disabled={zipBusy}>
							{zipBusy ? <Loader2 className="animate-spin" /> : <FileArchive />} Generate icon kit
						</Button>
						{assetError && <Notice tone="critical">{assetError}</Notice>}
						{assets?.zip ? (
							<div className="border border-input bg-surface-2 p-4">
								<p className="text-sm">
									{assets.zip.name} · <strong>{formatBytes(assets.zip.blob.size)}</strong> ·{" "}
									{assets.files.length} files
								</p>
								<Button
									size="sm"
									className="mt-2"
									onClick={() => downloadBlob(assets.zip!.blob, assets.zip!.name)}
								>
									<Download /> Download ZIP
								</Button>
								<details className="mt-3">
									<summary className="label-mono cursor-pointer text-subtle">Contents</summary>
									<ul className="mt-2 space-y-1 pl-1">
										{assets.files.map((file) => (
											<li key={file.name} className="text-xs text-muted-foreground">
												{file.name}
											</li>
										))}
									</ul>
								</details>
								<details className="mt-2">
									<summary className="label-mono cursor-pointer text-subtle">
										Install instructions
									</summary>
									<InstallInstructions text={assets.install.text} />
								</details>
							</div>
						) : null}
						<Button variant="secondary" size="sm" className="self-start" onClick={saveProject}>
							<Download /> Save project (.qbdesign.json)
						</Button>
						<ImportProject onLoaded={setDesign} />
					</div>
				</div>
			</div>
		</div>
	);
}

function InstallInstructions({ text }: { text: string }) {
	return (
		<div className="mt-2 max-h-64 overflow-y-auto border border-input bg-surface-1 p-3">
			{text.split("\n").map((line, i) =>
				line.trim() ? (
					<p key={i} className="text-xs leading-relaxed text-muted-foreground">
						{line.replace(/^#+\s*/, "").replace(/^-\s/, "— ")}
					</p>
				) : (
					<br key={i} />
				),
			)}
		</div>
	);
}

function ImportProject({ onLoaded }: { onLoaded: (design: IconDesign) => void }) {
	const [error, setError] = useState<string | null>(null);
	return (
		<>
			<label className="label-mono cursor-pointer self-start text-subtle underline">
				Import project file…
				<input
					type="file"
					accept=".json,application/json,.qbdesign.json"
					className="hidden"
					onChange={async (e) => {
						const file = e.target.files?.[0];
						if (!file) return;
						setError(null);
						try {
							const project = await parseDesign(file);
							if (project.device !== "app-icon")
								throw new Error("That project was created with a different tool.");
							onLoaded(
								(project as { settings: { tool: "app-icon"; design: IconDesign } }).settings.design,
							);
						} catch (err) {
							setError(err instanceof Error ? err.message : "Could not open project file.");
						}
					}}
				/>
			</label>
			{error && <Notice tone="critical">{error}</Notice>}
		</>
	);
}
