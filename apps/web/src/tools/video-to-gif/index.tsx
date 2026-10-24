import { downloadBlob } from "@qbtools/engines/files";
import { Button } from "@qbtools/ui/button";
import { Progress } from "@qbtools/ui/progress";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { CheckCircle2, Download, Film, Play, RotateCcw, Sliders, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
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

export default function VideoToGif() {
	const [file, setFile] = useState<File | null>(null);
	const [duration, setDuration] = useState(0);
	const [start, setStart] = useState(0);
	const [end, setEnd] = useState(0);
	const [fps, setFps] = useState<number>(12);
	const [width, setWidth] = useState<number>(480);
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
			// Default clip duration max 6s for quick GIF conversion
			setEnd(Math.min(dur, 6));
		}
	};

	const seekTo = (sec: number) => {
		if (!videoRef.current) return;
		videoRef.current.currentTime = Math.min(Math.max(0, sec), duration);
	};

	const runConvert = async () => {
		if (!file || end <= start) return;
		setLoading(true);
		setError(null);
		setProgress(0.01);

		abortCtrl.current = new AbortController();
		try {
			const mediaEngine = await import("@qbtools/engines/media");
			const gifBlob = await mediaEngine.videoToGif(file, {
				start,
				end,
				fps,
				width,
				onProgress: (p) => setProgress(p),
				signal: abortCtrl.current.signal,
			});
			setResult(gifBlob);
		} catch (err: unknown) {
			if (err instanceof Error && err.name === "AbortError") {
				// Cancelled
			} else {
				setError((err as Error)?.message || "Failed to convert video to GIF.");
			}
		} finally {
			setLoading(false);
			setProgress(null);
		}
	};

	const handleCancel = () => {
		abortCtrl.current?.abort();
		setLoading(false);
		setProgress(null);
	};

	const clipLength = Math.max(0, end - start);
	const estimatedFrames = Math.max(1, Math.round(clipLength * fps));

	return (
		<div className="flex flex-col gap-6">
			{!file ? (
				<FileDrop
					accept="video/*"
					title="Drop a video to make a GIF"
					hint="MP4, WebM, QuickTime up to 200MB"
					onFiles={(files) => {
						const f = files[0];
						if (f) {
							setFile(f);
							setResult(null);
							setError(null);
						}
					}}
				/>
			) : (
				<div className="flex flex-col gap-5 border border-input bg-surface-2 p-5 sm:p-6">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-input pb-4">
						<div className="flex items-center gap-3 min-w-0">
							<Film className="size-5 shrink-0 text-foreground" />
							<div className="min-w-0">
								<p className="truncate font-medium text-foreground text-sm max-w-xs sm:max-w-md">
									{file.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatBytes(file.size)} • Duration: {formatTime(duration)}
								</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setFile(null);
								setResult(null);
								setError(null);
							}}
							className="font-mono text-xs uppercase tracking-wider"
						>
							<RotateCcw className="size-3.5" /> Change Video
						</Button>
					</div>

					{/* Video Preview */}
					<div className="relative mx-auto flex max-h-80 w-full items-center justify-center overflow-hidden border border-input bg-black/95">
						{videoUrl && (
							<video
								ref={videoRef}
								src={videoUrl}
								controls
								playsInline
								onLoadedMetadata={handleLoadedMetadata}
								className="max-h-80 max-w-full object-contain"
							/>
						)}
					</div>

					{/* Clip Selection */}
					<div className="flex flex-col gap-4 border border-input bg-background/50 p-4">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
								Clip: {formatTime(start)} → {formatTime(end)}
							</span>
							<span
								className={cn(
									"font-mono text-xs",
									clipLength > 15 ? "text-amber-500" : "text-foreground",
								)}
							>
								Length: {clipLength.toFixed(1)}s ({estimatedFrames} frames)
							</span>
						</div>

						{clipLength > 15 && (
							<p className="text-xs text-amber-500">
								Tip: GIFs longer than 15 seconds can be very large and slow to encode. We recommend
								trimming to 3–10 seconds.
							</p>
						)}

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between text-xs font-mono">
									<span className="text-muted-foreground">Start</span>
									<button
										type="button"
										onClick={() => seekTo(start)}
										className="flex items-center gap-1 text-foreground hover:underline"
									>
										<Play className="size-3" /> {formatTime(start)}
									</button>
								</div>
								<input
									type="range"
									min={0}
									max={Math.max(0, end - 0.1)}
									step={0.1}
									value={start}
									onChange={(e) => {
										const val = parseFloat(e.target.value);
										setStart(val);
										seekTo(val);
									}}
									className="accent-foreground"
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between text-xs font-mono">
									<span className="text-muted-foreground">End</span>
									<button
										type="button"
										onClick={() => seekTo(end)}
										className="flex items-center gap-1 text-foreground hover:underline"
									>
										<Play className="size-3" /> {formatTime(end)}
									</button>
								</div>
								<input
									type="range"
									min={Math.min(duration, start + 0.1)}
									max={duration || 10}
									step={0.1}
									value={end}
									onChange={(e) => {
										const val = parseFloat(e.target.value);
										setEnd(val);
										seekTo(val);
									}}
									className="accent-foreground"
								/>
							</div>
						</div>
					</div>

					{/* Output Settings */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<span className="label-mono flex items-center gap-1.5 text-foreground">
								<Sliders className="size-3.5" /> Frame Rate (FPS)
							</span>
							<div className="grid grid-cols-3 gap-2">
								{[
									{ val: 10, label: "10 fps" },
									{ val: 12, label: "12 fps" },
									{ val: 18, label: "18 fps" },
								].map((opt) => (
									<button
										key={opt.val}
										type="button"
										onClick={() => setFps(opt.val)}
										className={cn(
											"border p-2 font-mono text-xs transition-colors",
											fps === opt.val
												? "border-foreground bg-foreground text-background font-semibold"
												: "border-input bg-surface-2 text-muted-foreground hover:border-foreground",
										)}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<span className="label-mono text-foreground">Target Width</span>
							<div className="grid grid-cols-3 gap-2">
								{[
									{ val: 320, label: "320 px" },
									{ val: 480, label: "480 px" },
									{ val: 640, label: "640 px" },
								].map((opt) => (
									<button
										key={opt.val}
										type="button"
										onClick={() => setWidth(opt.val)}
										className={cn(
											"border p-2 font-mono text-xs transition-colors",
											width === opt.val
												? "border-foreground bg-foreground text-background font-semibold"
												: "border-input bg-surface-2 text-muted-foreground hover:border-foreground",
										)}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Progress */}
					{progress !== null && (
						<Progress value={Math.round(progress * 100)} label="Generating Animated GIF" />
					)}

					{error && <Notice tone="critical">{error}</Notice>}

					{/* Action Buttons */}
					<div className="flex items-center gap-3">
						<Button
							size="lg"
							onClick={runConvert}
							disabled={loading || end <= start}
							className="w-full font-mono text-xs uppercase tracking-wider"
						>
							<Sparkles className="size-4" />
							{loading ? "Generating GIF..." : "Create Animated GIF"}
						</Button>

						{loading && (
							<Button
								variant="outline"
								size="lg"
								onClick={handleCancel}
								className="font-mono text-xs uppercase tracking-wider text-critical hover:border-critical"
							>
								Cancel
							</Button>
						)}
					</div>

					{/* Result Preview & Download */}
					{result && resultUrl && (
						<div className="mt-2 flex flex-col gap-4 border border-input bg-surface-2 p-5">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2.5 text-foreground">
									<CheckCircle2 className="size-5" />
									<span className="font-medium text-sm">GIF Generated Successfully</span>
								</div>
								<span className="font-mono text-xs text-muted-foreground">
									{formatBytes(result.size)}
								</span>
							</div>

							<div className="flex justify-center border border-input bg-black/40 p-3">
								<img
									src={resultUrl}
									alt="Converted GIF preview"
									className="max-h-72 object-contain"
								/>
							</div>

							<Button
								size="lg"
								onClick={() => {
									const baseName = file.name.replace(/\.[^/.]+$/, "");
									downloadBlob(result, `${baseName}-clip.gif`);
								}}
								className="w-full font-medium"
							>
								<Download className="size-4" /> Download GIF ({formatBytes(result.size)})
							</Button>
						</div>
					)}
				</div>
			)}

			<PrivacyNote text="100% Client-Side GIF Encoding — Video frames extracted and quantized locally. 0 bytes uploaded." />
		</div>
	);
}
