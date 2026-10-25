/**
 * OG Banner Maker — interactive Open Graph banner editor.
 * Rasterization runs in a worker via resvg; previews cap at 960 px and export
 * renders at requested sizes. All processing stays on the device.
 */
import { downloadBlob } from "@qbtools/engines/files";
import type {
	DesignProject,
	DesignSettings,
	OgDesign,
	OgTemplate,
	RenderedDesign,
} from "@qbtools/engines/graphic";
import {
	defaultOgDesign,
	layoutOg,
	normalizeOgDesign,
	OG_TEMPLATES,
	ogContentFrame,
	ogElementBoxes,
	parseDesign,
	projectFileName,
	serializeDesign,
} from "@qbtools/engines/graphic";
import { toast } from "@qbtools/ui/toaster";
import { useCallback, useEffect, useRef, useState } from "react";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useObjectUrl } from "#/components/kit/use-object-url";
import { readAutosave, useAutosave } from "#/lib/design-autosave";
import { useDesignHistory, useUndoHotkeys } from "#/lib/design-history";
import { graphicAssets } from "#/lib/graphic-assets";
import { useGraphicPreview } from "#/lib/graphic-preview";
import { ProcessingWorker } from "#/lib/processing/worker-client";
import { numParam, strParam, type ToolWidgetProps } from "#/tools/types";
import type { ElementKind, HandleSide } from "./editor-canvas";
import { EditorCanvas } from "./editor-canvas";
import { InspectorPanel } from "./inspector-panel";

const PREVIEW_MAX_EDGE = 960;
const AUTOSAVE_KEY = "qbtools:og-banner-design:v2";

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

/** Initial design from preset params (landing pages) with sensible fallbacks. */
function initialDesign(params: ToolWidgetProps["params"]): OgDesign {
	const templateParam = strParam(params, "template");
	const template = (OG_TEMPLATES as string[]).includes(templateParam as string)
		? (templateParam as OgTemplate)
		: "gradient";
	const base = defaultOgDesign(template);
	const from = strParam(params, "from");
	const to = strParam(params, "to");
	const angle = numParam(params, "angle");
	const background =
		from && to ? { type: "gradient" as const, from, to, angle: angle ?? 135 } : base.background;
	return normalizeOgDesign({
		...base,
		background,
		canvas: {
			width: numParam(params, "width") ?? base.canvas.width,
			height: numParam(params, "height") ?? base.canvas.height,
		},
	});
}

/** Restore the last autosaved design, normalized against the current schema. */
function restoredDesign(params: ToolWidgetProps["params"]): {
	design: OgDesign;
	restored: boolean;
} {
	const saved = readAutosave<OgDesign>(AUTOSAVE_KEY);
	if (saved?.tool !== "og-banner") return { design: initialDesign(params), restored: false };
	try {
		return { design: normalizeOgDesign(saved), restored: true };
	} catch {
		return { design: initialDesign(params), restored: false };
	}
}

