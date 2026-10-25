/** Badge, logo and hero image controls plus the element selector list. */
import type { BadgeShape, OgDesign } from "@qbtools/engines/graphic";
import { normalizeRasterArtwork } from "@qbtools/engines/graphic-design";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { Switch } from "@qbtools/ui/switch";
import { cn } from "@qbtools/ui/utils";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { ColorField } from "#/components/kit/color-field";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { Section } from "#/components/kit/section";
import { ELEMENT_LABELS, type ElementKind } from "../editor-canvas";
import type { DesignChange } from "./design-sections";

export function ElementList({
	design,
	selected,
	onSelect,
	update,
}: {
	design: OgDesign;
	selected: ElementKind | null;
	onSelect: (kind: ElementKind) => void;
	update: DesignChange["update"];
}) {
	const visible = (kind: ElementKind): boolean => {
		switch (kind) {
			case "title":
				return design.title.show !== false && design.title.text.trim().length > 0;
			case "subtitle":
				return design.subtitle.show !== false && design.subtitle.text.trim().length > 0;
			case "badge":
				return design.badge.show && design.badge.text.trim().length > 0;
			case "logo":
				return Boolean(design.logo.source);
			case "hero":
				return Boolean(design.hero.placement.source);
		}
	};
	const toggle = (kind: ElementKind) => {
		update((d) => {
			switch (kind) {
				case "title":
					return { ...d, title: { ...d.title, show: d.title.show === false } };
				case "subtitle":
					return { ...d, subtitle: { ...d.subtitle, show: d.subtitle.show === false } };
				case "badge":
					return { ...d, badge: { ...d.badge, show: !d.badge.show } };
				case "logo":
					return { ...d, logo: { ...d.logo, source: d.logo.source ? null : d.logo.source } };
				case "hero":
					return d;
			}
		});
	};
	return (
		<div className="flex flex-col gap-1.5">
			{(Object.keys(ELEMENT_LABELS) as ElementKind[]).map((kind) => {
				const canToggleEye = kind === "title" || kind === "subtitle" || kind === "badge";
				return (
					<div
						key={kind}
						className={cn(
							"flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors",
							selected === kind
								? "border-emerald-500/50 bg-emerald-500/10"
								: "border-input hover:border-foreground/25",
						)}
					>
						<button
							type="button"
							onClick={() => onSelect(kind)}
							aria-pressed={selected === kind}
							className="flex-1 cursor-pointer px-1 py-1 text-left text-sm font-medium [-webkit-tap-highlight-color:transparent]"
						>
							{ELEMENT_LABELS[kind]}
						</button>
						{canToggleEye ? (
							<button
								type="button"
								onClick={() => toggle(kind)}
								className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors duration-150 [-webkit-tap-highlight-color:transparent] hover:bg-muted hover:text-foreground"
								aria-label={
									visible(kind) ? `Hide ${ELEMENT_LABELS[kind]}` : `Show ${ELEMENT_LABELS[kind]}`
								}
								title={visible(kind) ? "Hide" : "Show"}
							>
								{visible(kind) ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
							</button>
						) : (
							<span
								className={cn("size-2 rounded-full", visible(kind) ? "bg-emerald-400" : "bg-muted")}
								title={visible(kind) ? "On the canvas" : "Empty"}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function BadgeControls({
	design,
	update,
}: {
	design: OgDesign;
	update: DesignChange["update"];
}) {
	const badge = design.badge;
	return (
		<div className="flex flex-col gap-4">
			<Section title="Badge">
				<div className="flex items-center justify-between rounded-lg border border-input px-3 py-2.5">
					<span className="text-sm">Show badge</span>
					<Switch
						checked={badge.show}
						onCheckedChange={(show) => update((d) => ({ ...d, badge: { ...d.badge, show } }))}
						aria-label="Show badge"
					/>
				</div>
				<Field label="Text">
					<Input
						value={badge.text}
						onChange={(e) => update((d) => ({ ...d, badge: { ...d.badge, text: e.target.value } }))}
						placeholder="NEW"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<ColorField
						label="Background"
						value={badge.bg}
						onChange={(bg) => update((d) => ({ ...d, badge: { ...d.badge, bg } }))}
					/>
					<ColorField
						label="Text color"
						value={badge.color}
						onChange={(color) => update((d) => ({ ...d, badge: { ...d.badge, color } }))}
					/>
				</div>
				<Field label="Shape">
					<Segmented
						label="Badge shape"
						value={badge.shape}
						onChange={(shape: BadgeShape) =>
							update((d) => ({ ...d, badge: { ...d.badge, shape } }))
						}
						options={[
							{ value: "pill", label: "Pill" },
							{ value: "square", label: "Square" },
							{ value: "underline", label: "Underline" },
						]}
					/>
				</Field>
				<Slider
					label="Size"
					value={badge.size}
					min={16}
					max={80}
					step={1}
					valueLabel={`${Math.round(badge.size)}px`}
					onChange={(e) =>
						update((d) => ({ ...d, badge: { ...d.badge, size: Number(e.target.value) } }))
					}
				/>
			</Section>
			<Section title="Position">
				<div className="grid grid-cols-2 gap-3">
					<Slider
						label="X"
						value={badge.x}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(badge.x * 100)}%`}
						onChange={(e) =>
							update((d) => ({ ...d, badge: { ...d.badge, x: Number(e.target.value) } }))
						}
					/>
					<Slider
						label="Y"
						value={badge.y}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(badge.y * 100)}%`}
						onChange={(e) =>
							update((d) => ({ ...d, badge: { ...d.badge, y: Number(e.target.value) } }))
						}
					/>
				</div>
			</Section>
		</div>
	);
}

export function LogoControls({
	design,
	commit,
	update,
}: {
	design: OgDesign;
	commit: DesignChange["commit"];
	update: DesignChange["update"];
}) {
	const [error, setError] = useInlineError();
	return (
		<div className="flex flex-col gap-4">
			<Section title="Logo">
				<FileDrop
					accept="image/png,image/jpeg,image/webp,image/svg+xml,.heic,.heif,.svg"
					onFiles={async ([file]) => {
						if (!file) return;
						try {
							const art = await normalizeRasterArtwork(file);
							commit({ ...design, logo: { ...design.logo, source: art } });
						} catch (e) {
							setError(e instanceof Error ? e.message : "Image failed");
						}
					}}
					title="Drop a logo"
					hint="PNG, JPG, WebP, HEIC or SVG — stays on your device"
					compact={Boolean(design.logo.source)}
				/>
				{error ? <Notice tone="caution">{error}</Notice> : null}
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
			</Section>
			<Section title="Layout">
				<Slider
					label="Size"
					value={design.logo.height}
					min={0.05}
					max={0.4}
					step={0.01}
					valueLabel={`${Math.round(design.logo.height * 100)}%`}
					onChange={(e) =>
						update((d) => ({ ...d, logo: { ...d.logo, height: Number(e.target.value) } }))
					}
				/>
				<div className="grid grid-cols-2 gap-3">
					<Slider
						label="X"
						value={design.logo.x}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(design.logo.x * 100)}%`}
						onChange={(e) =>
							update((d) => ({ ...d, logo: { ...d.logo, x: Number(e.target.value) } }))
						}
					/>
					<Slider
						label="Y"
						value={design.logo.y}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(design.logo.y * 100)}%`}
						onChange={(e) =>
							update((d) => ({ ...d, logo: { ...d.logo, y: Number(e.target.value) } }))
						}
					/>
				</div>
			</Section>
		</div>
	);
}

export function HeroControls({
	design,
	commit,
	update,
}: {
	design: OgDesign;
	commit: DesignChange["commit"];
	update: DesignChange["update"];
}) {
	const [error, setError] = useInlineError();
	const hero = design.hero;
	const crop = hero.placement.crop;
	const showTemplateSliders = ["split-image", "product-card", "event"].includes(design.template);
	return (
		<div className="flex flex-col gap-4">
			<Section title="Hero image">
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
							setError(e instanceof Error ? e.message : "Image failed");
						}
					}}
					title="Drop a hero image"
					hint="PNG, JPG, WebP or HEIC — processed on your device"
					compact={Boolean(hero.placement.source)}
				/>
				{error ? <Notice tone="caution">{error}</Notice> : null}
				{hero.placement.source ? (
					<div className="flex items-center justify-between">
						<span className="label-mono text-subtle">
							{hero.placement.source.name ?? "Image"} · {Math.round(hero.placement.source.width)}×
							{Math.round(hero.placement.source.height)}px
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								commit({
									...design,
									hero: { ...hero, placement: { ...hero.placement, source: null } },
								})
							}
						>
							<Trash2 /> Remove
						</Button>
					</div>
				) : null}
				<Slider
					label="Image opacity"
					value={hero.opacity}
					min={0.1}
					max={1}
					step={0.05}
					valueLabel={`${Math.round(hero.opacity * 100)}%`}
					onChange={(e) =>
						update((d) => ({ ...d, hero: { ...d.hero, opacity: Number(e.target.value) } }))
					}
				/>
				<Slider
					label="Dark overlay"
					value={design.overlay}
					min={0}
					max={0.9}
					step={0.05}
					valueLabel={`${Math.round(design.overlay * 100)}%`}
					onChange={(e) => update((d) => ({ ...d, overlay: Number(e.target.value) }))}
				/>
				<Field label="Fit">
					<Segmented
						label="Image fit"
						value={hero.placement.fit}
						onChange={(fit) =>
							update((d) => ({
								...d,
								hero: { ...d.hero, placement: { ...d.hero.placement, fit } },
							}))
						}
						options={[
							{ value: "cover", label: "Fill" },
							{ value: "contain", label: "Fit" },
							{ value: "fill", label: "Stretch" },
						]}
					/>
				</Field>
				{showTemplateSliders ? (
					<Slider
						label={design.template === "event" ? "Image height" : "Image position"}
						value={design.template === "event" ? hero.width : hero.x}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round((design.template === "event" ? hero.width : hero.x) * 100)}%`}
						onChange={(e) =>
							update((d) =>
								d.template === "event"
									? { ...d, hero: { ...d.hero, width: Number(e.target.value) } }
									: { ...d, hero: { ...d.hero, x: Number(e.target.value) } },
							)
						}
					/>
				) : null}
				{showTemplateSliders && design.template !== "event" ? (
					<Slider
						label="Image width"
						value={hero.width}
						min={0.1}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(hero.width * 100)}%`}
						onChange={(e) =>
							update((d) => ({ ...d, hero: { ...d.hero, width: Number(e.target.value) } }))
						}
					/>
				) : null}
			</Section>
			<Section title="Zoom & crop">
				<Slider
					label="Zoom"
					value={hero.placement.scale}
					min={0.5}
					max={2.5}
					step={0.05}
					valueLabel={`${hero.placement.scale.toFixed(2)}×`}
					onChange={(e) =>
						update((d) => ({
							...d,
							hero: {
								...d.hero,
								placement: { ...d.hero.placement, scale: Number(e.target.value) },
							},
						}))
					}
				/>
				<div className="grid grid-cols-2 gap-3">
					{(
						[
							["Crop left", "x", 0, 0.8],
							["Crop top", "y", 0, 0.8],
							["Crop width", "w", 0.2, 1],
							["Crop height", "h", 0.2, 1],
						] as const
					).map(([label, key, min, max]) => (
						<Slider
							key={key}
							label={label}
							value={crop[key]}
							min={min}
							max={max}
							step={0.01}
							valueLabel={`${Math.round(crop[key] * 100)}%`}
							onChange={(e) =>
								update((d) => {
									const value = Number(e.target.value);
									const next = { ...d.hero.placement.crop, [key]: value } as typeof crop;
									if (key === "x") next.w = Math.min(next.w, 1 - value);
									if (key === "y") next.h = Math.min(next.h, 1 - value);
									return {
										...d,
										hero: { ...d.hero, placement: { ...d.hero.placement, crop: next } },
									};
								})
							}
						/>
					))}
				</div>
			</Section>
		</div>
	);
}

/** Tiny state helper for inline upload errors. */
function useInlineError(): [string | null, (message: string) => void] {
	const [error, setError] = useState<string | null>(null);
	return [error, setError];
}
