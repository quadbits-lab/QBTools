import { ChooseMedia } from "#/components/kit/choose-media";
import { SaveToMedia } from "#/components/kit/save-to-media";
import "@fontsource/anton/400.css";
import "@fontsource/bebas-neue/400.css";
import { downloadBlob } from "@qbtools/engines/files";
import { decodeImage } from "@qbtools/engines/image";
import { Button } from "@qbtools/ui/button";
import { Input, Select, Textarea } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { Download, ImagePlus, Loader2, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";

const W = 1280;
const H = 720;
const MAX_BYTES = 2 * 1024 * 1024;

const FONTS = ["Anton", "Bebas Neue", "Plus Jakarta Sans Variable"] as const;

interface Design {
	bg1: string;
	bg2: string;
	title: string;
	subtitle: string;
	font: (typeof FONTS)[number];
	titleSize: number;
	titleColor: string;
	strokeColor: string;
	strokeWidth: number;
	position: "top" | "center" | "bottom";
	align: "left" | "center";
	overlay: number;
	badge: string;
	badgeColor: string;
}

const TEMPLATES: { name: string; design: Partial<Design> }[] = [
	{
		name: "Bold yellow",
		design: {
			bg1: "#111827",
			bg2: "#1f2937",
			titleColor: "#facc15",
			strokeColor: "#000000",
			strokeWidth: 14,
			font: "Anton",
			position: "bottom",
			align: "left",
			badgeColor: "#ef4444",
		},
	},
	{
		name: "Clean white",
		design: {
			bg1: "#4f46e5",
			bg2: "#7c3aed",
			titleColor: "#ffffff",
			strokeColor: "#1e1b4b",
			strokeWidth: 8,
			font: "Bebas Neue",
			position: "center",
			align: "center",
			badgeColor: "#f59e0b",
		},
	},
	{
		name: "Red alert",
		design: {
			bg1: "#7f1d1d",
			bg2: "#dc2626",
			titleColor: "#ffffff",
			strokeColor: "#000000",
			strokeWidth: 16,
			font: "Anton",
			position: "top",
			align: "left",
			badgeColor: "#facc15",
		},
	},
	{
		name: "Fresh green",
		design: {
			bg1: "#064e3b",
			bg2: "#10b981",
			titleColor: "#ecfccb",
			strokeColor: "#022c22",
			strokeWidth: 10,
			font: "Bebas Neue",
			position: "bottom",
			align: "center",
			badgeColor: "#0ea5e9",
		},
	},
];

const initial: Design = {
	bg1: "#111827",
	bg2: "#1f2937",
	title: "I TRIED THIS FOR 30 DAYS",
	subtitle: "",
	font: "Anton",
	titleSize: 120,
	titleColor: "#facc15",
	strokeColor: "#000000",
	strokeWidth: 14,
	position: "bottom",
	align: "left",
	overlay: 35,
	badge: "NEW",
	badgeColor: "#ef4444",
};

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
	const lines: string[] = [];
	for (const paragraph of text.split("\n")) {
		let line = "";
		for (const word of paragraph.split(" ")) {
			const next = line ? `${line} ${word}` : word;
			if (ctx.measureText(next).width > maxWidth && line) {
				lines.push(line);
				line = word;
			} else line = next;
		}
		lines.push(line);
	}
	return lines;
}

