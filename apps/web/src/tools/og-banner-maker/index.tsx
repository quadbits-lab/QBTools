/**
 * OG Banner Maker — interactive Open Graph banner editor.
 * Rasterization runs in a worker via resvg; previews cap at 960 px and export
 * renders at requested sizes. All processing stays on the device.
 */
import { downloadBlob } from "@qbtools/engines/files";
import type {
	BackgroundSpec,
	BadgeShape,
	DesignProject,
	DesignSettings,
	DesignWarning,
	OgDesign,
	OgTemplate,
	RenderedDesign,
	TextFont,
} from "@qbtools/engines/graphic";
import {
	defaultOgDesign,
	OG_CANVAS_PRESETS,
	OG_TEMPLATES,
	ogContentFrame,
	ogElementBoxes,
	parseDesign,
	projectFileName,
	renderDesign,
	serializeDesign,
} from "@qbtools/engines/graphic";
import { normalizeRasterArtwork } from "@qbtools/engines/graphic-design";
import { Button } from "@qbtools/ui/button";
import { Input, Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { Download, Eraser, Grab, Loader2, Redo2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CopyButton } from "#/components/kit/copy-button";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useObjectUrl } from "#/components/kit/use-object-url";
import { graphicAssets } from "#/lib/graphic-assets";
import { useGraphicPreview } from "#/lib/graphic-preview";
import { ProcessingWorker } from "#/lib/processing/worker-client";
import type { ToolWidgetProps } from "#/tools/types";

const FONTS: TextFont[] = ["Inter", "Anton", "DM Mono"];
const PREVIEW_MAX_EDGE = 960;
const HISTORY_LIMIT = 50;

type ElementKind = "title" | "subtitle" | "badge" | "logo" | "hero";

