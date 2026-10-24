import "@fontsource/dancing-script/600.css";
import "@fontsource/great-vibes/400.css";
import "@fontsource/caveat/600.css";
import "@fontsource/sacramento/400.css";
import { downloadBlob } from "@qbtools/engines/files";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { cn } from "@qbtools/ui/utils";
import { Download, Eraser, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PrivacyNote } from "#/components/kit/privacy-note";

const INKS = [
	{ value: "#0f172a", label: "Black" },
	{ value: "#1d4ed8", label: "Blue" },
	{ value: "#0f766e", label: "Green" },
	{ value: "#b91c1c", label: "Red" },
];
const FONTS = [
	{ family: "Dancing Script", weight: 600 },
	{ family: "Great Vibes", weight: 400 },
	{ family: "Sacramento", weight: 400 },
	{ family: "Caveat", weight: 600 },
];
const W = 900;
const H = 300;

type Point = { x: number; y: number; p: number };

/** Crop a canvas to its non-transparent pixels plus padding. */
function trimmedBlob(canvas: HTMLCanvasElement, pad = 16): Promise<Blob | null> {
	const ctx = canvas.getContext("2d");
	if (!ctx) return Promise.resolve(null);
	const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let [minX, minY, maxX, maxY] = [width, height, -1, -1];
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if ((data[(y * width + x) * 4 + 3] ?? 0) > 8) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}
	if (maxX < 0) return Promise.resolve(null);
	const out = document.createElement("canvas");
	out.width = maxX - minX + pad * 2;
	out.height = maxY - minY + pad * 2;
	out
		.getContext("2d")
		?.drawImage(canvas, minX - pad, minY - pad, out.width, out.height, 0, 0, out.width, out.height);
	return new Promise((resolve) => out.toBlob(resolve, "image/png"));
}

