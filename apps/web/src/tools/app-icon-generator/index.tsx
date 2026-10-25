/**
 * App Icon Generator — iOS, Android and macOS icon kits from one
 * browser-local design. Renders and packaging run in a worker with live
 * previews for every iOS appearance variant.
 */
import { downloadBlob } from "@qbtools/engines/files";
import type {
	AppIconExportOptions,
	AppIconPlatform,
	BackgroundSpec,
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
	variantDesign,
} from "@qbtools/engines/graphic";
import type { ProcessingProgress } from "@qbtools/engines/processing";
import { Button } from "@qbtools/ui/button";
import { Slider } from "@qbtools/ui/slider";
import { Switch } from "@qbtools/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qbtools/ui/tabs";
import { toast } from "@qbtools/ui/toaster";
import { cn, formatBytes } from "@qbtools/ui/utils";
import {
	Brush,
	Download,
	FileArchive,
	FolderOpen,
	Redo2,
	SlidersHorizontal,
	Undo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColorField } from "#/components/kit/color-field";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { Section } from "#/components/kit/section";
import { TaskProgress } from "#/components/kit/task-progress";
import { useObjectUrl } from "#/components/kit/use-object-url";
import { readAutosave, useAutosave } from "#/lib/design-autosave";
import { useDesignHistory, useUndoHotkeys } from "#/lib/design-history";
import { graphicAssets } from "#/lib/graphic-assets";
import { useGraphicPreviews } from "#/lib/graphic-preview";
import { ProcessingWorker } from "#/lib/processing/worker-client";
import { ArtworkEditor, CropControls } from "#/tools/favicon-generator/artwork";
import type { ToolWidgetProps } from "#/tools/types";
import { IconPreviewStage, PlatformToggle } from "./preview-stage";

const AUTOSAVE_KEY = "qbtools:app-icon-design:v1";

const MONOCHROME_MODES = [
	{ value: "alpha", label: "From alpha" },
	{ value: "luminance", label: "From brightness" },
] as const;

const DEFAULT_EXPORT: AppIconExportOptions = {
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
};

/** Restore the last autosaved icon design when it still looks valid. */
function restoredDesign(): { design: IconDesign; restored: boolean } {
	const saved = readAutosave<IconDesign>(AUTOSAVE_KEY);
	if (
		saved &&
		(saved.tool === "app-icon" || saved.tool === "favicon") &&
		typeof saved.canvas === "number" &&
		saved.artwork
	) {
		return { design: { ...saved, tool: "app-icon" }, restored: true };
	}
	return { design: defaultIconDesign("app-icon"), restored: false };
}

function opaqueOf(bg: BackgroundSpec, fallback: string): BackgroundSpec {
	return bg.type === "none" ? { type: "color", color: fallback } : bg;
}