const TEMPLATE_LABELS: Record<OgTemplate, string> = {
	minimal: "Minimal",
	gradient: "Gradient",
	"split-image": "Split Image",
	"photo-overlay": "Photo Overlay",
	editorial: "Editorial",
	"product-card": "Product Card",
	event: "Event",
	"logo-focus": "Logo Focus",
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export default function OgBannerMaker({ params }: ToolWidgetProps) {
	const numWidth = typeof params.width === "number" ? params.width : undefined;
	const numHeight = typeof params.height === "number" ? params.height : undefined;
	const [design, setDesign] = useState<OgDesign>(() => ({
		...defaultOgDesign("gradient"),
		background:
			numWidth === 1500
				? { type: "gradient", from: "#0ea5e9", to: "#22c55e", angle: 120 }
				: defaultOgDesign("gradient").background,
		canvas: { width: numWidth ?? 1200, height: numHeight ?? 630 },
	}));
	const [selected, setSelected] = useState<ElementKind | null>("title");
	const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
	const [scale, setScale] = useState<"1x" | "2x">("1x");
	const [optimize, setOptimize] = useState(false);
	const [imageUrl, setImageUrl] = useState("https://example.com/og/home.png");
	const [projectError, setProjectError] = useState<string | null>(null);
	const [exportResult, setExportResult] = useState<RenderedDesign | null>(null);
	const [exportName, setExportName] = useState("");
	const [exportBusy, setExportBusy] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);

	const previewWorker = useState(() => new ProcessingWorker())[0];
	const exportWorker = useState(() => new ProcessingWorker())[0];
	useEffect(
		() => () => {
			previewWorker.dispose();
			exportWorker.dispose();
		},
		[previewWorker, exportWorker],
	);

	// ---- history (up to 50 steps; artwork sources shared by reference) --
	const past = useRef<OgDesign[]>([]);
	const future = useRef<OgDesign[]>([]);
	const lastCommitAt = useRef(0);
	const commit = (next: OgDesign) => {
		past.current = [...past.current, design].slice(-HISTORY_LIMIT);
		future.current = [];
		lastCommitAt.current = Date.now();
		setDesign(next);
	};
	const update = (mutate: (draft: OgDesign) => OgDesign) => {
		// Live drag moves don't spam history; they land in the next commit.
		if (Date.now() - lastCommitAt.current > 400) {
			commit(mutate(design));
		} else {
			setDesign(mutate(design));
		}
	};
	const undo = () => {
		const prev = past.current.pop();
		if (!prev) return;
		future.current = [design, ...future.current].slice(0, HISTORY_LIMIT);
		setDesign(prev);
	};
	const redo = () => {
		const next = future.current.shift();
		if (!next) return;
		past.current = [...past.current, design].slice(-HISTORY_LIMIT);
		setDesign(next);
	};

	// ---- preview -------------------------------------------------------
	const renderPreview = useCallback(
		async (target: OgDesign) => {
			const long = Math.max(target.canvas.width, target.canvas.height);
			const previewScale = Math.min(1, PREVIEW_MAX_EDGE / long);
			const result = await previewWorker.run<RenderedDesign>("graphic-render", {
				design: { tool: "og-banner", design: target } satisfies DesignSettings,
				renderOptions: {
					width: Math.max(64, Math.round(target.canvas.width * previewScale)),
					height: Math.max(40, Math.round(target.canvas.height * previewScale)),
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

	// ---- export --------------------------------------------------------
	const exportImage = async () => {
		setExportError(null);
		setExportBusy(true);
		setExportResult(null);
		try {
			const width = design.canvas.width * (scale === "2x" ? 2 : 1);
			const height = design.canvas.height * (scale === "2x" ? 2 : 1);
			if (width * height > 24_000_000) throw new Error("The export exceeds 24 megapixels.");
			const result = await exportWorker.run<RenderedDesign>("graphic-render", {
				design: { tool: "og-banner", design } satisfies DesignSettings,
				renderOptions: {
					width,
					height,
					preview: false,
					format,
					quality: format === "png" ? 1 : 0.92,
					optimize,
				},
				assets: graphicAssets(),
			});
			setExportName(
				`og-banner-${Math.round(width)}x${Math.round(height)}.${format === "jpeg" ? "jpg" : format}`,
			);
			setExportResult(result);
		} catch (e) {
			setExportError(e instanceof Error ? e.message : "Export failed. Please try again.");
		} finally {
			setExportBusy(false);
		}
	};

	// ---- metadata snippet ----------------------------------------------
	const titleAttr = design.title.text.replace(/"/g, "&quot;") || "Your title";
	const snippet = [
		"<!-- Open Graph -->",
		`<meta property="og:title" content="${titleAttr}">`,
		`<meta property="og:description" content="${design.subtitle.text.replace(/"/g, "&quot;")}">`,
		`<meta property="og:image" content="${imageUrl}">`,
		`<meta property="og:image:width" content="${design.canvas.width}">`,
		`<meta property="og:image:height" content="${design.canvas.height}">`,
		`<meta property="og:type" content="website">`,
		"<!-- Twitter -->",
		`<meta name="twitter:card" content="summary_large_image">`,
		`<meta name="twitter:title" content="${titleAttr}">`,
		`<meta name="twitter:image" content="${imageUrl}">`,
	].join("\n");

	// ---- project files ---------------------------------------------------
	const saveProject = () => {
		const project = serializeDesign({
			device: "og-banner",
			version: 1,
			settings: { tool: "og-banner", design },
			meta: {
				name: design.title.text.slice(0, 40) || "OG banner",
				savedAt: new Date().toISOString(),
			},
		} satisfies DesignProject);
		downloadBlob(project, projectFileName("og-banner", design.title.text.slice(0, 40) || "banner"));
	};
	const loadProject = async ([file]: File[]) => {
		setProjectError(null);
		if (!file) return;
		try {
			const project = await parseDesign(file);
			if (project.device !== "og-banner")
				throw new Error("That project was created with a different tool.");
			commit((project as { settings: { tool: "og-banner"; design: OgDesign } }).settings.design);
		} catch (e) {
			setProjectError(e instanceof Error ? e.message : "This project file could not be opened.");
		}
	};

	// ---- canvas + dragging ---------------------------------------------
	const canvasRef = useRef<HTMLDivElement>(null);
	const designRef = useRef(design);
	designRef.current = design;
	const boxes = ogElementBoxes(design);
	const applyNudge = (kind: ElementKind, dx: number, dy: number) => {
		const current = designRef.current;
		const fr = ogContentFrame(current);
		const b = ogElementBoxes(current)[kind];
		if (!b) return;
		const maxX = Math.max(1, fr.w - b.w);
		const maxY = Math.max(1, fr.h - b.h);
		const snap = (styleX: number, styleY: number) => ({
			x: clamp01(styleX + dx),
			y: clamp01(styleY + dy),
		});
		update((d) => {
			switch (kind) {
				case "title":
					return { ...d, title: { ...d.title, ...snap(d.title.x, d.title.y) } };
				case "subtitle":
					return { ...d, subtitle: { ...d.subtitle, ...snap(d.subtitle.x, d.subtitle.y) } };
				case "badge":
					return { ...d, badge: { ...d.badge, ...snap(d.badge.x, d.badge.y) } };
				case "logo":
					return {
						...d,
						logo: { ...d.logo, ...snap(d.logo.x, d.logo.y) },
					};
				case "hero": {
					const place = d.hero.placement;
					return {
						...d,
						hero: {
							...d.hero,
							placement: {
								...place,
								offsetX: clamp01(place.offsetX + dx * 0.2) * 2 - 1,
								offsetY: clamp01(place.offsetY + dy * 0.2) * 2 - 1,
							},
						},
					};
				}
			}
		});
	};
	const onPointerDown = (kind: ElementKind) => (event: React.PointerEvent<HTMLDivElement>) => {
		event.preventDefault();
		const container = canvasRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const move = (moveEvent: PointerEvent) => {
			const fracX = (moveEvent.clientX - rect.left) / rect.width;
			const fracY = (moveEvent.clientY - rect.top) / rect.height;
			const bDrag = ogElementBoxes(designRef.current)[kind];
			if (!bDrag) return;
			const current = designRef.current;
			const fr = ogContentFrame(current);
			const b = ogElementBoxes(current)[kind];
			const px = fracX * current.canvas.width;
			const py = fracY * current.canvas.height;
			const toXBlock = clamp01((px - fr.x) / Math.max(1, fr.w - bDrag.w));
			const toYBlock = clamp01((py - fr.y) / Math.max(1, fr.h - bDrag.h));
			setDesign((d) => {
				switch (kind) {
					case "title":
						return { ...d, title: { ...d.title, x: toXBlock, y: toYBlock } };
					case "subtitle":
						return { ...d, subtitle: { ...d.subtitle, x: toXBlock, y: toYBlock } };
					case "badge":
						return { ...d, badge: { ...d.badge, x: toXBlock, y: toYBlock } };
					case "logo":
						return { ...d, logo: { ...d.logo, x: toXBlock, y: toYBlock } };
					case "hero": {
						const place = d.hero.placement;
						return {
							...d,
							hero: {
								...d.hero,
								placement: {
									...place,
									offsetX: (clamp01(fracX) - 0.5) * 0.4,
									offsetY: (clamp01(fracY) - 0.5) * 0.4,
								},
							},
						};
					}
				}
			});
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			past.current = [...past.current, dragStart.current].slice(-HISTORY_LIMIT);
			future.current = [];
		};
		dragStart.current = designRef.current;
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};
	const dragStart = useRef(design);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
				e.preventDefault();
				if (e.shiftKey) redo();
				else undo();
				return;
			}
			if (!selected || !e.key.startsWith("Arrow")) return;
			e.preventDefault();
			const step = e.shiftKey ? 0.05 : 0.01;
			const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
			const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
			applyNudge(selected, dx, dy);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	const warnings = preview.warnings;
	const uniqueWarnings = [...new Map(warnings.map((w) => [w.message, w])).values()];

	return (
		<div className="flex flex-col gap-8">
			<PrivacyNote text="Designing and exporting happen on your device — artwork and text never leave the browser." />

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
				{/* Canvas ------------------------------------------------- */}
				<div className="flex flex-col gap-3">
					<div
						ref={canvasRef}
						className="relative w-full overflow-hidden border border-input bg-surface-2 select-none"
						style={{ aspectRatio: `${design.canvas.width} / ${design.canvas.height}` }}
						role="application"
						aria-label="Banner editor canvas"
					>
						{preview.blob ? (
							<img
								src={previewUrl}
								alt="Banner preview"
								className="pointer-events-none size-full object-contain"
								draggable={false}
							/>
						) : (
							<div className="grid size-full place-items-center">
								<Loader2 className="size-6 animate-spin text-subtle" />
							</div>
						)}
						{preview.busy && preview.blob ? (
							<span className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5">
								<Loader2 className="size-3.5 animate-spin text-subtle" />
							</span>
						) : null}
						{(
							Object.entries(boxes) as Array<
								[ElementKind, { x: number; y: number; w: number; h: number } | null]
							>
						).map(([kind, box]) =>
							box ? (
								<div
									key={kind}
									onPointerDown={onPointerDown(kind)}
									onFocus={() => undefined}
									tabIndex={0}
									role="button"
									aria-label={`Select ${kind}`}
									onClick={() => setSelected(kind)}
									className={cn(
										"absolute cursor-grab border border-dashed transition-colors active:cursor-grabbing focus:outline-2 focus:outline-offset-4",
										selected === kind
											? "border-emerald-500 bg-emerald-500/5"
											: "border-sky-400/40 hover:border-sky-400",
									)}
									style={{
										left: `${(box.x / design.canvas.width) * 100}%`,
										top: `${(box.y / design.canvas.height) * 100}%`,
										width: `${(box.w / design.canvas.width) * 100}%`,
										height: `${(box.h / design.canvas.height) * 100}%`,
									}}
								>
									<Grab className="absolute -top-1 -left-1 size-4 text-sky-500/80" />
								</div>
							) : null,
						)}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button variant="ghost" size="sm" onClick={undo} disabled={past.current.length === 0}>
							<Undo2 /> Undo
						</Button>
						<Button variant="ghost" size="sm" onClick={redo} disabled={future.current.length === 0}>
							<Redo2 /> Redo
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								commit({
									...defaultOgDesign(design.template),
									canvas: design.canvas,
									hero: {
										...defaultOgDesign(design.template).hero,
										placement: { ...design.hero.placement },
									},
									logo: { ...design.logo },
								})
							}
						>
							<Eraser /> Reset template
						</Button>
						<span className="ml-auto font-mono text-xs text-subtle">
							{design.canvas.width} × {design.canvas.height}
						</span>
					</div>

					{uniqueWarnings.length > 0 && (
						<Notice tone="caution">
							<ul className="list-disc pl-4">
								{uniqueWarnings.map((w: DesignWarning) => (
									<li key={w.message}>{w.message}</li>
								))}
							</ul>
						</Notice>
					)}

					<div className="flex flex-wrap gap-1">
						{(["title", "subtitle", "badge", "logo", "hero"] as ElementKind[]).map((kind) => (
							<Button
								key={kind}
								size="sm"
								variant={selected === kind ? "primary" : "secondary"}
								onClick={() => setSelected((s) => (s === kind ? null : kind))}
							>
								{kind.charAt(0).toUpperCase() + kind.slice(1)}
							</Button>
						))}
					</div>
					<p className="text-sm text-muted-foreground">
						Select an element, then drag it on the canvas or use the numeric controls. Arrow keys
						nudge the selection.
					</p>
				</div>

				{/* Controls ------------------------------------------------ */}
				<div className="flex flex-col gap-4">
					<Field label="Template">
						<Select
							value={design.template}
							onChange={(e) => {
								const template = e.target.value as OgTemplate;
								const next = defaultOgDesign(template);
								commit({
									...next,
									canvas: design.canvas,
									hero: {
										...next.hero,
										placement: { ...next.hero.placement, source: design.hero.placement.source },
									},
									logo: { ...next.logo, source: design.logo.source },
								});
							}}
						>
							{OG_TEMPLATES.map((t) => (
								<option key={t} value={t}>
									{TEMPLATE_LABELS[t]}
								</option>
							))}
						</Select>
					</Field>

					<Field label="Canvas presets">
						<Select
							value={
								OG_CANVAS_PRESETS.some(
									(p) =>
										`${p.width}x${p.height}` === `${design.canvas.width}x${design.canvas.height}`,
								)
									? `${design.canvas.width}x${design.canvas.height}`
									: "custom"
							}
							onChange={(e) => {
								const found = OG_CANVAS_PRESETS.find(
									(p) => `${p.width}x${p.height}` === e.target.value,
								);
								if (found)
									commit({ ...design, canvas: { width: found.width, height: found.height } });
							}}
						>
							{OG_CANVAS_PRESETS.map((p) => (
								<option key={p.slug} value={`${p.width}x${p.height}`}>
									{p.label}
								</option>
							))}
							<option value="custom">Custom…</option>
						</Select>
					</Field>
					<div className="grid grid-cols-2 gap-3">
						<Field label="Width">
							<Input
								type="number"
								value={design.canvas.width}
								min={50}
								max={4096}
								onChange={(e) =>
									commit({
										...design,
										canvas: {
											...design.canvas,
											width: Math.min(4096, Math.max(50, Number(e.target.value) || 1200)),
										},
									})
								}
							/>
						</Field>
						<Field label="Height">
							<Input
								type="number"
								value={design.canvas.height}
								min={50}
								max={4096}
								onChange={(e) =>
									commit({
										...design,
										canvas: {
											...design.canvas,
											height: Math.min(4096, Math.max(50, Number(e.target.value) || 630)),
										},
									})
								}
							/>
						</Field>
					</div>

					<ElementControls kind={selected} design={design} commit={commit} onSelect={setSelected} />

					<BackgroundSection design={design} commit={commit} />

					<div className="flex flex-col gap-3 border-t border-input pt-4">
						<div className="grid gap-3 sm:grid-cols-2">
							<Field label="Format">
								<Segmented
									label="Format"
									value={format}
									onChange={setFormat}
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
									onChange={(v) => setScale(v as "1x" | "2x")}
									options={[
										{ value: "1x", label: "1×" },
										{ value: "2x", label: "2×" },
									]}
								/>
							</Field>
						</div>
						<label className="label-mono flex cursor-pointer items-center gap-2 text-subtle">
							<input
								type="checkbox"
								checked={optimize}
								onChange={(e) => setOptimize(e.target.checked)}
								className="size-4"
							/>
							Optimize file sizes (extra PNG compression)
						</label>
						<Button size="lg" onClick={() => void exportImage()} disabled={exportBusy}>
							{exportBusy ? <Loader2 className="animate-spin" /> : <Download />} Export image
						</Button>
						{exportError && <Notice tone="critical">{exportError}</Notice>}
						{exportResult ? (
							<div className="border border-input bg-surface-2 p-3">
								<p className="text-sm">
									{exportName} · <strong>{formatBytes(exportResult.blob.size)}</strong>
									{exportResult.warnings.length ? (
										<span className="text-xs text-muted-foreground">
											{" "}
											· {exportResult.warnings.length} warning(s)
										</span>
									) : null}
								</p>
								<Button
									size="sm"
									className="mt-2"
									onClick={() => downloadBlob(exportResult.blob, exportName)}
								>
									<Download /> Download
								</Button>
							</div>
						) : null}
					</div>

					<div className="flex flex-col gap-3 border-t border-input pt-4">
						<Field label="Deployment image URL">
							<Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
						</Field>
						<CopyButton text={snippet} label="Copy OG/Twitter metadata" />
						<SocialPreviews preview={previewUrl} canvas={design.canvas} />
					</div>

					<div className="flex flex-col gap-2 border-t border-input pt-4">
						<Button variant="secondary" size="sm" className="self-start" onClick={saveProject}>
							<Download /> Save project (.qbdesign.json)
						</Button>
						<FileDrop
							accept=".json,application/json,.qbdesign.json"
							onFiles={(files) => void loadProject(files)}
							compact
							title="Import project file"
							hint="Restores an editable design saved from this editor"
						/>
						{projectError && <Notice tone="critical">{projectError}</Notice>}
					</div>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Controls per selected element                                       */
/* ------------------------------------------------------------------ */

function TextControls({
	label,
	style,
	onChange,
}: {
	label: string;
	style: OgDesign["title"];
	onChange: (next: OgDesign["title"]) => void;
}) {
	return (
		<div className="flex flex-col gap-3">
			<Field label={`${label} text`}>
				<Input value={style.text} onChange={(e) => onChange({ ...style, text: e.target.value })} />
			</Field>
			<div className="grid grid-cols-2 gap-3">
				<Field label="Font">
					<Select
						value={style.font}
						onChange={(e) => onChange({ ...style, font: e.target.value as TextFont })}
					>
						{FONTS.map((font) => (
							<option key={font}>{font}</option>
						))}
					</Select>
				</Field>
				<Field label="Weight">
					<Select
						value={String(style.fontWeight)}
						onChange={(e) => onChange({ ...style, fontWeight: Number(e.target.value) })}
					>
						<option value="400">Regular</option>
						<option value="700">Bold</option>
					</Select>
				</Field>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<Field label="Text color">
					<input
						type="color"
						value={style.color}
						onChange={(e) => onChange({ ...style, color: e.target.value })}
						className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
						aria-label={`${label} color`}
					/>
				</Field>
				<Field label="Alignment">
					<Segmented
						label="Alignment"
						value={style.align}
						onChange={(align) => onChange({ ...style, align })}
						options={[
							{ value: "left", label: "Left" },
							{ value: "center", label: "Center" },
							{ value: "right", label: "Right" },
						]}
					/>
				</Field>
			</div>
			<Slider
				label="Font size"
				value={style.size}
				min={12}
				max={260}
				step={1}
				valueLabel={`${Math.round(style.size)}px`}
				onChange={(e) => onChange({ ...style, size: Number(e.target.value) })}
			/>
			<Slider
				label="Block width"
				value={style.width}
				min={0.2}
				max={1}
				step={0.01}
				valueLabel={`${Math.round(style.width * 100)}%`}
				onChange={(e) => onChange({ ...style, width: Number(e.target.value) })}
			/>
			<Slider
				label="Spacing (line height)"
				value={style.lineHeight}
				min={0.9}
				max={2}
				step={0.05}
				onChange={(e) => onChange({ ...style, lineHeight: Number(e.target.value) })}
			/>
			<Slider
				label="Letter spacing"
				value={style.letterSpacing}
				min={-2}
				max={10}
				step={0.5}
				onChange={(e) => onChange({ ...style, letterSpacing: Number(e.target.value) })}
			/>
			<div className="grid grid-cols-2 gap-3">
				<Slider
					label="X position"
					value={style.x}
					min={0}
					max={1}
					step={0.01}
					valueLabel={`${Math.round(style.x * 100)}%`}
					onChange={(e) => onChange({ ...style, x: Number(e.target.value) })}
				/>
				<Slider
					label="Y position"
					value={style.y}
					min={0}
					max={1}
					step={0.01}
					valueLabel={`${Math.round(style.y * 100)}%`}
					onChange={(e) => onChange({ ...style, y: Number(e.target.value) })}
				/>
			</div>
		</div>
	);
}

export function ElementControls({
	kind,
	design,
	commit,
	onSelect,
}: {
	kind: ElementKind | null;
	design: OgDesign;
	commit: (design: OgDesign) => void;
	onSelect: (element: ElementKind | null) => void;
}) {
	const [logoError, setLogoError] = useState<string | null>(null);
	const [heroError, setHeroError] = useState<string | null>(null);
	if (!kind) {
		return (
			<p className="text-sm text-muted-foreground">
				Select an element above (or click a box on the canvas) to edit its content and style.
			</p>
		);
	}
	if (kind === "title" || kind === "subtitle") {
		const style = kind === "title" ? design.title : design.subtitle;
		return (
			<div className="flex flex-col gap-3 border-t border-input pt-4" data-element={kind}>
				<TextControls
					label={kind === "title" ? "Title" : "Subtitle"}
					style={style}
					onChange={(next) =>
						commit(kind === "title" ? { ...design, title: next } : { ...design, subtitle: next })
					}
				/>
			</div>
		);
	}
	if (kind === "badge") {
		const badge = design.badge;
		return (
			<div className="flex flex-col gap-3 border-t border-input pt-4" data-element="badge">
				<label className="label-mono flex cursor-pointer items-center gap-2 text-subtle">
					<input
						type="checkbox"
						checked={badge.show}
						onChange={(e) => commit({ ...design, badge: { ...badge, show: e.target.checked } })}
						className="size-4"
					/>
					Show badge
				</label>
				<Field label="Badge text">
					<Input
						value={badge.text}
						onChange={(e) => commit({ ...design, badge: { ...badge, text: e.target.value } })}
						placeholder="NEW"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Badge background">
						<input
							type="color"
							value={badge.bg}
							onChange={(e) => commit({ ...design, badge: { ...badge, bg: e.target.value } })}
							className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
							aria-label="Badge background"
						/>
					</Field>
					<Field label="Badge text color">
						<input
							type="color"
							value={badge.color}
							onChange={(e) => commit({ ...design, badge: { ...badge, color: e.target.value } })}
							className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
							aria-label="Badge text color"
						/>
					</Field>
				</div>
				<Field label="Shape">
					<Segmented
						label="Badge shape"
						value={badge.shape}
						onChange={(shape: BadgeShape) => commit({ ...design, badge: { ...badge, shape } })}
						options={[
							{ value: "pill", label: "Pill" },
							{ value: "square", label: "Square" },
							{ value: "underline", label: "Underline" },
						]}
					/>
				</Field>
				<Slider
					label="Badge size"
					value={badge.size}
					min={16}
					max={80}
					step={1}
					valueLabel={`${Math.round(badge.size)}px`}
					onChange={(e) => commit({ ...design, badge: { ...badge, size: Number(e.target.value) } })}
				/>
				<div className="grid grid-cols-2 gap-3">
					<Slider
						label="X position"
						value={badge.x}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(badge.x * 100)}%`}
						onChange={(e) => commit({ ...design, badge: { ...badge, x: Number(e.target.value) } })}
					/>
					<Slider
						label="Y position"
						value={badge.y}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(badge.y * 100)}%`}
						onChange={(e) => commit({ ...design, badge: { ...badge, y: Number(e.target.value) } })}
					/>
				</div>
			</div>
		);
	}
	if (kind === "logo") {
		return (
			<div className="flex flex-col gap-3 border-t border-input pt-4" data-element="logo">
				<FileDrop
					accept="image/png,image/jpeg,image/webp,image/svg+xml,.heic,.heif,.svg"
					onFiles={async ([file]) => {
						if (!file) return;
						try {
							const art = await normalizeRasterArtwork(file);
							commit({ ...design, logo: { ...design.logo, source: art } });
						} catch (e) {
							setLogoError(String(e instanceof Error ? e.message : "Image failed"));
						}
					}}
					title="Drop a logo"
					hint="PNG, JPG, WebP, HEIC or SVG — stays on your device"
					compact={Boolean(design.logo.source)}
				/>
				{design.logo.source ? (
					<div className="flex items-center justify-between">
						<span className="label-mono text-subtle">
							{design.logo.source.name ?? "Logo"} · {Math.round(design.logo.source.width)}×
							{Math.round(design.logo.source.height)}
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => commit({ ...design, logo: { ...design.logo, source: null } })}
						>
							Remove
						</Button>
					</div>
				) : null}
				<Slider
					label="Logo size"
					value={design.logo.height}
					min={0.05}
					max={0.4}
					step={0.01}
					valueLabel={`${Math.round(design.logo.height * 100)}%`}
					onChange={(e) =>
						commit({ ...design, logo: { ...design.logo, height: Number(e.target.value) } })
					}
				/>
				<div className="grid grid-cols-2 gap-3">
					<Slider
						label="X position"
						value={design.logo.x}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(design.logo.x * 100)}%`}
						onChange={(e) =>
							commit({ ...design, logo: { ...design.logo, x: Number(e.target.value) } })
						}
					/>
					<Slider
						label="Y position"
						value={design.logo.y}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(design.logo.y * 100)}%`}
						onChange={(e) =>
							commit({ ...design, logo: { ...design.logo, y: Number(e.target.value) } })
						}
					/>
				</div>
			</div>
		);
	}
	// hero -------------------------------------------------------------
	const hero = design.hero;
	const crop = hero.placement.crop;
	return (
		<div className="flex flex-col gap-3 border-t border-input pt-4" data-element="hero">
			<FileDrop
				accept="image/png,image/jpeg,image/webp,.heic,.heif"
				onFiles={async ([file]) => {
					if (!file) return;
					try {
						const art = await normalizeRasterArtwork(file);
						commit({
							...design,
							hero: {
								...hero,
								placement: { ...hero.placement, source: art, crop: { x: 0, y: 0, w: 1, h: 1 } },
							},
						});
					} catch (e) {
						setHeroError(String(e instanceof Error ? e.message : "Image failed"));
					}
				}}
				title="Drop a hero image"
				hint="PNG, JPG, WebP or HEIC — processed on your device"
				compact={Boolean(hero.placement.source)}
			/>
			{heroError ? <Notice tone="caution">{heroError}</Notice> : null}
			{logoError ? <Notice tone="caution">{logoError}</Notice> : null}
			{hero.placement.source ? (
				<p className="label-mono text-subtle">
					{hero.placement.source.name ?? "Image"} · {Math.round(hero.placement.source.width)}×
					{Math.round(hero.placement.source.height)}px
				</p>
			) : null}
			<Slider
				label="Image opacity"
				value={hero.opacity}
				min={0.1}
				max={1}
				step={0.05}
				valueLabel={`${Math.round(hero.opacity * 100)}%`}
				onChange={(e) => commit({ ...design, hero: { ...hero, opacity: Number(e.target.value) } })}
			/>
			<Slider
				label="Dark overlay"
				value={design.overlay}
				min={0}
				max={0.9}
				step={0.05}
				valueLabel={`${Math.round(design.overlay * 100)}%`}
				onChange={(e) => commit({ ...design, overlay: Number(e.target.value) })}
			/>
			<Field label="Fit">
				<Segmented
					label="Image fit"
					value={hero.placement.fit}
					onChange={(fit) =>
						commit({
							...design,
							hero: { ...hero, placement: { ...hero.placement, fit } },
						})
					}
					options={[
						{ value: "cover", label: "Fill" },
						{ value: "contain", label: "Fit" },
						{ value: "fill", label: "Stretch" },
					]}
				/>
			</Field>
			{["split-image", "product-card", "event"].includes(design.template) ? (
				<div className="grid grid-cols-2 gap-3">
					<Slider
						label={design.template === "event" ? "Image height" : "Image position"}
						value={design.template === "event" ? hero.width : hero.x}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round((design.template === "event" ? hero.width : hero.x) * 100)}%`}
						onChange={(e) =>
							commit(
								design.template === "event"
									? { ...design, hero: { ...hero, width: Number(e.target.value) } }
									: { ...design, hero: { ...hero, x: Number(e.target.value) } },
							)
						}
					/>
					<Slider
						label={design.template === "event" ? "— unused for this template" : "Image width"}
						value={hero.width}
						min={0.1}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(hero.width * 100)}%`}
						onChange={(e) =>
							commit({ ...design, hero: { ...hero, width: Number(e.target.value) } })
						}
					/>
				</div>
			) : null}
			<Slider
				label="Zoom"
				value={hero.placement.scale}
				min={0.5}
				max={2.5}
				step={0.05}
				valueLabel={`${hero.placement.scale.toFixed(2)}×`}
				onChange={(e) =>
					commit({
						...design,
						hero: { ...hero, placement: { ...hero.placement, scale: Number(e.target.value) } },
					})
				}
			/>
			<div className="grid grid-cols-2 gap-3">
				<Slider
					label="Crop left"
					value={crop.x}
					min={0}
					max={0.8}
					step={0.01}
					valueLabel={`${Math.round(crop.x * 100)}%`}
					onChange={(e) =>
						commit({
							...design,
							hero: {
								...hero,
								placement: {
									...hero.placement,
									crop: {
										...crop,
										x: Number(e.target.value),
										w: Math.min(crop.w, 1 - Number(e.target.value)),
									},
								},
							},
						})
					}
				/>
				<Slider
					label="Crop top"
					value={crop.y}
					min={0}
					max={0.8}
					step={0.01}
					valueLabel={`${Math.round(crop.y * 100)}%`}
					onChange={(e) =>
						commit({
							...design,
							hero: {
								...hero,
								placement: {
									...hero.placement,
									crop: {
										...crop,
										y: Number(e.target.value),
										h: Math.min(crop.h, 1 - Number(e.target.value)),
									},
								},
							},
						})
					}
				/>
				<Slider
					label="Crop width"
					value={crop.w}
					min={0.2}
					max={1}
					step={0.01}
					valueLabel={`${Math.round(crop.w * 100)}%`}
					onChange={(e) =>
						commit({
							...design,
							hero: {
								...hero,
								placement: { ...hero.placement, crop: { ...crop, w: Number(e.target.value) } },
							},
						})
					}
				/>
				<Slider
					label="Crop height"
					value={crop.h}
					min={0.2}
					max={1}
					step={0.01}
					valueLabel={`${Math.round(crop.h * 100)}%`}
					onChange={(e) =>
						commit({
							...design,
							hero: {
								...hero,
								placement: { ...hero.placement, crop: { ...crop, h: Number(e.target.value) } },
							},
						})
					}
				/>
			</div>
			{hero.placement.source ? (
				<Button
					variant="ghost"
					size="sm"
					className="self-start"
					onClick={() =>
						commit({
							...design,
							hero: { ...hero, placement: { ...hero.placement, source: null } },
						})
					}
				>
					Remove image
				</Button>
			) : null}
			{onUnusedSelect}
		</div>
	);
}

