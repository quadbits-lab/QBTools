/**
 * Shared icon artwork editor for the Favicon Generator and App Icon Generator.
 * Sources: uploads, initials (rendered as real glyph outlines) and a
 * searchable icon collection bundled from lucide-static.
 */

import type { ArtworkData, BackgroundSpec, IconDesign, TextFont } from "@qbtools/engines/graphic";
import { textToPathSvg } from "@qbtools/engines/graphic";
import {
	iconArtworkFromSource,
	normalizeRasterArtwork,
	normalizeSvgArtwork,
} from "@qbtools/engines/graphic-design";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
import { Slider } from "@qbtools/ui/slider";
import { cn } from "@qbtools/ui/utils";
import { Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { graphicAssets } from "#/lib/graphic-assets";

const FONT_FAMILIES = ["Inter", "Anton", "DM Mono"] as const;

const iconAssets = import.meta.glob("/node_modules/lucide-static/icons/*.svg", {
	query: "?url",
	import: "default",
});
const ICON_NAMES = Object.keys(iconAssets).map(
	(path) =>
		path
			.split("/")
			.pop()
			?.replace(/\.svg$/, "") ?? "",
);

function range(name: string) {
	return (
		min: number,
		max: number,
		step: number,
		value: number,
		onValue: (n: number) => void,
		label: string,
	) => (
		<Slider
			key={name}
			label={label}
			value={value}
			min={min}
			max={max}
			step={step}
			onChange={(e) => onValue(Number(e.target.value))}
		/>
	);
}

function ErrorNotice({ message }: { message: string | null }) {
	if (!message) return null;
	return (
		<Notice tone="caution" className="mt-1">
			{message}
		</Notice>
	);
}

type SourceTab = "upload" | "initials" | "icon";

export function ArtworkEditor({
	design,
	onChange,
}: {
	design: IconDesign;
	onChange: (design: IconDesign) => void;
}) {
	const [tab, setTab] = useState<SourceTab>("upload");
	const [error, setError] = useState<string | null>(null);
	const [initials, setInitials] = useState("");
	const [initialsFont, setInitialsFont] = useState<TextFont>("Inter");
	const [query, setQuery] = useState("");
	const setArtwork = (patch: Partial<IconDesign["artwork"]>) =>
		onChange({ ...design, artwork: { ...design.artwork, ...patch } });

	const applySource = (source: ArtworkData) =>
		setArtwork({
			source,
			fit:
				source.kind === "raster" && source.width !== source.height ? design.artwork.fit : "contain",
			crop: { x: 0, y: 0, w: 1, h: 1 },
			padding: design.artwork.padding,
			scale: 1,
			offsetX: 0,
			offsetY: 0,
		});

	const handleFiles = async (files: File[]) => {
		const file = files[0];
		if (!file) return;
		setError(null);
		try {
			if (/\.svg$/i.test(file.name) || file.type === "image/svg+xml") {
				if (file.size > 2 * 1024 * 1024) {
					setError("SVG files are limited to 2 MB.");
					return;
				}
				const art = normalizeSvgArtwork(await file.text(), file.name);
				applySource(art);
			} else {
				applySource(await normalizeRasterArtwork(file));
			}
			setTab("upload");
		} catch (e) {
			setError(e instanceof Error ? e.message : "This image could not be used.");
		}
	};

	const buildInitials = async (value: string) => {
		setError(null);
		if (!value.trim()) {
			onChange({ ...design, artwork: { ...design.artwork, source: null } });
			return;
		}
		try {
			const result = await textToPathSvg(
				value.trim().toUpperCase().slice(0, 3),
				{
					family: initialsFont,
					weight: initialsFont === "DM Mono" ? 500 : 700,
					size: 220,
					color: design.foreground,
					letterSpacing: 4,
				},
				await graphicAssets(),
			);
			setArtwork({
				source: {
					kind: "svg",
					src: result.svg,
					width: result.width,
					height: result.height,
					color: design.foreground,
					text: value.trim().toUpperCase().slice(0, 3),
					fontFamily: initialsFont,
					fontWeight: 700,
					name: `initials-${value.trim().toUpperCase().slice(0, 3)}`,
				},
				fit: "contain",
				crop: { x: 0, y: 0, w: 1, h: 1 },
				scale: 1,
				offsetX: 0,
				offsetY: 0,
			});
		} catch {
			setError("Initials could not be rendered on this device.");
		}
	};

	const pickIcon = async (name: string) => {
		setError(null);
		try {
			const url = iconAssets[`/node_modules/lucide-static/icons/${name}.svg`] as string | undefined;
			if (!url) throw new Error("Icon unavailable.");
			const source = await (await fetch(url)).text();
			const art = iconArtworkFromSource(source, { w: 24, h: 24 }, design.foreground, name);
			setTab("icon");
			setArtwork({
				source: art,
				fit: "contain",
				crop: { x: 0, y: 0, w: 1, h: 1 },
				scale: 1,
				offsetX: 0,
				offsetY: 0,
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "This icon could not be loaded.");
		}
	};

	const filteredIcons = useMemo(() => {
		const q = query.trim().toLowerCase();
		return ICON_NAMES.filter((name) => name.includes(q)).slice(0, 48);
	}, [query]);

	const recolor = (color: string) => {
		const art = design.artwork.source;
		onChange({ ...design, foreground: color });
		if (!art) return;
		if ((art.kind === "icon" || art.kind === "svg") && art.color) {
			onChange({
				...design,
				foreground: color,
				artwork: {
					...design.artwork,
					source: { ...art, src: art.src.split(art.color).join(color), color },
				},
			});
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<Segmented
				label="Artwork source"
				value={tab}
				onChange={(next) => setTab(next)}
				options={[
					{ value: "upload", label: "Image" },
					{ value: "initials", label: "Initials" },
					{ value: "icon", label: "Icons" },
				]}
			/>
			{tab === "upload" && (
				<div className="flex flex-col gap-2">
					<FileDrop
						accept="image/png,image/jpeg,image/webp,image/svg+xml,.heic,.heif,.svg"
						onFiles={(files) => void handleFiles(files)}
						title="Drop a logo or image"
						hint="PNG, JPG, WebP, HEIC or SVG · processed on your device"
						compact={Boolean(design.artwork.source)}
					/>
					{design.artwork.source ? (
						<p className="label-mono text-subtle">
							{design.artwork.source.name ?? "Artwork"} · {Math.round(design.artwork.source.width)}×
							{Math.round(design.artwork.source.height)}px
						</p>
					) : null}
				</div>
			)}
			{tab === "initials" && (
				<div className="grid gap-3 sm:grid-cols-[1fr_180px]">
					<Field label="Initials or letters">
						<Input
							value={initials}
							onChange={(e) => {
								setInitials(e.target.value);
								void buildInitials(e.target.value);
							}}
							placeholder="QB"
							maxLength={3}
						/>
					</Field>
					<Field label="Font">
						<Select
							value={initialsFont}
							onValueChange={(val) => {
								const font = val as TextFont;
								setInitialsFont(font);
								if (initials) void buildInitials(initials);
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{FONT_FAMILIES.map((font) => (
									<SelectItem key={font} value={font}>
										{font}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				</div>
			)}
			{tab === "icon" && (
				<div className="flex flex-col gap-3">
					<div className="relative">
						<Search className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-subtle" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search 2,100+ icons: zap, heart, rocket…"
							className="pl-9"
						/>
					</div>
					<div className="grid max-h-56 grid-cols-4 gap-1 overflow-y-auto rounded-md border border-input p-1 sm:grid-cols-8">
						{filteredIcons.map((name) => (
							<button
								key={name}
								type="button"
								onClick={() => void pickIcon(name)}
								title={name}
								className={cn(
									"rounded-sm p-1.5 text-foreground hover:bg-accent",
									design.artwork.source?.name === name && "bg-accent",
								)}
							>
								<IconGridItem name={name} />
							</button>
						))}
						{!filteredIcons.length && (
							<p className="col-span-full py-6 text-center text-sm text-subtle">
								No icons match “{query}”.
							</p>
						)}
					</div>
				</div>
			)}
			<ErrorNotice message={error} />

			<div className="grid gap-3 sm:grid-cols-2">
				<Field label="Artwork fit">
					<Segmented
						label="Artwork fit"
						value={design.artwork.fit}
						onChange={(fit) => setArtwork({ fit })}
						options={[
							{ value: "contain", label: "Fit" },
							{ value: "cover", label: "Fill" },
							{ value: "fill", label: "Stretch" },
						]}
					/>
				</Field>
				<Field label="Foreground — icons & initials">
					<input
						type="color"
						value={design.foreground}
						onChange={(e) => recolor(e.target.value)}
						className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
						aria-label="Foreground color"
					/>
				</Field>
			</div>

			{range("padding")(
				0,
				0.4,
				0.01,
				design.artwork.padding,
				(padding) => setArtwork({ padding }),
				"Padding",
			)}
			<div className="grid gap-3">
				{range("scale")(
					0.2,
					2,
					0.01,
					design.artwork.scale,
					(scale) => setArtwork({ scale }),
					"Artwork scale",
				)}
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{range("ox")(
					-0.4,
					0.4,
					0.01,
					design.artwork.offsetX,
					(offsetX) => setArtwork({ offsetX }),
					"Offset X",
				)}
				{range("oy")(
					-0.4,
					0.4,
					0.01,
					design.artwork.offsetY,
					(offsetY) => setArtwork({ offsetY }),
					"Offset Y",
				)}
			</div>

			<BackgroundPicker
				background={design.background}
				onChange={(background) => onChange({ ...design, background })}
			/>

			{design.artwork.source && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onChange({ ...design, artwork: { ...design.artwork, source: null } })}
					className="self-start"
				>
					<Trash2 /> Remove artwork
				</Button>
			)}
		</div>
	);
}

/** Lucide glyph for the picker grid (inline via same-origin asset URL fetch). */
function IconGridItem({ name }: { name: string }) {
	const [markup, setMarkup] = useState("");
	useEffect(() => {
		let cancelled = false;
		const url = iconAssets[`/node_modules/lucide-static/icons/${name}.svg`] as string | undefined;
		if (!url) return;
		void fetch(url).then(async (res) => {
			const source = await res.text();
			if (!cancelled) {
				setMarkup(
					source
						.replace(/<!--[\s\S]*?-->/g, "")
						.replace(/^[\s\S]*?<svg[^>]*>/, "")
						.replace(/<\/svg>\s*$/, ""),
				);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [name]);
	return (
		<svg viewBox="0 0 24 24" className="mx-auto size-6" aria-hidden="true">
			<g dangerouslySetInnerHTML={{ __html: markup }} />
		</svg>
	);
}

export function BackgroundPicker({
	background,
	onChange,
}: {
	background: BackgroundSpec;
	onChange: (background: BackgroundSpec) => void;
}) {
	const type = background.type;
	const gradientColor = (which: "from" | "to") =>
		type === "gradient" ? background[which] : "#9333ea";
	return (
		<div className="flex flex-col gap-3">
			<Segmented
				label="Background"
				value={type === "none" ? "none" : type}
				onChange={(next) => {
					if (next === "none") {
						onChange({ type: "none" });
					} else if (next === "color") {
						onChange({
							type: "color",
							color: type === "color" ? background.color : gradientColor("from"),
						});
					} else {
						onChange({
							type: "gradient",
							from: gradientColor("from"),
							to: gradientColor("to"),
							angle: type === "gradient" ? background.angle : 135,
						});
					}
				}}
				options={[
					{ value: "color", label: "Color" },
					{ value: "gradient", label: "Gradient" },
					{ value: "none", label: "None" },
				]}
			/>
			{type === "color" && (
				<Field label="Background color">
					<input
						type="color"
						value={background.color}
						onChange={(e) => onChange({ type: "color", color: e.target.value })}
						className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
						aria-label="Background color"
					/>
				</Field>
			)}
			{type === "gradient" && (
				<div className="grid gap-3 sm:grid-cols-3">
					<Field label="Gradient from">
						<input
							type="color"
							value={background.from}
							onChange={(e) => onChange({ ...background, from: e.target.value })}
							className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
							aria-label="Gradient from"
						/>
					</Field>
					<Field label="Gradient to">
						<input
							type="color"
							value={background.to}
							onChange={(e) => onChange({ ...background, to: e.target.value })}
							className="h-11 w-full cursor-pointer rounded-md border border-input bg-transparent px-1"
							aria-label="Gradient to"
						/>
					</Field>
					<Slider
						label="Gradient angle"
						value={background.angle}
						min={0}
						max={360}
						step={5}
						onChange={(e) => onChange({ ...background, angle: Number(e.target.value) })}
					/>
				</div>
			)}
		</div>
	);
}

/** Crop sliders for raster artwork sources (normalized 0..1). */
export function CropControls({
	design,
	onChange,
}: {
	design: IconDesign;
	onChange: (design: IconDesign) => void;
}) {
	const crop = design.artwork.crop;
	const set = (patch: Partial<typeof crop>) =>
		onChange({ ...design, artwork: { ...design.artwork, crop: { ...crop, ...patch } } });
	const cropped = crop.x > 0 || crop.y > 0 || crop.w < 1 || crop.h < 1;
	return (
		<div className="flex flex-col gap-3">
			<div className="grid gap-3 sm:grid-cols-2">
				<Slider
					label="Crop left"
					value={crop.x}
					min={0}
					max={0.8}
					step={0.01}
					valueLabel={`${Math.round(crop.x * 100)}%`}
					onChange={(e) =>
						set({ x: Number(e.target.value), w: Math.min(crop.w, 1 - Number(e.target.value)) })
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
						set({ y: Number(e.target.value), h: Math.min(crop.h, 1 - Number(e.target.value)) })
					}
				/>
				<Slider
					label="Crop width"
					value={crop.w}
					min={0.2}
					max={1}
					step={0.01}
					valueLabel={`${Math.round(crop.w * 100)}%`}
					onChange={(e) => set({ w: Number(e.target.value) })}
				/>
				<Slider
					label="Crop height"
					value={crop.h}
					min={0.2}
					max={1}
					step={0.01}
					valueLabel={`${Math.round(crop.h * 100)}%`}
					onChange={(e) => set({ h: Number(e.target.value) })}
				/>
			</div>
			{cropped && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => set({ x: 0, y: 0, w: 1, h: 1 })}
					className="self-start"
				>
					Reset crop
				</Button>
			)}
		</div>
	);
}