export default function AppIconGenerator(_props: ToolWidgetProps) {
	const [boot] = useState(restoredDesign);
	const history = useDesignHistory<IconDesign>(() => boot.design);
	const design = history.design;
	const { commit, update, undo, redo } = history;
	useUndoHotkeys(undo, redo);

	const [exportOptions, setExportOptions] = useState<AppIconExportOptions>(DEFAULT_EXPORT);
	const [assets, setAssets] = useState<GeneratedAssetSet | null>(null);
	const [assetError, setAssetError] = useState<string | null>(null);
	const [zipBusy, setZipBusy] = useState(false);
	const [exportProgress, setExportProgress] = useState<ProcessingProgress | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const previewWorker = useState(() => new ProcessingWorker())[0];
	const exportWorker = useState(() => new ProcessingWorker())[0];
	useEffect(
		() => () => {
			previewWorker.dispose();
			exportWorker.dispose();
			abortRef.current?.abort();
		},
		[previewWorker, exportWorker],
	);

	useAutosave(AUTOSAVE_KEY, design);
	const announceRestore = useRef(boot.restored);
	useEffect(() => {
		if (!announceRestore.current) return;
		announceRestore.current = false;
		toast("Restored your last icon design", {
			description: "Continue editing, or undo back to the default.",
		});
	}, []);

	// ---- previews (base + enabled iOS variants, one worker) --------------
	const previewItems = useMemo(() => {
		const items: Array<{ key: string; design: IconDesign | null }> = [{ key: "base", design }];
		if (exportOptions.iosDarkMode.enabled) {
			items.push({
				key: "dark",
				design: variantDesign(
					design,
					opaqueOf(exportOptions.iosDarkMode.background, "#111827"),
					exportOptions.iosDarkMode.foreground,
				),
			});
		}
		if (exportOptions.iosTintedMode.enabled) {
			items.push({
				key: "tinted",
				design: variantDesign(
					design,
					opaqueOf(exportOptions.iosTintedMode.background, "#f4f4f5"),
					exportOptions.iosTintedMode.foreground,
				),
			});
		}
		return items;
	}, [design, exportOptions.iosDarkMode, exportOptions.iosTintedMode]);

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
				assets: await graphicAssets(),
			});
			return { blob: result.blob, warnings: result.warnings ?? [] };
		},
		[previewWorker],
	);
	const previews = useGraphicPreviews(previewItems, renderPreview);
	const baseUrl = useObjectUrl(previews.byKey.base?.blob);
	const darkUrl = useObjectUrl(previews.byKey.dark?.blob);
	const tintedUrl = useObjectUrl(previews.byKey.tinted?.blob);

	// ---- kit generation ---------------------------------------------------
	const togglePlatform = (platform: AppIconPlatform) => {
		setExportOptions((options) => {
			if (options.platforms.includes(platform)) {
				if (options.platforms.length === 1) return options; // keep at least one
				return { ...options, platforms: options.platforms.filter((p) => p !== platform) };
			}
			return { ...options, platforms: [...options.platforms, platform].sort() };
		});
	};

	const generate = async () => {
		setAssetError(null);
		setZipBusy(true);
		setAssets(null);
		setExportProgress(null);
		const controller = new AbortController();
		abortRef.current = controller;
		try {
			const result = await exportWorker.run<GeneratedAssetSet>(
				"graphic-appicon",
				{
					design: { ...design, tool: "app-icon" },
					options: exportOptions,
					assets: await graphicAssets(),
				},
				{ signal: controller.signal, onProgress: setExportProgress },
			);
			setAssets(result);
			toast.success("Icon kit ready", {
				description: `${result.files.length} files packaged in ${result.zip?.name ?? "the archive"}.`,
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") {
				toast("Export cancelled");
			} else {
				setAssetError(e instanceof Error ? e.message : "The icon kit could not be generated.");
			}
		} finally {
			setZipBusy(false);
			setExportProgress(null);
			abortRef.current = null;
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

	const allWarnings = [...previews.warnings, ...(assets?.warnings ?? [])];
	const uniqueWarnings = [...new Map(allWarnings.map((w) => [w.message, w])).values()];

	return (
		<div className="flex flex-col gap-6">
			<PrivacyNote text="Rendering and packaging happen on this device — your artwork never leaves the browser." />

			<div className="flex flex-wrap items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={undo}
					disabled={!history.canUndo}
					title="Undo (⌘Z)"
				>
					<Undo2 /> Undo
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={redo}
					disabled={!history.canRedo}
					title="Redo (⌘⇧Z)"
				>
					<Redo2 /> Redo
				</Button>
			</div>

			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
				{/* Preview stage — sticks while the inspector scrolls. */}
				<div className="min-w-0 self-start lg:self-stretch">
					<div className="lg:sticky lg:top-20">
						<IconPreviewStage
							previews={{
								base: baseUrl,
								dark: darkUrl,
								tinted: tintedUrl,
								darkBusy: previews.byKey.dark?.busy ?? false,
								tintedBusy: previews.byKey.tinted?.busy ?? false,
							}}
							iosDark={exportOptions.iosDarkMode.enabled}
							iosTinted={exportOptions.iosTintedMode.enabled}
							warnings={uniqueWarnings}
							previewBusy={previews.busy}
						/>
					</div>
				</div>

				{/* Inspector -------------------------------------------------- */}
				<div className="flex min-w-0 flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-inset ring-border">
					<Tabs defaultValue="artwork">
						<TabsList className="w-full">
							<TabsTrigger value="artwork" className="flex-1">
								<Brush className="size-3.5" /> Artwork
							</TabsTrigger>
							<TabsTrigger value="variants" className="flex-1">
								<SlidersHorizontal className="size-3.5" /> Variants
							</TabsTrigger>
							<TabsTrigger value="export" className="flex-1">
								<FileArchive className="size-3.5" /> Export
							</TabsTrigger>
						</TabsList>

						<TabsContent value="artwork" className="flex flex-col gap-4">
							<ArtworkEditor design={design} onChange={(next) => update(() => next)} />
							{design.artwork.source?.kind === "raster" ? (
								<Section title="Crop" eyebrow="Raster sources">
									<CropControls design={design} onChange={(next) => update(() => next)} />
								</Section>
							) : null}
						</TabsContent>

						<TabsContent value="variants" className="flex flex-col gap-5">
							<Section title="iOS appearance overrides" eyebrow="Optional">
								{(["iosDarkMode", "iosTintedMode"] as const).map((key) => {
									const variant = exportOptions[key];
									const label = key === "iosDarkMode" ? "Dark" : "Tinted";
									return (
										<div
											key={key}
											className="flex flex-col gap-3 rounded-lg border border-input p-3"
										>
											<div className="flex items-center justify-between">
												<span className="text-sm">{label} variant</span>
												<Switch
													checked={variant.enabled}
													onCheckedChange={(enabled) =>
														setExportOptions((o) => ({
															...o,
															[key]: { ...o[key], enabled },
														}))
													}
													aria-label={`${label} variant`}
												/>
											</div>
											{variant.enabled ? (
												<div className="grid grid-cols-2 gap-3">
													<ColorField
														label="Background"
														value={
															variant.background.type === "color"
																? variant.background.color
																: "#000000"
														}
														onChange={(color) =>
															setExportOptions((o) => ({
																...o,
																[key]: {
																	...o[key],
																	background: { type: "color", color },
																},
															}))
														}
													/>
													<ColorField
														label="Foreground"
														value={variant.foreground}
														onChange={(foreground) =>
															setExportOptions((o) => ({
																...o,
																[key]: { ...o[key], foreground },
															}))
														}
													/>
												</div>
											) : null}
										</div>
									);
								})}
							</Section>

							<Section title="Android monochrome" eyebrow="Themed icons">
								<div className="grid grid-cols-2 gap-2">
									{MONOCHROME_MODES.map((mode) => (
										<button
											key={mode.value}
											type="button"
											aria-pressed={exportOptions.monochrome.mode === mode.value}
											onClick={() =>
												setExportOptions((o) => ({
													...o,
													monochrome: { ...o.monochrome, mode: mode.value },
												}))
											}
											className={cn(
												"cursor-pointer rounded-lg px-3 py-2.5 text-xs font-medium transition-colors duration-150 [-webkit-tap-highlight-color:transparent]",
												exportOptions.monochrome.mode === mode.value
													? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40 ring-inset"
													: "text-muted-foreground ring-1 ring-input ring-inset hover:text-foreground",
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
										setExportOptions((o) => ({
											...o,
											monochrome: {
												...o.monochrome,
												threshold: Number(e.target.value),
											},
										}))
									}
								/>
							</Section>
						</TabsContent>

						<TabsContent value="export" className="flex flex-col gap-5">
							<Section title="Platforms" eyebrow="At least one">
								<PlatformToggle
									label="iOS"
									hint="Modern + legacy asset catalogs, Any/Dark/Tinted"
									active={exportOptions.platforms.includes("ios")}
									onToggle={() => togglePlatform("ios")}
								/>
								<PlatformToggle
									label="Android"
									hint="Adaptive layers, monochrome, legacy launchers, Play icon"
									active={exportOptions.platforms.includes("android")}
									onToggle={() => togglePlatform("android")}
								/>
								<PlatformToggle
									label="macOS"
									hint="AppIcon.appiconset 16–1024 px + AppIcon.icns"
									active={exportOptions.platforms.includes("macos")}
									onToggle={() => togglePlatform("macos")}
								/>
								<div className="flex items-center justify-between rounded-lg border border-input px-3 py-2.5">
									<span className="text-sm">Optimize file sizes</span>
									<Switch
										checked={exportOptions.optimize}
										onCheckedChange={(optimize) => setExportOptions((o) => ({ ...o, optimize }))}
										aria-label="Optimize file sizes"
									/>
								</div>
							</Section>

							<Button
								size="lg"
								className="w-full"
								onClick={() => void generate()}
								disabled={zipBusy}
							>
								<FileArchive /> Generate icon kit
							</Button>
							<TaskProgress
								busy={zipBusy}
								progress={exportProgress}
								cancel={() => abortRef.current?.abort()}
							/>
							{assetError ? <Notice tone="critical">{assetError}</Notice> : null}
							{assets?.zip ? <AssetResult assets={assets} /> : null}

							<Section title="Project file" eyebrow="Editable design">
								<Button variant="secondary" size="sm" className="self-start" onClick={saveProject}>
									<Download /> Save project (.qbdesign.json)
								</Button>
								<ImportProject onLoaded={(next) => commit({ ...next, tool: "app-icon" })} />
								<p className="text-xs text-muted-foreground">
									Your design is saved to this browser automatically.
								</p>
							</Section>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Export pieces                                                       */
/* ------------------------------------------------------------------ */

function AssetResult({ assets }: { assets: GeneratedAssetSet }) {
	const zip = assets.zip;
	if (!zip) return null;
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-input bg-surface-2 p-4">
			<div className="flex items-center gap-3">
				<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
					<FileArchive className="size-5" />
				</span>
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">{zip.name}</p>
					<p className="text-xs text-muted-foreground">
						{formatBytes(zip.blob.size)} · {assets.files.length} files
					</p>
				</div>
			</div>
			<Button
				size="sm"
				onClick={() => {
					const current = assets.zip;
					if (current) downloadBlob(current.blob, current.name);
				}}
			>
				<Download /> Download ZIP
			</Button>
			<details>
				<summary className="label-mono cursor-pointer text-subtle select-none">
					Contents ({assets.files.length})
				</summary>
				<ul className="mt-2 max-h-48 space-y-1 overflow-y-auto overscroll-contain pl-1">
					{assets.files.map((file) => (
						<li key={file.name} className="font-mono text-xs text-muted-foreground">
							{file.name}
						</li>
					))}
				</ul>
			</details>
			<details>
				<summary className="label-mono cursor-pointer text-subtle select-none">
					Install instructions
				</summary>
				<InstallInstructions text={assets.install.text} />
			</details>
		</div>
	);
}

function InstallInstructions({ text }: { text: string }) {
	return (
		<div className="mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-input bg-surface-2 p-3">
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
		<div className="flex flex-col gap-3">
			<label className="self-start">
				<span className="sr-only">Import project file</span>
				<span className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
					<FolderOpen className="size-4" /> Import project file…
				</span>
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
			{error ? <Notice tone="critical">{error}</Notice> : null}
		</div>
	);
}