const onUnusedSelect = null;

function BackgroundSection({
	design,
	commit,
}: {
	design: OgDesign;
	commit: (design: OgDesign) => void;
}) {
	const bg = design.background;
	return (
		<div className="flex flex-col gap-3 border-t border-input pt-4">
			<Segmented
				label="Background"
				value={bg.type === "none" ? "none" : bg.type}
				onChange={(type) => {
					if (type === "none") commit({ ...design, background: { type: "none" } });
					else if (type === "color") {
						commit({
							...design,
							background: bg.type === "color" ? bg : { type: "color", color: "#0f172a" },
						});
					} else {
						commit({
							...design,
							background:
								bg.type === "gradient"
									? bg
									: { type: "gradient", from: "#4f46e5", to: "#9333ea", angle: 135 },
						});
					}
				}}
				options={[
					{ value: "color", label: "Color" },
					{ value: "gradient", label: "Gradient" },
					{ value: "none", label: "None" },
				]}
			/>
			{bg.type === "color" && (
				<Field label="Background color">
					<input
						type="color"
						value={bg.color}
						onChange={(e) =>
							commit({ ...design, background: { type: "color", color: e.target.value } })
						}
						className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
						aria-label="Background color"
					/>
				</Field>
			)}
			{bg.type === "gradient" && (
				<div className="grid gap-3 sm:grid-cols-3">
					<Field label="From">
						<input
							type="color"
							value={bg.from}
							onChange={(e) => commit({ ...design, background: { ...bg, from: e.target.value } })}
							className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
							aria-label="Gradient from"
						/>
					</Field>
					<Field label="To">
						<input
							type="color"
							value={bg.to}
							onChange={(e) => commit({ ...design, background: { ...bg, to: e.target.value } })}
							className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
							aria-label="Gradient to"
						/>
					</Field>
					<Slider
						label="Angle"
						value={bg.angle}
						min={0}
						max={360}
						step={5}
						valueLabel={`${bg.angle}°`}
						onChange={(e) =>
							commit({ ...design, background: { ...bg, angle: Number(e.target.value) } })
						}
					/>
				</div>
			)}
			<Slider
				label="Canvas padding"
				value={design.padding}
				min={0.02}
				max={0.18}
				step={0.01}
				valueLabel={`${Math.round(design.padding * 100)}%`}
				onChange={(e) => commit({ ...design, padding: Number(e.target.value) })}
			/>
		</div>
	);
}

function SocialPreviews({
	preview,
	canvas,
}: {
	preview?: string;
	canvas: { width: number; height: number };
}) {
	const ratio = canvas.width / canvas.height;
	const wide = { height: 80, width: Math.round(80 * ratio) };
	return (
		<div className="flex flex-col gap-2">
			<span className="label-mono text-subtle">Illustrative previews</span>
			<div className="flex flex-wrap items-end gap-3">
				<div className="flex flex-col items-center gap-1">
					<div
						className="overflow-hidden rounded-lg border border-input bg-surface-2"
						style={{ width: wide.width, height: wide.height }}
					>
						{preview ? (
							<img src={preview} alt="Social card preview" className="size-full object-cover" />
						) : null}
					</div>
					<span className="label-mono text-subtle">Link card</span>
				</div>
				<div className="flex flex-col items-center gap-1">
					<div className="size-14 overflow-hidden rounded-full border border-input bg-surface-2">
						{preview ? (
							<img src={preview} alt="Chat preview" className="size-full object-cover" />
						) : null}
					</div>
					<span className="label-mono text-subtle">Chat</span>
				</div>
			</div>
		</div>
	);
}
