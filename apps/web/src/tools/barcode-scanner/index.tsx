import type { BarcodeHit, BarcodeImage, WriteFormat } from "@qbtools/engines/barcode";
import { WRITE_FORMATS } from "@qbtools/engines/barcode";
import { downloadBlob } from "@qbtools/engines/files";
import { Button } from "@qbtools/ui/button";
import { Textarea } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
import { Slider } from "@qbtools/ui/slider";
import { Camera, CameraOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CopyButton } from "#/components/kit/copy-button";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { SaveToMedia } from "#/components/kit/save-to-media";
import { TaskProgress } from "#/components/kit/task-progress";
import { useObjectUrl } from "#/components/kit/use-object-url";
import { useTask } from "#/lib/processing/use-task";

type Mode = "scan" | "create";
/** Camera frames are scaled down to this width before they are analysed. */
const FRAME_WIDTH = 960;
const FRAME_INTERVAL_MS = 300;

function Hits({ hits }: { hits: BarcodeHit[] }) {
	return (
		<ul className="flex flex-col gap-3" aria-live="polite">
			{hits.map((hit) => (
				<li
					key={`${hit.format}:${hit.text}`}
					className="flex flex-col gap-2 border border-input p-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div className="min-w-0">
						<p className="label-mono">{hit.format}</p>
						<p className="break-all">{hit.text}</p>
					</div>
					<CopyButton text={hit.text} label="Copy" />
				</li>
			))}
		</ul>
	);
}

function Scan() {
	const [file, setFile] = useState<File | null>(null);
	const [camera, setCamera] = useState<"off" | "starting" | "on">("off");
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [cameraHits, setCameraHits] = useState<BarcodeHit[]>([]);
	const video = useRef<HTMLVideoElement>(null);
	const stream = useRef<MediaStream | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const task = useTask<BarcodeHit[]>();
	const stop = useCallback(() => {
		if (timer.current) clearTimeout(timer.current);
		timer.current = null;
		for (const track of stream.current?.getTracks() ?? []) track.stop();
		stream.current = null;
		if (video.current) video.current.srcObject = null;
		setCamera("off");
	}, []);
	useEffect(() => stop, [stop]);
	const scanImage = (selected: File) =>
		void task.run(async (options) => {
			const { readBarcodesFromFile } = await import("@qbtools/engines/barcode");
			return readBarcodesFromFile(selected, options);
		});
	const start = async () => {
		setCameraError(null);
		setCameraHits([]);
		task.reset();
		if (!navigator.mediaDevices?.getUserMedia) {
			setCameraError("This browser can't open the camera. Upload a photo instead.");
			return;
		}
		setCamera("starting");
		try {
			const media = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: "environment" } },
				audio: false,
			});
			stream.current = media;
			const element = video.current;
			if (!element) return stop();
			element.srcObject = media;
			await element.play();
			setCamera("on");
			const { readBarcodesFromFrame } = await import("@qbtools/engines/barcode");
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			const tick = async () => {
				if (!stream.current || !ctx) return;
				if (element.readyState >= 2 && element.videoWidth > 0) {
					const width = Math.min(FRAME_WIDTH, element.videoWidth);
					canvas.width = width;
					canvas.height = Math.round((element.videoHeight / element.videoWidth) * width);
					ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
					try {
						const found = await readBarcodesFromFrame(
							ctx.getImageData(0, 0, canvas.width, canvas.height),
						);
						if (found.length > 0 && stream.current) {
							setCameraHits(found);
							stop();
							return;
						}
					} catch {
						/* A single bad frame is skipped. */
					}
				}
				if (stream.current) timer.current = setTimeout(tick, FRAME_INTERVAL_MS);
			};
			timer.current = setTimeout(tick, FRAME_INTERVAL_MS);
		} catch (error) {
			stop();
			const name = (error as { name?: string }).name;
			setCameraError(
				name === "NotAllowedError"
					? "Camera access was blocked. Allow it in your browser settings, or upload a photo instead."
					: name === "NotFoundError"
						? "No camera was found. Upload a photo instead."
						: "The camera couldn't start. Upload a photo instead.",
			);
		}
	};
	const hits = cameraHits.length > 0 ? cameraHits : (task.result ?? []);
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="image/*,.heic,.heif"
				title="Choose a photo or screenshot with a barcode"
				hint="QR, EAN, UPC, Code 128, Data Matrix, PDF417 and more"
				onFiles={(files) => {
					stop();
					setCameraHits([]);
					const selected = files[0] ?? null;
					setFile(selected);
					task.reset();
					if (selected) scanImage(selected);
				}}
			/>
			{file && <p>{file.name}</p>}
			<div className="flex flex-wrap items-center gap-3">
				{camera === "off" ? (
					<Button variant="secondary" onClick={() => void start()}>
						<Camera className="size-4" /> Scan with camera
					</Button>
				) : (
					<Button variant="secondary" onClick={stop}>
						<CameraOff className="size-4" /> Stop camera
					</Button>
				)}
				{camera === "on" && <span aria-live="polite">Point the camera at a barcode.</span>}
			</div>
			<video
				ref={video}
				muted
				playsInline
				className={camera === "off" ? "hidden" : "aspect-video w-full max-w-xl bg-black"}
				aria-label="Camera preview"
			/>
			{cameraError && <Notice tone="caution">{cameraError}</Notice>}
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.status === "cancelled" && <p>Scanning cancelled.</p>}
			{task.result && task.result.length === 0 && cameraHits.length === 0 && (
				<Notice tone="info">
					No barcode found. Try a sharper, closer photo with the whole code in view.
				</Notice>
			)}
			{hits.length > 0 && <Hits hits={hits} />}
			<PrivacyNote text="Photos and camera frames are analysed on your device. Nothing is recorded or uploaded." />
		</div>
	);
}