export default function SignatureGenerator() {
	const [mode, setMode] = useState<"draw" | "type">("draw");
	const [ink, setInk] = useState(INKS[0]?.value ?? "#000");
	const [width, setWidth] = useState(4);
	const [name, setName] = useState("");
	const [font, setFont] = useState(0);
	const [strokes, setStrokes] = useState<Point[][]>([]);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const current = useRef<Point[] | null>(null);
	const scale = 2; // render at 2× for crisp PNGs

	const redraw = useCallback(
		(list: Point[][]) => {
			const canvas = canvasRef.current;
			const ctx = canvas?.getContext("2d");
			if (!canvas || !ctx) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.strokeStyle = ink;
			ctx.fillStyle = ink;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			if (mode === "type") {
				const f = FONTS[font] ?? FONTS[0];
				if (!f || !name.trim()) return;
				let size = 140 * scale;
				ctx.font = `${f.weight} ${size}px "${f.family}"`;
				while (ctx.measureText(name).width > canvas.width - 80 && size > 20) {
					size -= 4;
					ctx.font = `${f.weight} ${size}px "${f.family}"`;
				}
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(name, canvas.width / 2, canvas.height / 2);
				return;
			}
			for (const stroke of list) {
				if (stroke.length === 1) {
					const p = stroke[0] as Point;
					ctx.beginPath();
					ctx.arc(p.x, p.y, (width * scale) / 2, 0, Math.PI * 2);
					ctx.fill();
					continue;
				}
				// Quadratic smoothing through midpoints, with pressure-ish width.
				for (let i = 1; i < stroke.length; i++) {
					const a = stroke[i - 1] as Point;
					const b = stroke[i] as Point;
					const prev = stroke[i - 2] ?? a;
					ctx.lineWidth = width * scale * (0.6 + 0.8 * b.p);
					ctx.beginPath();
					ctx.moveTo((prev.x + a.x) / 2, (prev.y + a.y) / 2);
					ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
					ctx.stroke();
				}
			}
		},
		[ink, width, mode, name, font],
	);

	useEffect(() => {
		if (mode === "type") {
			const f = FONTS[font];
			if (f) void document.fonts.load(`${f.weight} 40px "${f.family}"`).then(() => redraw(strokes));
		} else {
			redraw(strokes);
		}
	}, [redraw, strokes, mode, font]);

	const toPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
		const rect = event.currentTarget.getBoundingClientRect();
		return {
			x: ((event.clientX - rect.left) / rect.width) * W * scale,
			y: ((event.clientY - rect.top) / rect.height) * H * scale,
			p: event.pressure > 0 && event.pointerType === "pen" ? event.pressure : 0.5,
		};
	};

	const save = async () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const blob = await trimmedBlob(canvas);
		if (blob) downloadBlob(blob, "signature.png");
	};

	const isEmpty = mode === "draw" ? strokes.length === 0 : !name.trim();

	return (
		<div className="flex flex-col gap-5">
			<Segmented
				label="Signature method"
				value={mode}
				onChange={setMode}
				options={[
					{ value: "draw", label: "Draw" },
					{ value: "type", label: "Type" },
				]}
				className="max-w-sm"
			/>
			{mode === "type" && (
				<div className="grid gap-4 md:grid-cols-[1fr_auto]">
					<Field label="Your name" htmlFor="sig-name">
						<Input
							id="sig-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Jane Doe"
							maxLength={40}
						/>
					</Field>
					<div
						role="radiogroup"
						aria-label="Handwriting style"
						className="flex flex-wrap items-end gap-2"
					>
						{FONTS.map((f, i) => (
							<button
								key={f.family}
								type="button"
								role="radio"
								aria-checked={font === i}
								onClick={() => setFont(i)}
								className={cn(
									"h-12 cursor-pointer rounded-xl border px-4 text-2xl",
									font === i
										? "border-primary bg-primary-soft"
										: "border-border hover:border-primary",
								)}
								style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight }}
							>
								{name.trim().split(" ")[0] || "Signature"}
							</button>
						))}
					</div>
				</div>
			)}
			<div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-input">
				<canvas
					ref={canvasRef}
					width={W * scale}
					height={H * scale}
					aria-label={
						mode === "draw"
							? "Signature drawing area. Draw with your mouse, finger or pen."
							: "Signature preview"
					}
					className={cn(
						"checker-bg block aspect-[3/1] w-full",
						mode === "draw" && "cursor-crosshair touch-none",
					)}
					onPointerDown={(event) => {
						if (mode !== "draw") return;
						event.currentTarget.setPointerCapture(event.pointerId);
						current.current = [toPoint(event)];
						setStrokes((s) => [...s, current.current as Point[]]);
					}}
					onPointerMove={(event) => {
						if (!current.current) return;
						current.current.push(toPoint(event));
						setStrokes((s) => [...s.slice(0, -1), [...(current.current as Point[])]]);
					}}
					onPointerUp={() => {
						current.current = null;
					}}
				/>
				{mode === "draw" && strokes.length === 0 && (
					<p className="pointer-events-none absolute inset-0 grid place-items-center text-lg text-slate-400">
						Sign here
					</p>
				)}
				<div className="pointer-events-none absolute right-[8%] bottom-[22%] left-[8%] border-b border-slate-300" />
			</div>
			<div className="flex flex-wrap items-end gap-6">
				<div role="radiogroup" aria-label="Ink color" className="flex gap-2">
					{INKS.map((c) => (
						<button
							key={c.value}
							type="button"
							role="radio"
							aria-checked={ink === c.value}
							aria-label={c.label}
							onClick={() => setInk(c.value)}
							className={cn(
								"size-11 cursor-pointer rounded-full border-4",
								ink === c.value ? "border-primary" : "border-transparent",
							)}
							style={{ backgroundColor: c.value }}
						/>
					))}
				</div>
				{mode === "draw" && (
					<Slider
						id="sig-width"
						label="Pen size"
						valueLabel={`${width}px`}
						min={1}
						max={12}
						value={width}
						onChange={(e) => setWidth(Number(e.target.value))}
						className="w-48"
					/>
				)}
			</div>
			<div className="flex flex-wrap gap-2">
				<Button size="lg" onClick={save} disabled={isEmpty}>
					<Download /> Download PNG
				</Button>
				{mode === "draw" && (
					<>
						<Button
							size="lg"
							variant="secondary"
							onClick={() => setStrokes((s) => s.slice(0, -1))}
							disabled={strokes.length === 0}
						>
							<Undo2 /> Undo
						</Button>
						<Button
							size="lg"
							variant="ghost"
							onClick={() => setStrokes([])}
							disabled={strokes.length === 0}
						>
							<Eraser /> Clear
						</Button>
					</>
				)}
			</div>
			<PrivacyNote text="Your signature is created and saved only on your device. Transparent PNG, ready for documents." />
		</div>
	);
}
