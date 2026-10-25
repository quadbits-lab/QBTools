import { suffixFilename } from "@qbtools/engines/files";
import type { AudioFormat, Resolution, VideoInfo, VideoPreset } from "@qbtools/engines/media";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
import { useEffect, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";
import { TaskProgress } from "#/components/kit/task-progress";
import { useObjectUrl } from "#/components/kit/use-object-url";
import { useMediaSession } from "#/lib/processing/use-media-session";
import { useTask } from "#/lib/processing/use-task";
import { ProcessingWorker } from "#/lib/processing/worker-client";

type Kind = "compress" | "trim" | "gif" | "audio";
export function MediaTool({ kind }: { kind: Kind }) {
	const [file, setFile] = useState<File | null>(null);
	const [backend, setBackend] = useState<"native" | "compatibility">("native");
	const [format, setFormat] = useState<"mp4" | "webm">("mp4");
	const [audioFormat, setAudioFormat] = useState<AudioFormat>("mp3");
	const [preset, setPreset] = useState<VideoPreset>("balanced");
	const [resolution, setResolution] = useState<Resolution>("720");
	const [removeAudio, setRemoveAudio] = useState(false);
	const [start, setStart] = useState(0);
	const [end, setEnd] = useState(0);
	const [fps, setFps] = useState(12);
	const [width, setWidth] = useState(480);
	const [gifMode, setGifMode] = useState<"fast" | "optimized">("fast");
	const [previewFailed, setPreviewFailed] = useState(false);
	const [gifWorker] = useState(() => new ProcessingWorker());
	const session = useMediaSession();
	const probe = useTask<VideoInfo>();
	const task = useTask<Blob>();
	const url = useObjectUrl(file);
	const resultUrl = useObjectUrl(task.result);
	const { run: probeRun, reset: probeReset } = probe;
	const { reset } = task;
	useEffect(() => () => gifWorker.dispose(), [gifWorker]);
	useEffect(() => {
		probeReset();
		reset();
		setPreviewFailed(false);
		if (file)
			void probeRun(async (options) => {
				const media = await import("@qbtools/engines/media");
				return media.probeVideo(file, {
					backend,
					ffmpeg: session,
					signal: options.signal,
					onStatus: options.onProgress,
				});
			});
	}, [file, backend, session, probeRun, probeReset, reset]);
	useEffect(() => {
		if (probe.result) {
			setStart(0);
			setEnd(kind === "gif" ? Math.min(6, probe.result.duration) : probe.result.duration);
		}
	}, [probe.result, kind]);
	const busy = probe.busy || task.busy;
	const run = () => {
		if (!file) return;
		void task.run(async (options) => {
			const media = await import("@qbtools/engines/media");
			const common = {
				backend,
				ffmpeg: session,
				signal: options.signal,
				onStatus: options.onProgress,
				onProgress: (fraction: number) =>
					options.onProgress?.({
						stage: "processing",
						fraction,
						label: kind === "gif" ? "Creating GIF…" : "Processing media…",
					}),
			};
			if (kind === "compress")
				return media.compressVideo(file, { ...common, format, preset, resolution, removeAudio });
			if (kind === "trim") return media.trimVideo(file, { ...common, start, end });
			if (kind === "gif")
				return media.videoToGif(file, {
					...common,
					start,
					end,
					fps,
					width,
					mode: gifMode,
					worker: gifWorker,
				});
			return media.extractAudioFromVideo(file, audioFormat, undefined, {
				...options,
				backend,
				ffmpeg: session,
			});
		});
	};
	const range = kind === "trim" || kind === "gif";
	const validRange =
		!range ||
		(Number.isFinite(start) &&
			Number.isFinite(end) &&
			start >= 0 &&
			end > start &&
			end <= (probe.result?.duration ?? 0) + 0.01 &&
			(kind !== "gif" || end - start <= 15));
	const extension =
		kind === "gif" ? "gif" : kind === "audio" ? audioFormat : kind === "trim" ? "mp4" : format;
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
				title={
					kind === "audio"
						? "Drop a video to extract audio"
						: kind === "gif"
							? "Drop a video to make a GIF"
							: "Choose a video"
				}
				hint="MP4, MOV, WebM or MKV · codec support varies by device"
				onFiles={(files) => setFile(files[0] ?? null)}
			/>
			<Field label="Processing mode" htmlFor="media-backend">
				<Select
					value={backend}
					disabled={busy}
					onValueChange={(val) => {
						const value = val as typeof backend;
						setBackend(value);
						if (value === "compatibility") setFormat("mp4");
					}}
				>
					<SelectTrigger id="media-backend" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="native">Fast — native codecs</SelectItem>
						<SelectItem value="compatibility">Compatibility mode — up to 128 MiB</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			{backend === "compatibility" && (
				<p className="text-sm text-muted-foreground">
					The compatibility engine downloads when needed. Processing may take longer and uses more
					memory.
				</p>
			)}
			<TaskProgress busy={probe.busy} progress={probe.progress} cancel={probe.cancel} />
			{probe.error && (
				<Notice tone="caution">
					{probe.error}
					{backend === "native" && (
						<Button variant="outline" disabled={busy} onClick={() => setBackend("compatibility")}>
							Try Compatibility mode
						</Button>
					)}
				</Notice>
			)}
			{file && (
				<p>
					{file.name}
					{probe.result &&
						` · ${probe.result.width}×${probe.result.height} · ${probe.result.duration.toFixed(1)} seconds`}
				</p>
			)}
			{url && kind !== "audio" && (
				<>
					{/* biome-ignore lint/a11y/useMediaCaption: private user media preview */}
					<video
						src={url}
						controls
						playsInline
						onError={() => setPreviewFailed(true)}
						className="max-h-80 w-full bg-black"
					/>
					{previewFailed && (
						<p>
							Preview is unavailable for this codec. Compatibility mode can still process the
							selected timestamps.
						</p>
					)}
				</>
			)}
			<fieldset disabled={busy} className="flex flex-col gap-4">
				{kind === "compress" && (
					<>
						<Field label="Output format" htmlFor="media-format">
							<Select
								value={format}
								onValueChange={(val) => {
									reset();
									setFormat(val as typeof format);
								}}
							>
								<SelectTrigger id="media-format" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="mp4">MP4 — H.264 / AAC</SelectItem>
									<SelectItem value="webm" disabled={backend === "compatibility"}>
										WebM — VP9 / Opus (native mode)
									</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field label="Quality" htmlFor="video-quality">
							<Select
								value={preset}
								onValueChange={(val) => {
									reset();
									setPreset(val as VideoPreset);
								}}
							>
								<SelectTrigger id="video-quality" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="high">High quality</SelectItem>
									<SelectItem value="balanced">Balanced</SelectItem>
									<SelectItem value="small">Small</SelectItem>
									<SelectItem value="tiny">Tiny</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field label="Resolution" htmlFor="video-resolution">
							<Select
								value={resolution}
								onValueChange={(val) => {
									reset();
									setResolution(val as Resolution);
								}}
							>
								<SelectTrigger id="video-resolution" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="original">Keep original</SelectItem>
									{["1080", "720", "480", "360"].map((v) => (
										<SelectItem key={v} value={v}>
											{v}p
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<label className="flex gap-2">
							<input
								type="checkbox"
								checked={removeAudio}
								onChange={(e) => {
									reset();
									setRemoveAudio(e.target.checked);
								}}
							/>
							Remove sound
						</label>
					</>
				)}
				{range && (
					<div className="grid gap-3 sm:grid-cols-2">
						<Field label="Start (seconds)" htmlFor="media-start">
							<Input
								id="media-start"
								type="number"
								min={0}
								max={probe.result?.duration ?? 0}
								step={0.1}
								value={start}
								onChange={(e) => {
									reset();
									setStart(Number(e.target.value));
								}}
							/>
						</Field>
						<Field label="End (seconds)" htmlFor="media-end">
							<Input
								id="media-end"
								type="number"
								min={0}
								max={probe.result?.duration ?? 0}
								step={0.1}
								value={end}
								onChange={(e) => {
									reset();
									setEnd(Number(e.target.value));
								}}
							/>
						</Field>
					</div>
				)}
				{kind === "gif" && (
					<>
						<Field label="GIF encoding" htmlFor="gif-mode">
							<Select
								value={gifMode}
								onValueChange={(val) => {
									reset();
									setGifMode(val as typeof gifMode);
								}}
							>
								<SelectTrigger id="gif-mode" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fast">Fast</SelectItem>
									<SelectItem value="optimized">Optimized — up to 128 MiB</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field label="Frames per second" htmlFor="gif-fps">
							<Select
								value={String(fps)}
								onValueChange={(val) => {
									reset();
									setFps(Number(val));
								}}
							>
								<SelectTrigger id="gif-fps" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[10, 12, 18, 24].map((v) => (
										<SelectItem key={v} value={String(v)}>
											{v} FPS
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<Field label="GIF width" htmlFor="gif-width">
							<Select
								value={String(width)}
								onValueChange={(val) => {
									reset();
									setWidth(Number(val));
								}}
							>
								<SelectTrigger id="gif-width" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[320, 480, 640, 720].map((v) => (
										<SelectItem key={v} value={String(v)}>
											{v} pixels
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<p>Choose up to 15 seconds. GIFs loop continuously.</p>
					</>
				)}
				{kind === "audio" && (
					<>
						<Field label="Audio output format" htmlFor="audio-format">
							<Select
								value={audioFormat}
								onValueChange={(val) => {
									reset();
									setAudioFormat(val as AudioFormat);
								}}
							>
								<SelectTrigger id="audio-format" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="mp3">MP3 — 192 kbps</SelectItem>
									<SelectItem value="wav">WAV — 16-bit PCM</SelectItem>
									<SelectItem value="flac">FLAC — lossless compression</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<p>
							WAV and FLAC preserve decoded audio without further lossy compression. They do not
							restore quality lost in the source.
						</p>
					</>
				)}
			</fieldset>
			<Button disabled={!file || !probe.result || busy || !validRange} onClick={run}>
				{kind === "compress"
					? "Compress video"
					: kind === "trim"
						? "Trim & export MP4"
						: kind === "gif"
							? "Create animated GIF"
							: "Extract audio"}
			</Button>
			{!validRange && (
				<Notice tone="caution">
					Choose an end after the start, within the video duration
					{kind === "gif" ? ", with a maximum length of 15 seconds" : ""}.
				</Notice>
			)}
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && (
				<Notice tone="critical">
					{task.error}
					{backend === "native" && (
						<Button variant="outline" onClick={() => setBackend("compatibility")}>
							Try Compatibility mode
						</Button>
					)}
				</Notice>
			)}
			{task.status === "cancelled" && <p>Processing cancelled.</p>}
			{task.result && file && (
				<>
					{kind === "gif" && resultUrl && (
						<img src={resultUrl} alt="Converted GIF preview" className="max-h-80 object-contain" />
					)}
					{(kind === "compress" || kind === "trim") && resultUrl && (
						// biome-ignore lint/a11y/useMediaCaption: private output preview
						<video src={resultUrl} controls playsInline className="max-h-80 w-full bg-black" />
					)}
					{kind === "audio" && resultUrl && (
						<audio src={resultUrl} controls>
							<track kind="captions" />
						</audio>
					)}
					<ResultDownload
						blob={task.result}
						name={suffixFilename(
							file.name,
							kind === "trim" ? "trimmed" : kind === "compress" ? "compressed" : "converted",
							extension,
						)}
						before={kind === "compress" ? file.size : undefined}
						title="Processing complete"
					/>
				</>
			)}
			{file && (
				<Button
					variant="ghost"
					onClick={() => {
						probeReset();
						reset();
						setFile(null);
					}}
				>
					Clear file and cancel processing
				</Button>
			)}
			<PrivacyNote />
		</div>
	);
}
