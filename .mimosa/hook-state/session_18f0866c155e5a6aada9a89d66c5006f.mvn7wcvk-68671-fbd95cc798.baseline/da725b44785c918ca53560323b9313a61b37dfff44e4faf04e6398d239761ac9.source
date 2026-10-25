import { downloadBlob, replaceExtension } from "@qbtools/engines/files";
import {
	compositeOn,
	decodeImage,
	drawToCanvas,
	encodeCanvas,
	scaleToFit,
} from "@qbtools/engines/image";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Progress } from "@qbtools/ui/progress";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { SaveToMedia } from "#/components/kit/save-to-media";
import { useObjectUrl } from "#/components/kit/use-object-url";
import type { WorkerRequest, WorkerResponse } from "./worker";

const BACKGROUNDS = [
	null,
	"#ffffff",
	"#000000",
	"#e0e7ff",
	"#fde68a",
	"#bbf7d0",
	"#fecaca",
] as const;
const MAX_SIDE = 2048;

export default function RemoveBackground() {
	const workerRef = useRef<Worker | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [original, setOriginal] = useState<string | null>(null);
	const [cutout, setCutout] = useState<HTMLCanvasElement | null>(null);
	const [background, setBackground] = useState<string | null>(null);
	const [custom, setCustom] = useState("#4f46e5");
	const [status, setStatus] = useState<"idle" | "loading" | "working" | "done">("idle");
	const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<Blob | null>(null);
	const preview = useObjectUrl(result);

	useEffect(() => {
		const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
		worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
			const msg = event.data;
			if (msg.type === "progress") setProgress({ loaded: msg.loaded, total: msg.total });
			else if (msg.type === "status") setStatus(msg.status === "ready" ? "working" : msg.status);
			else if (msg.type === "error") {
				setError(msg.message);
				setStatus("idle");
			} else if (msg.type === "result") {
				const canvas = document.createElement("canvas");
				canvas.width = msg.width;
				canvas.height = msg.height;
				canvas
					.getContext("2d")
					?.putImageData(
						new ImageData(new Uint8ClampedArray(msg.data), msg.width, msg.height),
						0,
						0,
					);
				setCutout(canvas);
				setStatus("done");
			}
		};
		workerRef.current = worker;
		return () => worker.terminate();
	}, []);

	useEffect(() => {
		if (!cutout) return;
		void encodeCanvas(compositeOn(cutout, background), background ? "jpeg" : "png", 0.92).then(
			setResult,
		);
	}, [cutout, background]);

	useEffect(
		() => () => {
			if (original) URL.revokeObjectURL(original);
		},
		[original],
	);

	const start = async (files: File[]) => {
		const f = files[0];
		if (!f) return;
		setError(null);
		setCutout(null);
		setResult(null);
		try {
			// Downscale huge photos first: faster and avoids running out of memory.
			const bitmap = await decodeImage(f);
			const size = scaleToFit(bitmap.width, bitmap.height, MAX_SIDE, MAX_SIDE);
			const canvas = await drawToCanvas(bitmap, { width: size.width, height: size.height });
			bitmap.close();
			const blob = await encodeCanvas(canvas, "png");
			setFile(f);
			setOriginal(URL.createObjectURL(blob));
			setStatus("loading");
			workerRef.current?.postMessage({
				type: "run",
				id: Date.now(),
				image: blob,
			} satisfies WorkerRequest);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't open this image.");
		}
	};

	if (!file) {
		return (
			<div className="flex flex-col gap-4">
				<FileDrop
					accept="image/*,.heic,.heif"
					onFiles={start}
					hint="Photos of people, products, pets or objects work best"
				/>
				{error && <Notice tone="critical">{error}</Notice>}
				<PrivacyNote text="The AI runs on your device — your photo uploads only if you choose Save to Media." />
			</div>
		);
	}

	const busy = status === "loading" || status === "working";
	return (
		<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
			<div
				className={cn(
					"relative grid min-h-80 place-items-center overflow-hidden border border-border",
					!background && "checker-bg",
				)}
				style={background ? { backgroundColor: background } : undefined}
			>
				{preview ? (
					<img
						src={preview}
						alt="Result with background removed"
						className="max-h-[32rem] max-w-full object-contain"
					/>
				) : original ? (
					<img
						src={original}
						alt="Original"
						className={cn("max-h-[32rem] max-w-full object-contain", busy && "opacity-50")}
					/>
				) : null}
				{busy && (
					<div className="absolute inset-x-6 bottom-6 bg-surface/95 p-4">
						{status === "loading" && progress && progress.total > 0 ? (
							<Progress
								value={(progress.loaded / progress.total) * 100}
								label={`Downloading the AI model (one time) · ${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}`}
							/>
						) : (
							<p className="flex items-center gap-2 font-medium">
								<Loader2 className="size-5 animate-spin text-primary" />{" "}
								{status === "loading" ? "Starting the AI…" : "Removing the background…"}
							</p>
						)}
					</div>
				)}
			</div>
			<div className="flex flex-col gap-5">
				<div>
					<p className="mb-2 font-medium">Background</p>
					<div role="radiogroup" aria-label="Background" className="flex flex-wrap gap-2">
						{BACKGROUNDS.map((bg) => (
							<button
								key={bg ?? "none"}
								type="button"
								role="radio"
								aria-checked={background === bg}
								aria-label={bg ?? "Transparent"}
								onClick={() => setBackground(bg)}
								className={cn(
									"size-12 cursor-pointer border-2",
									background === bg ? "border-primary" : "border-border",
									!bg && "checker-bg",
								)}
								style={bg ? { backgroundColor: bg } : undefined}
							/>
						))}
						<label className="flex items-center gap-2">
							<Input
								type="color"
								aria-label="Custom background color"
								value={custom}
								onChange={(e) => {
									setCustom(e.target.value);
									setBackground(e.target.value);
								}}
								className="size-12 cursor-pointer p-1"
							/>
						</label>
					</div>
				</div>
				{result && (
					<Button
						size="lg"
						onClick={() =>
							downloadBlob(
								result,
								replaceExtension(file.name, background ? "jpg" : "png").replace(
									/(\.\w+)$/,
									"-no-bg$1",
								),
							)
						}
					>
						<Download /> Download {background ? "JPG" : "transparent PNG"} (
						{formatBytes(result.size)})
					</Button>
				)}
				<Button
					size="lg"
					variant="secondary"
					disabled={busy}
					onClick={() => {
						setFile(null);
						setCutout(null);
						setResult(null);
						setStatus("idle");
					}}
				>
					<RotateCcw /> Try another photo
				</Button>
				{error && <Notice tone="critical">{error}</Notice>}
				<SaveToMedia
					blob={result ?? undefined}
					name={replaceExtension(file.name, background ? "jpg" : "png").replace(
						/(\.\w+)$/,
						"-no-bg$1",
					)}
				/>
				<PrivacyNote text="The AI runs on your device — your photo uploads only if you choose Save to Media." />
			</div>
		</div>
	);
}
