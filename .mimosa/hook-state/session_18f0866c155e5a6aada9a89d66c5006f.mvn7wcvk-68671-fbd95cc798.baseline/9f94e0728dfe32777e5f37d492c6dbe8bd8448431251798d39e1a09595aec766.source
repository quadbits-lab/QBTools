/**
 * Favicon Generator — browser icon package with ICO/PNG/SVG, manifest and
 * installation instructions. Rendering and ZIP building run in a worker.
 */
import { downloadBlob, zipFiles } from "@qbtools/engines/files";
import type {
	DesignProject,
	DesignSettings,
	FaviconExportOptions,
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
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qbtools/ui/tabs";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { Download, FileArchive, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "#/components/kit/copy-button";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useObjectUrl } from "#/components/kit/use-object-url";
import { graphicAssets } from "#/lib/graphic-assets";
import { useGraphicPreview } from "#/lib/graphic-preview";
import { ProcessingWorker } from "#/lib/processing/worker-client";
import type { ToolWidgetProps } from "#/tools/types";
import { ArtworkEditor, CropControls } from "./artwork";

export default function FaviconGenerator({ params: _params }: ToolWidgetProps) {
	const [design, setDesign] = useState(() => defaultIconDesign("favicon"));
	const [options, setOptions] = useState<FaviconExportOptions>({
		appName: "My Site",
		shortName: "Site",
		themeColor: "#0f172a",
		bgColor: "#ffffff",
		startUrl: "/",
		assetPath: "/icons/",
		transparentBrowserIcon: false,
		webpBrowserIcons: true,
		optimize: true,
	});
	const [assets, setAssets] = useState<GeneratedAssetSet | null>(null);
	const [assetError, setAssetError] = useState<string | null>(null);
	const [zipBusy, setZipBusy] = useState(false);
	const [warnings, setWarnings] = useState<Array<{ message: string; skipped?: boolean }>>([]);

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
		async (target: typeof design) => {
			const result = await previewWorker.run<RenderedDesign>("graphic-render", {
				design: { tool: "favicon", design: target } satisfies DesignSettings,
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
	const preview = useGraphicPreview(design, renderPreview);
	const previewUrl = useObjectUrl(preview.blob);

	const htmlSnippet = [
		`<link rel="icon" href="${options.assetPath}favicon.ico" sizes="48x48">`,
		`<link rel="icon" type="image/svg+xml" href="${options.assetPath}favicon.svg">`,
		`<link rel="icon" type="image/png" sizes="32x32" href="${options.assetPath}favicon-32x32.png">`,
		`<link rel="apple-touch-icon" href="${options.assetPath}apple-touch-icon.png">`,
		`<link rel="manifest" href="${options.assetPath}site.webmanifest">`,
		`<meta name="theme-color" content="${options.themeColor}">`,
	].join("\n");

	const generate = async () => {
		setAssetError(null);
		setZipBusy(true);
		setAssets(null);
		try {
			const result = await exportWorker.run<GeneratedAssetSet>("graphic-favicon", {
				design: { ...design, tool: "favicon" },
				options,
				assets: await graphicAssets(),
			});
			setAssets(result);
			setWarnings(result.warnings ?? []);
		} catch (e) {
			setAssetError(e instanceof Error ? e.message : "The package could not be generated.");
		} finally {
			setZipBusy(false);
		}
	};

	const saveProject = () => {
		const blob = serializeDesign({
			device: "favicon",
			version: 1,
			settings: { tool: "favicon", design },
			meta: {
				name: options.appName || "Favicon",
				savedAt: new Date().toISOString(),
			},
		} satisfies DesignProject);
		downloadBlob(blob, projectFileName("favicon", options.appName || "favicon"));
	};

	return (
		<div className="flex flex-col gap-8">
			<PrivacyNote text="Your artwork is never uploaded. All icons are generated on this device." />

			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
				{/* Previews ------------------------------------------------ */}
				<div className="flex flex-col gap-4">
					<div className="border border-input bg-surface-2 p-6">
						<div className="relative mx-auto size-40">
							{preview.blob ? (
								<img src={previewUrl} alt="Icon preview" className="size-full" draggable={false} />
							) : (
								<div className="grid size-full place-items-center">
									<Loader2 className="size-6 animate-spin text-subtle" />
								</div>
							)}
						</div>
						<p className="mt-3 text-center font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">
							1024 px artwork · exports render from this design
						</p>
					</div>

					{/* Browser tab mock */}
					<div className="flex flex-col gap-2">
						<span className="label-mono text-subtle">Browser tab</span>
						<div className="flex items-center gap-2 rounded-t-md border border-input border-b-0 bg-surface-2 px-3 py-1.5">
							{preview.blob ? <img src={previewUrl} alt="" className="size-4 shrink-0" /> : null}
							<span className="max-w-[16rem] truncate text-xs">{options.appName}</span>
							<Button
								variant="ghost"
								size="sm"
								className="ml-auto p-1 text-subtle"
								aria-label="Close tab preview"
							>
								×
							</Button>
						</div>
						<div className="flex items-center gap-2 rounded-b-md border border-input px-3 py-1.5 opacity-50">
							<span className="size-4 rounded-full bg-input" />
							<span className="text-xs text-muted-foreground">Another tab</span>
						</div>
					</div>

					{/* Light / dark */}
					<div className="grid grid-cols-2 gap-3">
						{(
							[
								{ tone: "light", label: "Light", className: "bg-white text-zinc-900" },
								{
									tone: "dark",
									label: "Dark",
									className: "bg-zinc-900 text-zinc-100",
								},
							] as const
						).map(({ tone, label, className }) => (
							<div key={tone}>
								<span className="label-mono text-subtle">{label} home screen</span>
								<div
									className={cn(
										"mt-1 grid place-items-center rounded-lg border border-input p-4",
										className,
									)}
								>
									{preview.blob ? (
										<img
											src={previewUrl}
											alt={`${label} home screen preview`}
											className="size-16 rounded-2xl"
										/>
									) : null}
									<span className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest">
										{label} · {options.shortName}
									</span>
								</div>
							</div>
						))}
					</div>

					{/* Maskable */}
					<div className="grid grid-cols-3 gap-3">
						{["circle", "squircle", "rounded-square"].map((shape) => (
							<div key={shape} className="flex flex-col items-center gap-1">
								<div className="relative size-20">
									{preview.blob ? (
										<img
											src={previewUrl}
											alt={`${shape} mask preview`}
											className={cn(
												"size-full",
												shape === "circle" && "rounded-full",
												shape === "squircle" && "rounded-[28%]",
												shape === "rounded-square" && "rounded-xl",
											)}
											style={{ display: "block" }}
										/>
									) : null}
									<div
										aria-hidden
										className={cn(
											"pointer-events-none absolute inset-0 border-2 border-dashed border-foreground/50",
											shape === "circle" && "rounded-full",
											shape === "squircle" && "rounded-[28%]",
											shape === "rounded-square" && "rounded-xl",
										)}
									/>
								</div>
								<span className="label-mono text-subtle">{shape}</span>
							</div>
						))}
					</div>
					<p className="text-xs text-muted-foreground">
						Maskable exports keep artwork inside the safe circle; corner masks here are preview only
						— exported icons stay square.
					</p>

					{(preview.warnings.length > 0 || warnings.length > 0) && (
						<Notice tone="caution">
							<ul className="list-disc pl-4">
								{[...preview.warnings, ...warnings].map((w, i) => (
									<li key={`${w.message}-${i}`}>{w.message}</li>
								))}
							</ul>
						</Notice>
					)}
				</div>

				{/* Controls ------------------------------------------------ */}
				<div className="flex flex-col gap-4">
					<Tabs defaultValue="artwork">
						<TabsList>
							<TabsTrigger value="artwork">Artwork</TabsTrigger>
							<TabsTrigger value="app">Names & colors</TabsTrigger>
							<TabsTrigger value="output">Output</TabsTrigger>
						</TabsList>

						<TabsContent value="artwork">
							<div className="flex flex-col gap-4">
								<ArtworkEditor design={design} onChange={setDesign} />
								{design.artwork.source?.kind === "raster" ? (
									<CropControls design={design} onChange={setDesign} />
								) : null}
							</div>
						</TabsContent>

						<TabsContent value="app">
							<div className="flex flex-col gap-4">
								<div className="grid gap-3 sm:grid-cols-2">
									<Field label="Application name">
										<Input
											value={options.appName}
											onChange={(e) => setOptions({ ...options, appName: e.target.value })}
											placeholder="My Site"
											maxLength={45}
										/>
									</Field>
									<Field label="Short name">
										<Input
											value={options.shortName}
											onChange={(e) => setOptions({ ...options, shortName: e.target.value })}
											placeholder="Site"
											maxLength={12}
										/>
									</Field>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<Field label="Theme color">
										<input
											type="color"
											value={options.themeColor}
											onChange={(e) => setOptions({ ...options, themeColor: e.target.value })}
											className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
											aria-label="Theme color"
										/>
									</Field>
									<Field label="Manifest background">
										<input
											type="color"
											value={options.bgColor}
											onChange={(e) => setOptions({ ...options, bgColor: e.target.value })}
											className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
											aria-label="Manifest background color"
										/>
									</Field>
								</div>
								<Field label="Start URL">
									<Input
										value={options.startUrl}
										onChange={(e) => setOptions({ ...options, startUrl: e.target.value })}
										placeholder="/"
									/>
								</Field>
								<Field label="Deployment asset path">
									<Input
										value={options.assetPath}
										onChange={(e) => setOptions({ ...options, assetPath: e.target.value })}
										placeholder="/icons/"
									/>
								</Field>
							</div>
						</TabsContent>

						<TabsContent value="output">
							<div className="flex flex-col gap-4">
								<label className="label-mono flex cursor-pointer items-center justify-between gap-2 text-subtle">
									Transparent browser icons
									<input
										type="checkbox"
										checked={options.transparentBrowserIcon}
										onChange={(e) =>
											setOptions({ ...options, transparentBrowserIcon: e.target.checked })
										}
										className="size-4"
									/>
								</label>
								<label className="label-mono flex cursor-pointer items-center justify-between gap-2 text-subtle">
									Also emit WebP browser icons
									<input
										type="checkbox"
										checked={options.webpBrowserIcons}
										onChange={(e) => setOptions({ ...options, webpBrowserIcons: e.target.checked })}
										className="size-4"
									/>
								</label>
								<label className="label-mono flex cursor-pointer items-center justify-between gap-2 text-subtle">
									Optimize file sizes
									<input
										type="checkbox"
										checked={options.optimize}
										onChange={(e) => setOptions({ ...options, optimize: e.target.checked })}
										className="size-4"
									/>
								</label>
								<Notice tone="info">
									Generating icons covers the browser tab, bookmarks and home screens. Making a site{" "}
									<em>installable as a PWA</em> additionally needs HTTPS + a service worker — the
									README explains both.
								</Notice>
							</div>
						</TabsContent>
					</Tabs>

					<Button size="lg" onClick={() => void generate()} disabled={zipBusy}>
						{zipBusy ? <Loader2 className="animate-spin" /> : <FileArchive />} Generate favicon
						package
					</Button>

					{assetError && <Notice tone="critical">{assetError}</Notice>}
					{assets?.zip ? (
						<div className="border border-input bg-surface-2 p-4">
							<p className="text-sm">
								{assets.zip.name} · <strong>{formatBytes(assets.zip.blob.size)}</strong> ·{" "}
								{assets.files.length} files
							</p>
							<div className="mt-2 flex flex-wrap gap-2">
								<Button
									size="sm"
									onClick={() => {
										const zip = assets.zip;
										if (zip) downloadBlob(zip.blob, zip.name);
									}}
								>
									<Download /> Download ZIP
								</Button>
								<Button
									size="sm"
									variant="secondary"
									onClick={() =>
										void zipFiles(
											assets.files.map((file) => ({ name: file.name, blob: file.blob })),
										).then((zip) => downloadBlob(zip, "favicon-files.zip"))
									}
								>
									Download individual files
								</Button>
							</div>
							<details className="mt-3">
								<summary className="label-mono cursor-pointer text-subtle">
									Files in the zip
								</summary>
								<ul className="mt-2 space-y-1 pl-1">
									{assets.files.map((file) => (
										<li key={file.name} className="text-xs text-muted-foreground">
											{file.name}
										</li>
									))}
								</ul>
							</details>
						</div>
					) : null}

					<div className="flex flex-col gap-3 border-t border-input pt-4">
						<CopyButton text={htmlSnippet} label="Copy <head> snippet" />
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
							if (project.device !== "favicon")
								throw new Error("That project was created with a different tool.");
							onLoaded(
								(project as { settings: { tool: "favicon"; design: IconDesign } }).settings.design,
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