export default function OgBannerMaker({ params }: ToolWidgetProps) {
	const [boot] = useState(() => restoredDesign(params));
	const history = useDesignHistory<OgDesign>(() => boot.design);
	const design = history.design;
	const [selected, setSelectedRaw] = useState<ElementKind | null>("title");
	const [inspectorTab, setInspectorTab] = useState("design");
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

	useAutosave(AUTOSAVE_KEY, design);
	const announceRestore = useRef(boot.restored);
	useEffect(() => {
		if (!announceRestore.current) return;
		announceRestore.current = false;
		toast("Restored your last banner", {
			description: "Continue editing, or use Reset to start over.",
		});
	}, []);

	const { commit, update, beginInteraction, updateLive, endInteraction, undo, redo } = history;
	useUndoHotkeys(undo, redo);

	/** Selecting an element (canvas, chips or list) opens its inspector controls. */
	const setSelected = (kind: ElementKind | null) => {
		setSelectedRaw(kind);
		if (kind) setInspectorTab("elements");
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
				assets: await graphicAssets(),
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
				assets: await graphicAssets(),
			});
			const name = `og-banner-${Math.round(width)}x${Math.round(height)}.${format === "jpeg" ? "jpg" : format}`;
			setExportName(name);
			setExportResult(result);
			toast.success("Export ready", { description: `${name} is ready to download.` });
		} catch (e) {
			setExportError(e instanceof Error ? e.message : "Export failed. Please try again.");
		} finally {
			setExportBusy(false);
		}
	};
	const downloadExport = () => {
		if (!exportResult) return;
		downloadBlob(exportResult.blob, exportName);
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

	// ---- templates -------------------------------------------------------
	/** Apply a template's look while keeping the user's text and artwork. */
	const applyTemplate = (template: OgTemplate) => {
		const next = defaultOgDesign(template);
		commit(
			normalizeOgDesign({
				...next,
				canvas: design.canvas,
				background: next.background,
				hero: {
					...next.hero,
					placement: {
						...next.hero.placement,
						source: design.hero.placement.source,
						crop: design.hero.placement.crop,
					},
				},
				logo: { ...next.logo, source: design.logo.source },
				title: { ...next.title, text: design.title.text },
				subtitle: { ...next.subtitle, text: design.subtitle.text },
				badge: { ...next.badge, text: design.badge.text },
			}),
		);
	};
	const resetTemplate = () => {
		const next = defaultOgDesign(design.template);
		commit({
			...next,
			canvas: design.canvas,
			hero: {
				...next.hero,
				placement: { ...next.hero.placement, source: design.hero.placement.source },
			},
			logo: { ...next.logo, source: design.logo.source },
		});
	};

	// ---- canvas interaction ----------------------------------------------
	const stageRef = useRef<HTMLDivElement>(null);
	const designRef = useRef(design);
	designRef.current = design;
	const boxes = ogElementBoxes(design);
	const heroHandles: HandleSide[] =
		design.template === "split-image"
			? ["w", "e"]
			: design.template === "event"
				? ["n"]
				: design.template === "product-card"
					? ["e"]
					: [];

	const trackPointer = (onMove: (e: PointerEvent) => void, onUp: () => void) => {
		const up = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", up);
			window.removeEventListener("pointercancel", up);
			onUp();
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", up);
		window.addEventListener("pointercancel", up);
	};

	/** Drag-to-move: cursor position maps to the element's normalized slot. */
	const onElementPointerDown = (kind: ElementKind, event: React.PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0) return;
		event.preventDefault();
		const container = stageRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		beginInteraction();
		const move = (moveEvent: PointerEvent) => {
			const fracX = clamp01((moveEvent.clientX - rect.left) / rect.width);
			const fracY = clamp01((moveEvent.clientY - rect.top) / rect.height);
			const current = designRef.current;
			const bDrag = ogElementBoxes(current)[kind];
			if (!bDrag) return;
			const fr = ogContentFrame(current);
			const px = fracX * current.canvas.width;
			const py = fracY * current.canvas.height;
			const toXBlock = clamp01((px - fr.x) / Math.max(1, fr.w - bDrag.w));
			const toYBlock = clamp01((py - fr.y) / Math.max(1, fr.h - bDrag.h));
			updateLive((d) => {
				switch (kind) {
					case "title":
						return { ...d, title: { ...d.title, x: toXBlock, y: toYBlock } };
					case "subtitle":
						return { ...d, subtitle: { ...d.subtitle, x: toXBlock, y: toYBlock } };
					case "badge":
						return { ...d, badge: { ...d.badge, x: toXBlock, y: toYBlock } };
					case "logo":
						return { ...d, logo: { ...d.logo, x: toXBlock, y: toYBlock } };
					case "hero":
						return {
							...d,
							hero: {
								...d.hero,
								placement: {
									...d.hero.placement,
									offsetX: (fracX - 0.5) * 0.4,
									offsetY: (fracY - 0.5) * 0.4,
								},
							},
						};
				}
			});
		};
		trackPointer(move, endInteraction);
	};

	/** Handle drags resize elements; scale maps screen px to design px. */
	const onHandlePointerDown = (
		kind: ElementKind,
		side: HandleSide,
		event: React.PointerEvent<HTMLSpanElement>,
	) => {
		if (event.button !== 0) return;
		event.preventDefault();
		event.stopPropagation();
		const container = stageRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const start = designRef.current;
		const layout = layoutOg(start);
		const startBox = ogElementBoxes(start)[kind];
		if (!startBox) return;
		const scale = start.canvas.width / rect.width;
		beginInteraction();
		const move = (e: PointerEvent) => {
			const designX = (e.clientX - rect.left) * scale;
			const designY = (e.clientY - rect.top) * scale;
			updateLive((d) => {
				switch (`${kind}:${side}`) {
					case "title:e":
					case "subtitle:e": {
						const width = clamp((designX - startBox.x) / layout.textFrame.w, 0.08, 1);
						return kind === "title"
							? { ...d, title: { ...d.title, width } }
							: { ...d, subtitle: { ...d.subtitle, width } };
					}
					case "title:se":
					case "subtitle:se": {
						const factor =
							Math.hypot(designX - startBox.x, designY - startBox.y) /
							Math.max(1, Math.hypot(startBox.w, startBox.h));
						const size = clamp(
							(kind === "title" ? start.title.size : start.subtitle.size) * factor,
							12,
							320,
						);
						return kind === "title"
							? { ...d, title: { ...d.title, size } }
							: { ...d, subtitle: { ...d.subtitle, size } };
					}
					case "badge:se": {
						const factor =
							Math.hypot(designX - startBox.x, designY - startBox.y) /
							Math.max(1, Math.hypot(startBox.w, startBox.h));
						const size = clamp(start.badge.size * factor, 14, 90);
						return { ...d, badge: { ...d.badge, size } };
					}
					case "logo:se": {
						const factor =
							Math.hypot(designX - startBox.x, designY - startBox.y) /
							Math.max(1, Math.hypot(startBox.w, startBox.h));
						const height = clamp(start.logo.height * factor, 0.04, 0.45);
						return { ...d, logo: { ...d.logo, height } };
					}
					case "hero:e": {
						if (d.template === "product-card") {
							const width = clamp(
								start.hero.width + (designX - (startBox.x + startBox.w)) / (d.canvas.width * 0.7),
								0.3,
								1.3,
							);
							return { ...d, hero: { ...d.hero, width } };
						}
						const width = clamp(
							start.hero.width + (designX - (startBox.x + startBox.w)) / d.canvas.width,
							0.12,
							1,
						);
						return { ...d, hero: { ...d.hero, width } };
					}
					case "hero:w": {
						const x = clamp(
							start.hero.x +
								(designX - startBox.x) / Math.max(1, d.canvas.width - 2 * layout.frame.x),
							0,
							1,
						);
						return { ...d, hero: { ...d.hero, x } };
					}
					case "hero:n": {
						const width = clamp(
							start.hero.width + (startBox.y - designY) / d.canvas.height,
							0.12,
							0.9,
						);
						return { ...d, hero: { ...d.hero, width } };
					}
					default:
						return d;
				}
			});
		};
		trackPointer(move, endInteraction);
	};

	// ---- keyboard nudge ---------------------------------------------------
	const applyNudgeRef = useRef((kind: ElementKind, dx: number, dy: number) => {
		const current = designRef.current;
		if (!ogElementBoxes(current)[kind]) return;
		update((d) => {
			switch (kind) {
				case "title":
					return {
						...d,
						title: { ...d.title, x: clamp01(d.title.x + dx), y: clamp01(d.title.y + dy) },
					};
				case "subtitle":
					return {
						...d,
						subtitle: {
							...d.subtitle,
							x: clamp01(d.subtitle.x + dx),
							y: clamp01(d.subtitle.y + dy),
						},
					};
				case "badge":
					return {
						...d,
						badge: { ...d.badge, x: clamp01(d.badge.x + dx), y: clamp01(d.badge.y + dy) },
					};
				case "logo":
					return {
						...d,
						logo: { ...d.logo, x: clamp01(d.logo.x + dx), y: clamp01(d.logo.y + dy) },
					};
				case "hero":
					return {
						...d,
						hero: {
							...d.hero,
							placement: {
								...d.hero.placement,
								offsetX: clamp(d.hero.placement.offsetX + dx * 0.2, -0.25, 0.25),
								offsetY: clamp(d.hero.placement.offsetY + dy * 0.2, -0.25, 0.25),
							},
						},
					};
			}
		});
	});
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
			if (!selected || !e.key.startsWith("Arrow")) return;
			e.preventDefault();
			const step = e.shiftKey ? 0.05 : 0.01;
			const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
			const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
			applyNudgeRef.current(selected, dx, dy);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [selected]);

	return (
		<div className="flex flex-col gap-6">
			<PrivacyNote text="Designing and exporting happen on your device — artwork and text never leave the browser." />

			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
				<div ref={stageRef} className="min-w-0 self-start lg:self-stretch">
					<div className="lg:sticky lg:top-20">
						<EditorCanvas
							aspectRatio={`${design.canvas.width} / ${design.canvas.height}`}
							canvas={design.canvas}
							previewUrl={previewUrl}
							previewBusy={preview.busy}
							hasPreview={Boolean(preview.blob)}
							boxes={boxes}
							selected={selected}
							onSelect={setSelected}
							onElementPointerDown={onElementPointerDown}
							onHandlePointerDown={onHandlePointerDown}
							heroHandles={heroHandles}
							onUndo={undo}
							onRedo={redo}
							onReset={resetTemplate}
							canUndo={history.canUndo}
							canRedo={history.canRedo}
							warnings={preview.warnings}
						/>
					</div>
				</div>

				<InspectorPanel
					design={design}
					commit={commit}
					update={update}
					selected={selected}
					onSelect={setSelected}
					onApplyTemplate={applyTemplate}
					tab={inspectorTab}
					onTabChange={setInspectorTab}
					format={format}
					onFormatChange={setFormat}
					scale={scale}
					onScaleChange={setScale}
					optimize={optimize}
					onOptimizeChange={setOptimize}
					imageUrl={imageUrl}
					onImageUrlChange={setImageUrl}
					onExport={() => void exportImage()}
					exportBusy={exportBusy}
					exportError={exportError}
					exportResult={exportResult}
					exportName={exportName}
					onDownload={downloadExport}
					snippet={snippet}
					onSaveProject={saveProject}
					onLoadProject={(files) => void loadProject(files)}
					projectError={projectError}
					previewUrl={previewUrl}
				/>
			</div>
		</div>
	);
}
