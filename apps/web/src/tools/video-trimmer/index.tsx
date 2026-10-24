import { downloadBlob } from "@qbtools/engines/files";
import { Button } from "@qbtools/ui/button";
import { Progress } from "@qbtools/ui/progress";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { CheckCircle2, Download, Play, RotateCcw, Scissors, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useObjectUrl } from "#/components/kit/use-object-url";

const formatTime = (sec: number) => {
	if (!Number.isFinite(sec)) return "0:00.0";
	const m = Math.floor(sec / 60);
	const s = sec - m * 60;
	return `${m}:${s.toFixed(1).padStart(4, "0")}`;
};

export default function VideoTrimmer() {
	const [file, setFile] = useState<File | null>(null);
	const [duration, setDuration] = useState(0);
	const [start, setStart] = useState(0);
	const [end, setEnd] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState<number | null>(null);
	const [result, setResult] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);

	const videoRef = useRef<HTMLVideoElement>(null);
	const videoUrl = useObjectUrl(file);
	const resultUrl = useObjectUrl(result);
	const abortCtrl = useRef<AbortController | null>(null);

	const handleLoadedMetadata = () => {
		if (!videoRef.current) return;
		const dur = videoRef.current.duration;
		if (Number.isFinite(dur) && dur > 0) {
			setDuration(dur);
			setStart(0);
			setEnd(dur);
		}
	};

	const seekTo = (sec: number) => {
		if (!videoRef.current) return;
		videoRef.current.currentTime = Math.min(Math.max(0, sec), duration);
		setCurrentTime(videoRef.current.currentTime);
	};

	const runTrim = async () => {
		if (!file || end <= start) return;
		setLoading(true);
		setError(null);
		setProgress(0.05);

		abortCtrl.current = new AbortController();
		try {
			const mediaEngine = await import("@qbtools/engines/media");
			const trimmedBlob = await mediaEngine.trimVideo(file, {
				start,
				end,
				onProgress: (p) => setProgress(p),
				signal: abortCtrl.current.signal,
			});
			setResult(trimmedBlob);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Video trimming failed.");
		} finally {
			setLoading(false);
			setProgress(null);
		}
	};

	const reset = () => {
		setFile(null);
		setResult(null);
		setError(null);
		setDuration(0);
		setStart(0);
		setEnd(0);
	};

	return (
		<div className="flex flex-col gap-6">
			{!file ? (
				<FileDrop
					accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
					title="Drop a video to trim & cut"
					hint="MP4, WebM, MOV — processed locally with WebCodecs"
					onFiles={(files) => setFile(files[0] ?? null)}
				/>
			) : (
				<div className="flex flex-col gap-5 border border-border bg-surface p-6">
					{/* Video Player Preview */}
					<div className="relative aspect-video w-full overflow-hidden border border-border bg-black">
						{videoUrl && (
							// biome-ignore lint/a11y/useMediaCaption: user-uploaded video for local trimming
							<video
								ref={videoRef}
								src={videoUrl}
								controls
								onLoadedMetadata={handleLoadedMetadata}
								onTimeUpdate={() => {
									if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
								}}
								className="h-full w-full object-contain"
							/>
						)}
					</div>

					{/* File & Time Info */}
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
						<div className="flex items-center gap-3">
							<span className="grid size-9 place-items-center border border-sky-500/30 bg-sky-500/10 text-sky-400">
								<Video className="size-4" />
							</span>
							<div>
								<p className="font-medium text-foreground text-sm truncate max-w-xs">{file.name}</p>
								<p className="text-xs text-muted-foreground">
									{formatBytes(file.size)} · Total: {formatTime(duration)}
								</p>
							</div>
						</div>
						<Button variant="ghost" size="sm" onClick={reset} disabled={loading}>
							<RotateCcw className="size-3.5" /> Change
						</Button>
					</div>

					{/* Timeline Slider Controls */}
					{duration > 0 && (
						<div className="flex flex-col gap-4 bg-background/60 p-4 border border-input">
							<div className="flex items-center justify-between text-xs font-mono text-subtle">
								<span>
									Start: <strong className="text-foreground">{formatTime(start)}</strong>
								</span>
								<span>
									Selected:{" "}
									<strong className="text-sky-400 font-semibold">{formatTime(end - start)}</strong>
								</span>
								<span>
									End: <strong className="text-foreground">{formatTime(end)}</strong>
								</span>
							</div>

							{/* Start Handle */}
							<div className="flex flex-col gap-1">
								<div className="flex justify-between text-[0.6875rem] font-mono text-subtle">
									<label htmlFor="trim-start-range">Start boundary</label>
									<span>{start.toFixed(1)}s</span>
								</div>
								<input
									id="trim-start-range"
									type="range"
									min={0}
									max={Math.max(0, end - 0.2)}
									step={0.1}
									value={start}
									onChange={(e) => {
										const val = Number(e.target.value);
										setStart(val);
										seekTo(val);
									}}
									className="w-full cursor-pointer accent-sky-400"
								/>
							</div>

							{/* End Handle */}
							<div className="flex flex-col gap-1">
								<div className="flex justify-between text-[0.6875rem] font-mono text-subtle">
									<label htmlFor="trim-end-range">End boundary</label>
									<span>{end.toFixed(1)}s</span>
								</div>
								<input
									id="trim-end-range"
									type="range"
									min={Math.min(duration, start + 0.2)}
									max={duration}
									step={0.1}
									value={end}
									onChange={(e) => {
										const val = Number(e.target.value);
										setEnd(val);
										seekTo(val);
									}}
									className="w-full cursor-pointer accent-sky-400"
								/>
							</div>

							<div className="flex gap-2 pt-1">
								<Button
									variant="outline"
									size="sm"
									onClick={() => seekTo(start)}
									className="text-xs"
								>
									<Play className="size-3" /> Preview Start
								</Button>
								<Button variant="outline" size="sm" onClick={() => seekTo(end)} className="text-xs">
									<Play className="size-3" /> Preview End
								</Button>
							</div>
						</div>
					)}

					{/* Progress Indicator */}
					{progress !== null && <Progress value={progress * 100} label="Trimming video" />}

					{/* Error Alert */}
					{error && <Notice tone="critical">{error}</Notice>}

					{/* Action Button */}
					{!result && (
						<Button
							size="lg"
							onClick={runTrim}
							disabled={loading || duration <= 0 || end <= start}
							className="mt-2 w-full font-mono text-xs uppercase tracking-wider"
						>
							{loading ? (
								"Trimming in browser..."
							) : (
								<>
									<Scissors className="size-4" /> Trim & Export MP4
								</>
							)}
						</Button>
					)}

					{/* Result Download */}
					{result && (
						<div className="mt-2 flex flex-col gap-4 border border-emerald-500/30 bg-emerald-500/10 p-5">
							<div className="flex items-center gap-2 text-emerald-400">
								<CheckCircle2 className="size-5" />
								<span className="font-medium text-sm">Video successfully trimmed!</span>
							</div>

							{resultUrl && (
								// biome-ignore lint/a11y/useMediaCaption: trimmed output preview
								<video
									src={resultUrl}
									controls
									className="aspect-video w-full border border-border bg-black"
								/>
							)}

							<div className="flex items-center justify-between text-xs border-t border-emerald-500/20 pt-2">
								<span className="text-foreground font-medium">trimmed_{file.name}</span>
								<span className="text-muted-foreground">{formatBytes(result.size)}</span>
							</div>

							<Button
								size="lg"
								onClick={() => downloadBlob(result, `trimmed_${file.name}`)}
								className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-medium"
							>
								<Download className="size-4" /> Download Trimmed Video
							</Button>
						</div>
					)}
				</div>
			)}

			<PrivacyNote text="Hardware-Accelerated In-Browser Trimming — WebCodecs executed on your device. 0 bytes uploaded." />
		</div>
	);
}