function Create() {
	const [format, setFormat] = useState<WriteFormat>("QRCode");
	const [text, setText] = useState("");
	const [scale, setScale] = useState(4);
	const [showText, setShowText] = useState(true);
	const task = useTask<BarcodeImage>();
	const url = useObjectUrl(task.result?.png);
	const current = WRITE_FORMATS.find((item) => item.value === format);
	const reset = () => task.reset();
	return (
		<div className="flex flex-col gap-5">
			<Field label="Barcode type" htmlFor="bc-format">
				<Select
					value={format}
					disabled={task.busy}
					onValueChange={(val) => {
						reset();
						setFormat(val as WriteFormat);
					}}
				>
					<SelectTrigger id="bc-format" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{WRITE_FORMATS.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{current && <p className="text-sm text-muted-foreground">{current.hint}</p>}
			</Field>
			<Field label="Text or number to encode" htmlFor="bc-text">
				<Textarea
					id="bc-text"
					rows={3}
					value={text}
					maxLength={2000}
					disabled={task.busy}
					onChange={(e) => {
						reset();
						setText(e.target.value);
					}}
				/>
			</Field>
			<Slider
				id="bc-scale"
				label="Image size"
				valueLabel={`${scale}× per module`}
				min={1}
				max={12}
				value={scale}
				disabled={task.busy}
				onChange={(e) => {
					reset();
					setScale(Number(e.target.value));
				}}
			/>
			<label className="flex gap-2">
				<input
					type="checkbox"
					checked={showText}
					disabled={task.busy}
					onChange={(e) => {
						reset();
						setShowText(e.target.checked);
					}}
				/>
				Show the text under the barcode (where the type supports it)
			</label>
			<Button
				disabled={!text.trim() || task.busy}
				onClick={() =>
					void task.run(async () => {
						const { writeBarcodeImage } = await import("@qbtools/engines/barcode");
						return writeBarcodeImage(text, { format, scale, showText });
					})
				}
			>
				Create barcode
			</Button>
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.result && url && (
				<div className="flex flex-col gap-3" aria-live="polite">
					<div className="grid place-items-center border border-input bg-white p-4">
						<img
							src={url}
							alt={`${current?.label ?? "Barcode"} for ${text.trim()}`}
							className="max-h-72 max-w-full [image-rendering:pixelated]"
						/>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button onClick={() => task.result && downloadBlob(task.result.png, "barcode.png")}>
							Download PNG
						</Button>
						<Button
							variant="secondary"
							onClick={() =>
								task.result &&
								downloadBlob(new Blob([task.result.svg], { type: "image/svg+xml" }), "barcode.svg")
							}
						>
							Download SVG
						</Button>
						<SaveToMedia blob={task.result.png} name="barcode.png" sourceTool="barcode-scanner" />
					</div>
				</div>
			)}
			<PrivacyNote />
		</div>
	);
}

export default function BarcodeScanner() {
	const [mode, setMode] = useState<Mode>("scan");
	return (
		<div className="flex flex-col gap-5">
			<Segmented
				label="Barcode mode"
				value={mode}
				onChange={setMode}
				options={[
					{ value: "scan", label: "Scan" },
					{ value: "create", label: "Create" },
				]}
			/>
			{mode === "scan" ? <Scan /> : <Create />}
		</div>
	);
}