function drawCover(
	ctx: CanvasRenderingContext2D,
	img: CanvasImageSource & { width: number; height: number },
	x: number,
	y: number,
	w: number,
	h: number,
) {
	const scale = Math.max(w / img.width, h / img.height);
	const sw = w / scale;
	const sh = h / scale;
	ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

export default function ThumbnailMaker() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [d, setD] = useState<Design>(initial);
	const [background, setBackground] = useState<ImageBitmap | HTMLCanvasElement | null>(null);
	const [cutout, setCutout] = useState<ImageBitmap | null>(null);
	const [video, setVideo] = useState<File | null>(null);
	const [videoDuration, setVideoDuration] = useState(0);
	const [frameAt, setFrameAt] = useState(1);
	const [format, setFormat] = useState<"jpg" | "png">("jpg");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fontsReady, setFontsReady] = useState(0);
	const set = <K extends keyof Design>(key: K, value: Design[K]) =>
		setD((v) => ({ ...v, [key]: value }));

	useEffect(() => {
		void Promise.all(FONTS.map((f) => document.fonts.load(`80px "${f}"`))).then(() =>
			setFontsReady((n) => n + 1),
		);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady forces a redraw once fonts load
	useEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, W, H);
		if (background) {
			drawCover(ctx, background, 0, 0, W, H);
			ctx.fillStyle = `rgba(0,0,0,${d.overlay / 100})`;
			ctx.fillRect(0, 0, W, H);
		} else {
			const gradient = ctx.createLinearGradient(0, 0, W, H);
			gradient.addColorStop(0, d.bg1);
			gradient.addColorStop(1, d.bg2);
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, W, H);
		}
		if (cutout) {
			const h = H * 0.95;
			const w = (cutout.width / cutout.height) * h;
			ctx.drawImage(cutout, W - w - 20, H - h, w, h);
		}
		const pad = 64;
		const textWidth = (cutout ? W * 0.62 : W) - pad * 2;
		ctx.font = `${d.font.startsWith("Plus") ? "800 " : ""}${d.titleSize}px "${d.font}"`;
		ctx.textBaseline = "top";
		ctx.textAlign = d.align;
		ctx.lineJoin = "round";
		const lines = wrapLines(ctx, d.title, textWidth);
		const lineHeight = d.titleSize * 1.02;
		const subtitleSize = Math.round(d.titleSize * 0.38);
		const block = lines.length * lineHeight + (d.subtitle ? subtitleSize * 1.4 : 0);
		let y =
			d.position === "top" ? pad : d.position === "center" ? (H - block) / 2 : H - pad - block;
		const x = d.align === "left" ? pad : (cutout ? W * 0.62 : W) / 2;
		for (const line of lines) {
			if (d.strokeWidth > 0) {
				ctx.strokeStyle = d.strokeColor;
				ctx.lineWidth = d.strokeWidth;
				ctx.strokeText(line, x, y);
			}
			ctx.fillStyle = d.titleColor;
			ctx.fillText(line, x, y);
			y += lineHeight;
		}
		if (d.subtitle) {
			ctx.font = `700 ${subtitleSize}px "Plus Jakarta Sans Variable"`;
			ctx.lineWidth = Math.max(4, d.strokeWidth / 2);
			ctx.strokeStyle = d.strokeColor;
			ctx.strokeText(d.subtitle, x, y + subtitleSize * 0.2);
			ctx.fillStyle = "#ffffff";
			ctx.fillText(d.subtitle, x, y + subtitleSize * 0.2);
		}
		if (d.badge.trim()) {
			ctx.font = `800 44px "Plus Jakarta Sans Variable"`;
			ctx.textAlign = "left";
			const bw = ctx.measureText(d.badge).width + 48;
			const bx = W - bw - 36;
			ctx.fillStyle = d.badgeColor;
			ctx.beginPath();
			ctx.roundRect(bx, 36, bw, 72, 18);
			ctx.fill();
			ctx.fillStyle = "#ffffff";
			ctx.textBaseline = "middle";
			ctx.fillText(d.badge, bx + 24, 74);
		}
	}, [d, background, cutout, fontsReady]);

	const pickImage = async (file: File | undefined, target: "background" | "cutout") => {
		if (!file) return;
		setError(null);
		try {
			const bitmap = await decodeImage(file);
			if (target === "background") setBackground(bitmap);
			else setCutout(bitmap);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't open this image.");
		}
	};

	const pickVideo = async (file: File | undefined) => {
		if (!file) return;
		setVideo(file);
		const url = URL.createObjectURL(file);
		const el = document.createElement("video");
		el.preload = "metadata";
		el.src = url;
		el.onloadedmetadata = () => {
			setVideoDuration(el.duration);
			URL.revokeObjectURL(url);
		};
		await grab(file, 1);
	};

	const grab = async (file: File, at: number) => {
		setBusy(true);
		try {
			const { grabVideoFrame } = await import("@qbtools/engines/media");
			setBackground(await grabVideoFrame(file, at));
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't read this video.");
		} finally {
			setBusy(false);
		}
	};

	const download = async () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		if (format === "png") {
			canvas.toBlob((blob) => blob && downloadBlob(blob, "thumbnail.png"), "image/png");
			return;
		}
		// YouTube limit is 2MB: step quality down until it fits.
		for (const q of [0.92, 0.85, 0.75, 0.65, 0.5]) {
			const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
			if (blob && (blob.size <= MAX_BYTES || q === 0.5)) {
				downloadBlob(blob, "thumbnail.jpg");
				if (blob.size > MAX_BYTES)
					setError(`Saved, but it's ${formatBytes(blob.size)} — over YouTube's 2MB limit.`);
				return;
			}
		}
	};

	return (
		<div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
			<div className="flex flex-col gap-3">
				<canvas
					ref={canvasRef}
					width={W}
					height={H}
					className="aspect-video w-full border border-border"
					role="img"
					aria-label="Thumbnail preview"
				/>
				<div className="flex flex-wrap gap-2">
					{TEMPLATES.map((t) => (
						<button
							key={t.name}
							type="button"
							onClick={() => setD((v) => ({ ...v, ...t.design }))}
							className="flex min-h-10 cursor-pointer items-center gap-2 border border-border px-3 text-sm font-medium hover:border-primary"
						>
							<span
								className="size-4"
								style={{ background: `linear-gradient(135deg, ${t.design.bg1}, ${t.design.bg2})` }}
							/>
							{t.name}
						</button>
					))}
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Segmented
						label="File type"
						value={format}
						onChange={setFormat}
						options={[
							{ value: "jpg", label: "JPG (under 2MB)" },
							{ value: "png", label: "PNG" },
						]}
					/>
					<Button size="lg" onClick={download}>
						<Download /> Download 1280×720
					</Button>
				</div>
				{error && <Notice tone="caution">{error}</Notice>}
				<SaveToMedia
					name={`thumbnail.${format === "png" ? "png" : "jpg"}`}
					prepare={async () => {
						const canvas = canvasRef.current;
						if (!canvas) return null;
						for (const q of [0.92, 0.85, 0.75, 0.65, 0.5]) {
							const blob = await new Promise<Blob | null>((resolve) =>
								canvas.toBlob(resolve, format === "png" ? "image/png" : "image/jpeg", q),
							);
							if (blob && (format === "png" || blob.size <= MAX_BYTES || q === 0.5)) return blob;
						}
						return null;
					}}
				/>
				<PrivacyNote />
			</div>
			<div className="flex flex-col gap-4">
				<Field label="Title" htmlFor="tm-title">
					<Textarea
						id="tm-title"
						value={d.title}
						onChange={(e) => set("title", e.target.value)}
						className="min-h-20 text-lg"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Subtitle" htmlFor="tm-sub">
						<Input
							id="tm-sub"
							value={d.subtitle}
							onChange={(e) => set("subtitle", e.target.value)}
						/>
					</Field>
					<Field label="Badge" htmlFor="tm-badge">
						<Input
							id="tm-badge"
							value={d.badge}
							maxLength={12}
							onChange={(e) => set("badge", e.target.value)}
						/>
					</Field>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Font" htmlFor="tm-font">
						<Select
							id="tm-font"
							value={d.font}
							onChange={(e) => set("font", e.target.value as Design["font"])}
						>
							{FONTS.map((f) => (
								<option key={f} value={f}>
									{f.replace(" Variable", "")}
								</option>
							))}
						</Select>
					</Field>
					<Field label="Position" htmlFor="tm-pos">
						<Select
							id="tm-pos"
							value={d.position}
							onChange={(e) => set("position", e.target.value as Design["position"])}
						>
							<option value="top">Top</option>
							<option value="center">Middle</option>
							<option value="bottom">Bottom</option>
						</Select>
					</Field>
				</div>
				<Slider
					id="tm-size"
					label="Text size"
					valueLabel={`${d.titleSize}px`}
					min={60}
					max={200}
					value={d.titleSize}
					onChange={(e) => set("titleSize", Number(e.target.value))}
				/>
				<Slider
					id="tm-stroke"
					label="Outline"
					valueLabel={`${d.strokeWidth}px`}
					min={0}
					max={30}
					value={d.strokeWidth}
					onChange={(e) => set("strokeWidth", Number(e.target.value))}
				/>
				<div className="grid grid-cols-4 gap-2">
					{(
						[
							["titleColor", "Text"],
							["strokeColor", "Outline"],
							["badgeColor", "Badge"],
							["bg1", "Background"],
						] as const
					).map(([key, label]) => (
						<Field key={key} label={label} htmlFor={`tm-${key}`}>
							<Input
								id={`tm-${key}`}
								type="color"
								value={d[key]}
								onChange={(e) =>
									setD((v) => ({
										...v,
										[key]: e.target.value,
										...(key === "bg1" ? { bg2: e.target.value } : {}),
									}))
								}
								className="cursor-pointer p-1"
							/>
						</Field>
					))}
				</div>
				<div className="flex flex-col gap-2 border border-border p-4">
					<p className="font-medium">Background picture</p>
					<div className="flex flex-wrap gap-2">
						<label
							className={cn(
								"inline-flex h-10 cursor-pointer items-center gap-2 border border-input px-3 text-sm font-medium hover:bg-muted",
							)}
						>
							<ImagePlus className="size-4" /> Photo
							<input
								type="file"
								accept="image/*,.heic"
								className="sr-only"
								onChange={(e) => pickImage(e.target.files?.[0], "background")}
							/>
						</label>
						<label className="inline-flex h-10 cursor-pointer items-center gap-2 border border-input px-3 text-sm font-medium hover:bg-muted">
							<Video className="size-4" /> From video
							<input
								type="file"
								accept="video/*"
								className="sr-only"
								onChange={(e) => pickVideo(e.target.files?.[0])}
							/>
						</label>
						<ChooseMedia
							accept="image/*,video/*"
							onFiles={([file]) =>
								file?.type.startsWith("video/") ? pickVideo(file) : pickImage(file, "background")
							}
						/>
						{background && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setBackground(null);
									setVideo(null);
								}}
							>
								<X className="size-4" /> Remove
							</Button>
						)}
					</div>
					{video && videoDuration > 0 && (
						<Field label={`Frame at ${frameAt.toFixed(1)}s`} htmlFor="tm-frame">
							<div className="flex items-center gap-2">
								<input
									id="tm-frame"
									type="range"
									min={0}
									max={videoDuration}
									step={0.1}
									value={frameAt}
									onChange={(e) => setFrameAt(Number(e.target.value))}
									onPointerUp={() => grab(video, frameAt)}
									onKeyUp={() => grab(video, frameAt)}
									className="h-8 w-full cursor-pointer"
								/>
								{busy && <Loader2 className="size-4 animate-spin" />}
							</div>
						</Field>
					)}
					{background && (
						<Slider
							id="tm-overlay"
							label="Darken photo"
							valueLabel={`${d.overlay}%`}
							min={0}
							max={80}
							value={d.overlay}
							onChange={(e) => set("overlay", Number(e.target.value))}
						/>
					)}
				</div>
				<div className="flex flex-col gap-2 border border-border p-4">
					<p className="font-medium">Cut-out (e.g. your face, transparent PNG)</p>
					<p className="text-sm text-muted-foreground">
						Tip: make one with our Background Remover.
					</p>
					<div className="flex gap-2">
						<label className="inline-flex h-10 cursor-pointer items-center gap-2 border border-input px-3 text-sm font-medium hover:bg-muted">
							<ImagePlus className="size-4" /> Add cut-out
							<input
								type="file"
								accept="image/png,image/webp"
								className="sr-only"
								onChange={(e) => pickImage(e.target.files?.[0], "cutout")}
							/>
						</label>
						<ChooseMedia
							accept="image/png,image/webp"
							onFiles={([file]) => pickImage(file, "cutout")}
						/>
						{cutout && (
							<Button variant="ghost" size="sm" onClick={() => setCutout(null)}>
								<X className="size-4" /> Remove
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
