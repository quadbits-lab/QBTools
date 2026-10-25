/**
 * Right-hand inspector for the OG Banner Maker, organized into
 * Design / Elements / Export tabs with grouped, labeled controls.
 */
import type { OgDesign, OgTemplate, RenderedDesign } from "@qbtools/engines/graphic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qbtools/ui/tabs";
import { Palette, Shapes, Share2 } from "lucide-react";
import type { ElementKind } from "./editor-canvas";
import { BackgroundSection, CanvasSection, type DesignChange } from "./inspector/design-sections";
import {
	BadgeControls,
	ElementList,
	HeroControls,
	LogoControls,
} from "./inspector/element-sections";
import { ExportSection, MetadataSection, ProjectSection } from "./inspector/export-sections";
import { TemplatePicker } from "./inspector/template-picker";
import { TextControls } from "./inspector/text-sections";

export function InspectorPanel({
	design,
	commit,
	update,
	selected,
	onSelect,
	onApplyTemplate,
	tab,
	onTabChange,
	format,
	onFormatChange,
	scale,
	onScaleChange,
	optimize,
	onOptimizeChange,
	imageUrl,
	onImageUrlChange,
	onExport,
	exportBusy,
	exportError,
	exportResult,
	exportName,
	onDownload,
	snippet,
	onSaveProject,
	onLoadProject,
	projectError,
	previewUrl,
}: {
	design: OgDesign;
	commit: DesignChange["commit"];
	update: DesignChange["update"];
	selected: ElementKind | null;
	onSelect: (kind: ElementKind) => void;
	onApplyTemplate: (template: OgTemplate) => void;
	tab: string;
	onTabChange: (tab: string) => void;
	format: "png" | "jpeg" | "webp";
	onFormatChange: (f: "png" | "jpeg" | "webp") => void;
	scale: "1x" | "2x";
	onScaleChange: (s: "1x" | "2x") => void;
	optimize: boolean;
	onOptimizeChange: (v: boolean) => void;
	imageUrl: string;
	onImageUrlChange: (url: string) => void;
	onExport: () => void;
	exportBusy: boolean;
	exportError: string | null;
	exportResult: RenderedDesign | null;
	exportName: string;
	onDownload: () => void;
	snippet: string;
	onSaveProject: () => void;
	onLoadProject: (files: File[]) => void;
	projectError: string | null;
	previewUrl?: string;
}) {
	return (
		<div className="flex min-w-0 flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-inset ring-border">
			<Tabs value={tab} onValueChange={onTabChange}>
				<TabsList className="w-full">
					<TabsTrigger value="design" className="flex-1">
						<Palette className="size-3.5" /> Design
					</TabsTrigger>
					<TabsTrigger value="elements" className="flex-1">
						<Shapes className="size-3.5" /> Elements
					</TabsTrigger>
					<TabsTrigger value="export" className="flex-1">
						<Share2 className="size-3.5" /> Export
					</TabsTrigger>
				</TabsList>

				<TabsContent value="design" className="flex flex-col gap-5">
					<TemplatePicker design={design} onApply={onApplyTemplate} />
					<CanvasSection design={design} commit={commit} update={update} />
					<BackgroundSection design={design} commit={commit} update={update} />
				</TabsContent>

				<TabsContent value="elements" className="flex flex-col gap-4">
					<ElementList design={design} selected={selected} onSelect={onSelect} update={update} />
					{selected === "title" || selected === "subtitle" ? (
						<TextControls
							key={selected}
							label={selected === "title" ? "Title" : "Subtitle"}
							style={selected === "title" ? design.title : design.subtitle}
							onChange={(next) =>
								selected === "title"
									? commit({ ...design, title: next })
									: commit({ ...design, subtitle: next })
							}
						/>
					) : null}
					{selected === "badge" ? <BadgeControls design={design} update={update} /> : null}
					{selected === "logo" ? (
						<LogoControls design={design} commit={commit} update={update} />
					) : null}
					{selected === "hero" ? (
						<HeroControls design={design} commit={commit} update={update} />
					) : null}
					{!selected ? (
						<p className="rounded-lg border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground">
							Pick an element — or tap one on the canvas — to edit its content and style.
						</p>
					) : null}
				</TabsContent>

				<TabsContent value="export" className="flex flex-col gap-5">
					<ExportSection
						format={format}
						onFormatChange={onFormatChange}
						scale={scale}
						onScaleChange={onScaleChange}
						optimize={optimize}
						onOptimizeChange={onOptimizeChange}
						onExport={onExport}
						exportBusy={exportBusy}
						exportError={exportError}
						exportResult={exportResult}
						exportName={exportName}
						onDownload={onDownload}
					/>
					<MetadataSection
						imageUrl={imageUrl}
						onImageUrlChange={onImageUrlChange}
						snippet={snippet}
						previewUrl={previewUrl}
						canvas={design.canvas}
					/>
					<ProjectSection
						onSaveProject={onSaveProject}
						onLoadProject={onLoadProject}
						projectError={projectError}
						autosaveHint="Your design is saved to this browser automatically — project files travel between devices."
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
