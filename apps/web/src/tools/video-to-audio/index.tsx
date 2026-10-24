import { downloadBlob, replaceExtension } from "@qbtools/engines/files";
import { Button } from "@qbtools/ui/button";
import { Progress } from "@qbtools/ui/progress";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { AudioWaveform, CheckCircle2, Download, Music, RotateCcw, Video } from "lucide-react";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useObjectUrl } from "#/components/kit/use-object-url";

export default function VideoToAudio() {
	const [file, setFile] = useState<File | null>(null);
	const [format, setFormat] = useState<"mp3" | "wav">("mp3");
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState<number | null>(null);
	const [result, setResult] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);

	const resultUrl = useObjectUrl(result);

	const runExtract = async () => {
		if (!file) return;
		setLoading(true);
		setError(null);
		setProgress(0.1);

		try {
			const mediaEngine = await import("@qbtools/engines/media");
			const audioBlob = await mediaEngine.extractAudioFromVideo(file, format, (p) =>
				setProgress(p),
			);
			setResult(audioBlob);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Audio extraction failed. Video might not contain an audio track.",
			);
		} finally {
			setLoading(false);
			setProgress(null);
		}
	};

	const reset = () => {
		setFile(null);
		setResult(null);
		setError(null);
	};

	return (
		<div className="flex flex-col gap-6">
			{!file ? (
				<FileDrop
					accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
					title="Drop a video to extract audio"
					hint="MP4, WebM, MOV, MKV — extract soundtrack to MP3 or WAV"
					onFiles={(files) => setFile(files[0] ?? null)}
				/>
			) : (
				<div className="flex flex-col gap-5 border border-border bg-surface p-6">
					{/* Video details */}
					<div className="flex items-center justify-between border-b border-border pb-4">
						<div className="flex items-center gap-3">
							<span className="grid size-10 place-items-center border border-sky-500/30 bg-sky-500/10 text-sky-400">
								<Video className="size-5" />
							</span>
							<div>
								<p className="font-medium text-foreground">{file.name}</p>
								<p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
							</div>
						</div>
						<Button variant="ghost" size="sm" onClick={reset} disabled={loading}>
							<RotateCcw className="size-3.5" /> Change
						</Button>
					</div>

					{/* Format Selector */}
					<div className="flex flex-col gap-2">
						<span className="label-mono">Select Output Audio Format</span>
						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={() => setFormat("mp3")}
								className={cn(
									"flex flex-col gap-1 border p-4 text-left cursor-pointer transition-all",
									format === "mp3"
										? "border-sky-500 bg-sky-500/10 text-foreground"
										: "border-border bg-background hover:border-input",
								)}
							>
								<span className="font-medium text-sm">MP3 (Recommended)</span>
								<span className="text-xs text-muted-foreground">
									Universal playback, 192 kbps high quality
								</span>
							</button>

							<button
								type="button"
								onClick={() => setFormat("wav")}
								className={cn(
									"flex flex-col gap-1 border p-4 text-left cursor-pointer transition-all",
									format === "wav"
										? "border-sky-500 bg-sky-500/10 text-foreground"
										: "border-border bg-background hover:border-input",
								)}
							>
								<span className="font-medium text-sm">WAV (Uncompressed)</span>
								<span className="text-xs text-muted-foreground">
									Lossless 16-bit PCM studio audio
								</span>
							</button>
						</div>
					</div>

					{/* Progress */}
					{progress !== null && <Progress value={progress * 100} label="Extracting audio track" />}

					{error && <Notice tone="critical">{error}</Notice>}

					{!result && (
						<Button
							size="lg"
							onClick={runExtract}
							disabled={loading}
							className="mt-2 w-full font-mono text-xs uppercase tracking-wider"
						>
							{loading ? (
								"Extracting..."
							) : (
								<>
									<AudioWaveform className="size-4" /> Extract Audio to {format.toUpperCase()}
								</>
							)}
						</Button>
					)}

					{/* Result audio player */}
					{result && (
						<div className="mt-2 flex flex-col gap-4 border border-emerald-500/30 bg-emerald-500/10 p-5">
							<div className="flex items-center gap-2 text-emerald-400">
								<CheckCircle2 className="size-5" />
								<span className="font-medium text-sm">Audio successfully extracted!</span>
							</div>

							{resultUrl && (
								// biome-ignore lint/a11y/useMediaCaption: audio preview
								<audio src={resultUrl} controls className="w-full mt-1" />
							)}

							<div className="flex items-center justify-between text-xs border-t border-emerald-500/20 pt-2">
								<span className="text-foreground font-medium">
									{replaceExtension(file.name, `.${format}`)}
								</span>
								<span className="text-muted-foreground">{formatBytes(result.size)}</span>
							</div>

							<Button
								size="lg"
								onClick={() => downloadBlob(result, replaceExtension(file.name, `.${format}`))}
								className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-medium"
							>
								<Download className="size-4" /> Download {format.toUpperCase()}
							</Button>
						</div>
					)}
				</div>
			)}

			<PrivacyNote text="Instant Client-Side Extraction — Video audio decoded and encoded directly in browser RAM. 0 bytes uploaded." />
		</div>
	);
}
