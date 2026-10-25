import { assetBase } from "@qbtools/engines/assets";
import { downloadBlob, replaceExtension } from "@qbtools/engines/files";
import { decodeImage, drawToCanvas, scaleToFit } from "@qbtools/engines/image";
import type { VectorizeOptions, VectorizePreset } from "@qbtools/engines/vectorize";
import { Badge } from "@qbtools/ui/badge";
import { Button } from "@qbtools/ui/button";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { Switch } from "@qbtools/ui/switch";
import { cn, formatBytes } from "@qbtools/ui/utils";
import {
	Check,
	Code2,
	Columns2,
	Copy,
	Download,
	Eye,
	ImageIcon,
	Layers,
	Loader2,
	RotateCcw,
	Sliders,
	Sparkles,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { SaveToMedia } from "#/components/kit/save-to-media";
import { strParam, type ToolWidgetProps } from "../types";
import type { WorkerRequest, WorkerResponse } from "./worker";

const MAX_DIMENSION = 2048;

type ViewMode = "side-by-side" | "svg" | "original" | "code";

export default function PngToSvg({ params }: ToolWidgetProps) {
	const presetParam = (strParam(params, "preset") || "logo") as VectorizePreset;
	const [preset, setPreset] = useState<VectorizePreset>(presetParam);
	const [file, setFile] = useState<File | null>(null);
	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	const [originalSize, setOriginalSize] = useState<number>(0);
	const [imgDims, setImgDims] = useState<{ width: number; height: number } | null>(null);
	const [rgbaData, setRgbaData] = useState<{
		rgba: Uint8Array;
		width: number;
		height: number;
	} | null>(null);

	// Vectorize configuration
	const [mode, setMode] = useState<"spline" | "polygon" | "pixel">("spline");
	const [colorMode, setColorMode] = useState<"color-cluster" | "bw">("color-cluster");
	const [hierarchical, setHierarchical] = useState<"stacked" | "cutout">("stacked");
	const [filterSpeckle, setFilterSpeckle] = useState<number>(4);
	const [simplify, setSimplify] = useState<number>(1.0);
	const [maxColors, setMaxColors] = useState<number>(16);
	const [autoColors, setAutoColors] = useState<boolean>(true);
	const [binaryThreshold, setBinaryThreshold] = useState<number>(128);
	const [adaptive, setAdaptive] = useState<boolean>(true);
	const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

	// Result state
	const [svgOutput, setSvgOutput] = useState<string | null>(null);
	const [svgBlob, setSvgBlob] = useState<Blob | null>(null);
	const [stats, setStats] = useState<{
		pathsCount: number;
		colorsCount: number;
		durationMs: number;
		sizeBytes: number;
	} | null>(null);

	// UI & View state
	const [status, setStatus] = useState<"idle" | "loading" | "vectorizing" | "ready">("idle");
	const [error, setError] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
	const [zoom, setZoom] = useState<number>(100);
	const [copied, setCopied] = useState<boolean>(false);

	const workerRef = useRef<Worker | null>(null);
	const requestIdRef = useRef<number>(0);
	const wasmUrlRef = useRef<string | null>(null);

	// Initialize Web Worker and preload WASM url
	useEffect(() => {
		const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
		worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
			const data = event.data;
			if (data.type === "result") {
				const blob = new Blob([data.svg], { type: "image/svg+xml;charset=utf-8" });
				setSvgOutput(data.svg);
				setSvgBlob(blob);
				setStats({
					pathsCount: data.pathsCount,
					colorsCount: data.colorsCount,
					durationMs: data.durationMs,
					sizeBytes: blob.size,
				});
				setStatus("ready");
			} else if (data.type === "error") {
				setError(data.message);
				setStatus("ready");
			}
		};
		workerRef.current = worker;

		void assetBase("vtracer")
			.then((base) => {
				wasmUrlRef.current = `${base}/vtracer_wasm_bg.wasm`;
			})
			.catch(() => {
				// handled during request
			});

		return () => {
			worker.terminate();
		};
	}, []);

	// Apply presets
	const applyPreset = useCallback((p: VectorizePreset) => {
		setPreset(p);
		switch (p) {
			case "logo":
				setMode("spline");
				setColorMode("color-cluster");
				setHierarchical("stacked");
				setFilterSpeckle(4);
				setSimplify(1.0);
				setAutoColors(true);
				break;
			case "bw":
				setMode("spline");
				setColorMode("bw");
				setAdaptive(true);
				setBinaryThreshold(128);
				setFilterSpeckle(2);
				setSimplify(0.8);
				break;
			case "photo":
				setMode("spline");
				setColorMode("color-cluster");
				setHierarchical("stacked");
				setFilterSpeckle(2);
				setSimplify(0.5);
				setMaxColors(32);
				setAutoColors(false);
				break;
			case "poster":
				setMode("polygon");
				setColorMode("color-cluster");
				setHierarchical("stacked");
				setFilterSpeckle(8);
				setSimplify(1.5);
				setMaxColors(12);
				setAutoColors(false);
				break;
			case "pixel":
				setMode("pixel");
				setColorMode("color-cluster");
				setHierarchical("stacked");
				setFilterSpeckle(0);
				setSimplify(0);
				setAutoColors(true);
				break;
		}
	}, []);

	// Load and decode input image
	const handleFiles = useCallback(async (files: File[]) => {
		const f = files[0];
		if (!f) return;
		setError(null);
		setFile(f);
		setOriginalSize(f.size);
		setStatus("loading");

		try {
			const objectUrl = URL.createObjectURL(f);
			setOriginalUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return objectUrl;
			});

			const bitmap = await decodeImage(f);
			const fit = scaleToFit(bitmap.width, bitmap.height, MAX_DIMENSION, MAX_DIMENSION);
			const canvas = await drawToCanvas(bitmap, { width: fit.width, height: fit.height });
			bitmap.close();

			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Could not access image pixels.");

			const imgData = ctx.getImageData(0, 0, fit.width, fit.height);
			setImgDims({ width: fit.width, height: fit.height });
			setRgbaData({
				rgba: new Uint8Array(imgData.data.buffer),
				width: fit.width,
				height: fit.height,
			});
			setStatus("ready");
		} catch (err: any) {
			setError(err?.message || "Failed to read image. Please try another file.");
			setStatus("idle");
		}
	}, []);

	// Trigger vectorization when parameters or pixels change
	const triggerVectorize = useCallback(() => {
		if (!rgbaData || !workerRef.current) return;
		setStatus("vectorizing");
		setError(null);

		const reqId = ++requestIdRef.current;
		const options: VectorizeOptions = {
			mode,
			clustering: colorMode,
			hierarchical,
			filterSpeckle,
			simplify: simplify > 0 ? simplify : undefined,
			maxColors: autoColors || colorMode === "bw" ? undefined : maxColors,
			binaryThreshold: colorMode === "bw" ? binaryThreshold : undefined,
			adaptive: colorMode === "bw" ? adaptive : undefined,
		};

		const run = async () => {
			if (!wasmUrlRef.current) {
				const base = await assetBase("vtracer");
				wasmUrlRef.current = `${base}/vtracer_wasm_bg.wasm`;
			}
			workerRef.current?.postMessage(
				{
					id: String(reqId),
					type: "vectorize",
					rgba: rgbaData.rgba,
					width: rgbaData.width,
					height: rgbaData.height,
					options,
					wasmUrl: wasmUrlRef.current,
				} satisfies WorkerRequest,
				[rgbaData.rgba.buffer.slice(0)],
			);
		};

		void run().catch((err) => {
			setError(err?.message || "Vectorization worker failed to start.");
			setStatus("ready");
		});
	}, [
		rgbaData,
		mode,
		colorMode,
		hierarchical,
		filterSpeckle,
		simplify,
		maxColors,
		autoColors,
		binaryThreshold,
		adaptive,
	]);

	// Auto re-vectorize with debounce when controls change
	useEffect(() => {
		if (!rgbaData) return;
		const timer = setTimeout(() => {
			triggerVectorize();
		}, 180);
		return () => clearTimeout(timer);
	}, [triggerVectorize, rgbaData]);

	// Clean up object URLs
	useEffect(() => {
		return () => {
			if (originalUrl) URL.revokeObjectURL(originalUrl);
		};
	}, [originalUrl]);

	// Download SVG file
	const handleDownload = () => {
		if (!svgBlob || !file) return;
		downloadBlob(svgBlob, replaceExtension(file.name, "svg"));
	};

	// Copy SVG markup to clipboard
	const handleCopy = async () => {
		if (!svgOutput) return;
		try {
			await navigator.clipboard.writeText(svgOutput);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setError("Failed to copy SVG to clipboard.");
		}
	};

	// Reset all
	const handleReset = () => {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		setFile(null);
		setOriginalUrl(null);
		setRgbaData(null);
		setSvgOutput(null);
		setSvgBlob(null);
		setStats(null);
		setStatus("idle");
		setError(null);
	};

	// Load demo samples for instant trying
	const loadSample = async (type: "logo" | "icon" | "sketch") => {
		const canvas = document.createElement("canvas");
		canvas.width = 120;
		canvas.height = 120;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		if (type === "logo") {
			// Colorful modern geometric logo
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, 120, 120);

			ctx.fillStyle = "#4f46e5";
			ctx.beginPath();
			ctx.arc(60, 60, 42, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = "#38bdf8";
			ctx.beginPath();
			ctx.arc(48, 50, 22, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = "#ffffff";
			ctx.beginPath();
			ctx.arc(70, 70, 16, 0, Math.PI * 2);
			ctx.fill();
			applyPreset("logo");
		} else if (type === "icon") {
			// Pixel art icon
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, 120, 120);
			const grid = [
				[0, 1, 1, 0],
				[1, 1, 1, 1],
				[1, 0, 0, 1],
				[1, 1, 1, 1],
			];
			const s = 20;
			const ox = 20;
			const oy = 20;
			ctx.fillStyle = "#e11d48";
			for (let r = 0; r < 4; r++) {
				for (let c = 0; c < 4; c++) {
					if (grid[r]?.[c]) {
						ctx.fillRect(ox + c * s, oy + r * s, s, s);
					}
				}
			}
			applyPreset("pixel");
		} else {
			// Black and white signature/sketch
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, 120, 120);
			ctx.strokeStyle = "#111827";
			ctx.lineWidth = 6;
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(25, 70);
			ctx.bezierCurveTo(40, 20, 70, 100, 95, 45);
			ctx.stroke();
			applyPreset("bw");
		}

		canvas.toBlob((blob) => {
			if (!blob) return;
			const sampleFile = new File([blob], `sample-${type}.png`, { type: "image/png" });
			void handleFiles([sampleFile]);
		}, "image/png");
	};

	const filterSpeckleId = useId();
	const simplifyId = useId();
	const maxColorsId = useId();
	const binaryThresholdId = useId();

	const isProcessing = status === "loading" || status === "vectorizing";

	return (
		<div className="flex flex-col gap-6">
			{/* Initial Drop Area */}
			{!rgbaData && (
				<div className="flex flex-col gap-4">
					<FileDrop
						accept="image/*,.heic,.heif,.svg"
						onFiles={handleFiles}
						hint="Drop any PNG, JPG, WebP, GIF, or HEIC image · Up to 2048px · Processed 100% in browser"
					/>
					<div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-sm text-muted-foreground">
						<span>Or try an example:</span>
						<Button variant="outline" size="sm" onClick={() => loadSample("logo")}>
							🎨 Colorful Logo
						</Button>
						<Button variant="outline" size="sm" onClick={() => loadSample("sketch")}>
							🖤 B&W Sketch
						</Button>
						<Button variant="outline" size="sm" onClick={() => loadSample("icon")}>
							👾 Pixel Art
						</Button>
					</div>
				</div>
			)}

			{error && <Notice tone="critical">{error}</Notice>}

			{/* Main Workspace */}
			{rgbaData && (
				<div className="flex flex-col gap-6">
					{/* Top Actions & Preset Bar */}
					<div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-sm font-semibold text-foreground">Presets:</span>
							<Button
								variant={preset === "logo" ? "default" : "outline"}
								size="sm"
								onClick={() => applyPreset("logo")}
							>
								🎨 Logo
							</Button>
							<Button
								variant={preset === "bw" ? "default" : "outline"}
								size="sm"
								onClick={() => applyPreset("bw")}
							>
								🖤 Silhouette / B&W
							</Button>
							<Button
								variant={preset === "photo" ? "default" : "outline"}
								size="sm"
								onClick={() => applyPreset("photo")}
							>
								🖼️ Detailed Photo
							</Button>
							<Button
								variant={preset === "poster" ? "default" : "outline"}
								size="sm"
								onClick={() => applyPreset("poster")}
							>
								📐 Low-Poly
							</Button>
							<Button
								variant={preset === "pixel" ? "default" : "outline"}
								size="sm"
								onClick={() => applyPreset("pixel")}
							>
								👾 Pixel Art
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" onClick={handleReset} title="Upload new file">
								<RotateCcw className="mr-1 h-4 w-4" />
								New Image
							</Button>
						</div>
					</div>

					{/* Vectorizer Settings Controls */}
					<div className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">
						{/* Mode: Spline / Polygon / Pixel */}
						<div className="flex flex-col gap-2">
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Path Approximation
							</span>
							<Segmented
								label="Path Approximation"
								value={mode}
								onChange={(val) => setMode(val as "spline" | "polygon" | "pixel")}
								options={[
									{ value: "spline", label: "Curves" },
									{ value: "polygon", label: "Polygon" },
									{ value: "pixel", label: "Pixel" },
								]}
							/>
						</div>

						{/* Color clustering mode */}
						<div className="flex flex-col gap-2">
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Color Clustering
							</span>
							<Segmented
								label="Color Clustering"
								value={colorMode}
								onChange={(val) => setColorMode(val as "color-cluster" | "bw")}
								options={[
									{ value: "color-cluster", label: "Multi-Color" },
									{ value: "bw", label: "Black & White" },
								]}
							/>
						</div>

						{/* Noise / Speckle filter */}
						<div className="flex flex-col gap-2">
							<Slider
								id={filterSpeckleId}
								label="Noise Rejection"
								valueLabel={`${filterSpeckle} px`}
								min={0}
								max={24}
								value={filterSpeckle}
								onChange={(e) => setFilterSpeckle(Number(e.target.value))}
							/>
						</div>

						{/* Curve simplification */}
						<div className="flex flex-col gap-2">
							<Slider
								id={simplifyId}
								label="Curve Smoothing"
								valueLabel={simplify === 0 ? "Off" : `${simplify.toFixed(1)}`}
								min={0}
								max={3.0}
								step={0.2}
								value={simplify}
								onChange={(e) => setSimplify(Number(e.target.value))}
							/>
						</div>

						{/* Conditional controls: Color Mode vs B&W Mode */}
						{colorMode === "color-cluster" && (
							<>
								<div className="flex flex-col gap-2">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Max Colors</span>
										<label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
											<input
												type="checkbox"
												checked={autoColors}
												onChange={(e) => setAutoColors(e.target.checked)}
												className="rounded border-input text-primary focus:ring-primary"
											/>
											Auto
										</label>
									</div>
									<Slider
										id={maxColorsId}
										label="Max Colors"
										min={2}
										max={32}
										value={maxColors}
										disabled={autoColors}
										valueLabel={autoColors ? "Auto" : `${maxColors}`}
										onChange={(e) => setMaxColors(Number(e.target.value))}
									/>
								</div>

								<div className="flex flex-col gap-2">
									<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Shape Layering
									</span>
									<Segmented
										label="Shape Layering"
										value={hierarchical}
										onChange={(val) => setHierarchical(val as "stacked" | "cutout")}
										options={[
											{ value: "stacked", label: "Stacked" },
											{ value: "cutout", label: "Cutout" },
										]}
									/>
								</div>
							</>
						)}

						{colorMode === "bw" && (
							<>
								<div className="flex flex-col gap-2">
									<Slider
										id={binaryThresholdId}
										label="Threshold"
										valueLabel={`${binaryThreshold}`}
										min={10}
										max={245}
										value={binaryThreshold}
										onChange={(e) => setBinaryThreshold(Number(e.target.value))}
									/>
								</div>

								<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
									<div className="flex flex-col">
										<span className="text-sm font-medium">Adaptive Lighting</span>
										<span className="text-xs text-muted-foreground">
											Bradley-Roth algorithm for uneven light
										</span>
									</div>
									<Switch checked={adaptive} onCheckedChange={setAdaptive} />
								</div>
							</>
						)}

						<div className="col-span-full flex justify-end pt-1">
							<Button
								variant="default"
								size="sm"
								onClick={triggerVectorize}
								disabled={isProcessing}
								className="gap-2"
							>
								{isProcessing ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Vectorizing with WASM…
									</>
								) : (
									<>
										<Sparkles className="h-4 w-4" />
										Re-trace Image
									</>
								)}
							</Button>
						</div>
					</div>

					{/* Metrics and Comparison Header */}
					<div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
						{/* Metrics */}
						<div className="flex flex-wrap items-center gap-3">
							<Badge tone="outline" className="px-2.5 py-1 text-xs">
								Original: {formatBytes(originalSize)}
								{imgDims ? ` (${imgDims.width}×${imgDims.height})` : ""}
							</Badge>

							{stats && (
								<>
									<Badge
										tone={stats.sizeBytes < originalSize ? "positive" : "neutral"}
										className="px-2.5 py-1 text-xs font-semibold"
									>
										SVG: {formatBytes(stats.sizeBytes)} (
										{stats.sizeBytes < originalSize
											? `-${Math.round((1 - stats.sizeBytes / originalSize) * 100)}%`
											: `+${Math.round((stats.sizeBytes / originalSize - 1) * 100)}%`}
										)
									</Badge>
									<Badge tone="outline" className="px-2.5 py-1 text-xs">
										{stats.pathsCount} vector paths
									</Badge>
									{stats.colorsCount > 0 && (
										<Badge tone="outline" className="px-2.5 py-1 text-xs">
											{stats.colorsCount} colors
										</Badge>
									)}
									<Badge tone="outline" className="px-2.5 py-1 text-xs text-muted-foreground">
										⚡ {stats.durationMs}ms
									</Badge>
								</>
							)}
						</div>

						{/* Export actions */}
						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopy}
								disabled={!svgOutput || isProcessing}
								className="gap-1.5"
							>
								{copied ? (
									<Check className="h-4 w-4 text-emerald-500" />
								) : (
									<Copy className="h-4 w-4" />
								)}
								{copied ? "Copied!" : "Copy SVG"}
							</Button>

							<Button
								variant="default"
								size="sm"
								onClick={handleDownload}
								disabled={!svgBlob || isProcessing}
								className="gap-1.5 font-semibold"
							>
								<Download className="h-4 w-4" />
								Download SVG
							</Button>

							{svgBlob && file && (
								<SaveToMedia blob={svgBlob} name={replaceExtension(file.name, "svg")} />
							)}
						</div>
					</div>

					{/* View Mode Bar */}
					<div className="flex flex-wrap items-center justify-between gap-3 px-1">
						<Segmented
							label="View Mode"
							value={viewMode}
							onChange={(v) => setViewMode(v as ViewMode)}
							options={[
								{ value: "side-by-side", label: "Side-by-Side" },
								{ value: "svg", label: "SVG Vector" },
								{ value: "original", label: "Original PNG" },
								{ value: "code", label: "SVG Code" },
							]}
						/>

						{viewMode !== "code" && (
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setZoom((z) => Math.max(25, z - 25))}
									disabled={zoom <= 25}
									title="Zoom Out"
								>
									<ZoomOut className="h-4 w-4" />
								</Button>
								<span className="text-xs font-mono font-medium text-muted-foreground min-w-[3rem] text-center">
									{zoom}%
								</span>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setZoom((z) => Math.min(300, z + 25))}
									disabled={zoom >= 300}
									title="Zoom In"
								>
									<ZoomIn className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setZoom(100)}
									className="text-xs h-8 px-2"
								>
									Fit
								</Button>
							</div>
						)}
					</div>

					{/* Live Canvas / Preview Area */}
					<div className="relative min-h-[420px] w-full overflow-auto rounded-xl border bg-muted/20 p-4 shadow-inner flex items-center justify-center">
						{/* Checkerboard background */}
						<div
							className="absolute inset-0 opacity-40 pointer-events-none"
							style={{
								backgroundImage: `linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)`,
								backgroundSize: "20px 20px",
								backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
							}}
						/>

						{isProcessing && (
							<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
								<p className="text-sm font-medium text-foreground">
									Tracing vector paths with WASM…
								</p>
							</div>
						)}

						{/* Side-by-side mode */}
						{viewMode === "side-by-side" && (
							<div className="relative z-10 grid w-full grid-cols-1 gap-6 md:grid-cols-2 items-center justify-items-center">
								{/* Original */}
								<div className="flex flex-col items-center gap-2">
									<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Original Raster
									</span>
									<div
										className="flex items-center justify-center rounded-lg border bg-background/80 p-3 shadow-sm transition-transform"
										style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
									>
										{originalUrl && (
											<img
												src={originalUrl}
												alt="Original"
												className="max-h-[360px] max-w-full object-contain"
											/>
										)}
									</div>
								</div>

								{/* Vector Result */}
								<div className="flex flex-col items-center gap-2">
									<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
										<Sparkles className="h-3.5 w-3.5 text-primary" />
										Scalable SVG Vector
									</span>
									<div
										className="flex items-center justify-center rounded-lg border bg-background/80 p-3 shadow-sm transition-transform"
										style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
									>
										{svgOutput ? (
											<div
												className="max-h-[360px] max-w-full flex items-center justify-center [&>svg]:max-h-[360px] [&>svg]:w-auto [&>svg]:h-auto"
												dangerouslySetInnerHTML={{ __html: svgOutput }}
											/>
										) : (
											<div className="flex h-48 w-48 items-center justify-center text-sm text-muted-foreground">
												Processing…
											</div>
										)}
									</div>
								</div>
							</div>
						)}

						{/* SVG Only mode */}
						{viewMode === "svg" && (
							<div
								className="relative z-10 flex items-center justify-center rounded-lg border bg-background/80 p-4 shadow-sm transition-transform"
								style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
							>
								{svgOutput ? (
									<div
										className="max-h-[480px] max-w-full flex items-center justify-center [&>svg]:max-h-[480px] [&>svg]:w-auto [&>svg]:h-auto"
										dangerouslySetInnerHTML={{ __html: svgOutput }}
									/>
								) : (
									<div className="text-sm text-muted-foreground">No SVG generated yet.</div>
								)}
							</div>
						)}

						{/* Original Only mode */}
						{viewMode === "original" && originalUrl && (
							<div
								className="relative z-10 flex items-center justify-center rounded-lg border bg-background/80 p-4 shadow-sm transition-transform"
								style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
							>
								<img
									src={originalUrl}
									alt="Original"
									className="max-h-[480px] max-w-full object-contain"
								/>
							</div>
						)}

						{/* Code preview mode */}
						{viewMode === "code" && (
							<div className="relative z-10 w-full max-w-4xl">
								<pre className="max-h-[440px] overflow-auto rounded-lg border bg-zinc-950 p-4 font-mono text-xs text-zinc-100 shadow-md">
									<code>{svgOutput || "<!-- No SVG markup generated yet -->"}</code>
								</pre>
							</div>
						)}
					</div>
				</div>
			)}

			<PrivacyNote />
		</div>
	);
}
