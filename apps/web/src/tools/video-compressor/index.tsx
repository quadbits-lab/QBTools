import { downloadBlob, replaceExtension } from "@qbtools/engines/files";
import { Button } from "@qbtools/ui/button";
import { Select } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Progress } from "@qbtools/ui/progress";
import { Switch } from "@qbtools/ui/switch";
import { cn, formatBytes } from "@qbtools/ui/utils";
import { Download, FilePlay, Loader2, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { useObjectUrl } from "#/components/kit/use-object-url";

type Media = typeof import("@qbtools/engines/media");
const PRESETS = {
	high: { label: "High quality", hint: "Smaller, looks the same" },
	balanced: { label: "Balanced", hint: "Great for WhatsApp & email" },
	small: { label: "Small", hint: "Much smaller, softer picture" },
	tiny: { label: "Tiny", hint: "Smallest possible" },
} as const;
type Preset = keyof typeof PRESETS;
type Resolution = "original" | "1080" | "720" | "480" | "360";

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export default function VideoCompressor() {
	const media = useRef<Media | null>(null);
	const [supported, setSupported] = useState<boolean | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [info, setInfo] = useState<{ duration: number; width: number; height: number; hasAudio: boolean } | null>(null);
	const [preset, setPreset] = useState<Preset>("balanced");
	const [resolution, setResolution] = useState<Resolution>("720");
	const [removeAudio, setRemoveAudio] = useState(false);
	const [progress, setProgress] = useState<number | null>(null);
	const [result, setResult] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);
	const abort = useRef<AbortController | null>(null);
	const resultUrl = useObjectUrl(result);

	useEffect(() => {
		void import("@qbtools/engines/media").then((m) => {
			media.current = m;
			setSupported(m.supportsWebCodecs());
		});
	}, []);

	const load = async (files: File[]) => {
		const f = files[0];
		if (!f || !media.current) return;
		setError(null);
		setResult(null);
		try {
			setInfo(await media.current.probeVideo(f));
			setFile(f);
		} catch (e) {
			setError(e instanceof Error ? e.message : "This video couldn't be opened.");
		}
	};

	const run = async () => {
		if (!file || !media.current) return;
		setError(null);
		setResult(null);
		setProgress(0);
		abort.current = new AbortController();
		try {
			setResult(await media.current.compressVideo(file, { preset, resolution, removeAudio, onProgress: setProgress, signal: abort.current.signal }));
		} catch (e) {
			if (!abort.current.signal.aborted) setError(e instanceof Error ? e.message : "Compression failed.");
		} finally {
			setProgress(null);
		}
	};

	if (supported === false) {
		return <Notice tone="caution">Your browser can't compress video yet. Please use the latest Chrome, Edge, Safari (17+) or Firefox (130+) on a computer or phone.</Notice>;
	}

	if (!file || !info) {
		return (
			<div className="flex flex-col gap-4">
				<FileDrop accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mov,.mkv" onFiles={load} hint="MP4, MOV or WebM" />
				{error && <Notice tone="critical">{error}</Notice>}
				<PrivacyNote text="Compressed on your device with its built-in video encoder — never uploaded." />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			<p>
				<strong>{file.name}</strong> · {formatBytes(file.size)} · {info.width}×{info.height} · {formatDuration(info.duration)}
			</p>
			<div role="radiogroup" aria-label="Quality" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{(Object.keys(PRESETS) as Preset[]).map((key) => (
					<button key={key} type="button" role="radio" aria-checked={preset === key} onClick={() => setPreset(key)} className={cn("flex cursor-pointer flex-col items-start rounded-2xl border-2 p-4 text-left", preset === key ? "border-primary bg-primary-soft/50" : "border-border hover:border-primary/50")}>
						<span className="font-bold">{PRESETS[key].label}</span>
						<span className="text-sm text-muted-foreground">{PRESETS[key].hint}</span>
					</button>
				))}
			</div>
			<div className="flex flex-wrap items-end gap-6">
				<Field label="Resolution" htmlFor="vc-res" className="w-56">
					<Select id="vc-res" value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)}>
						<option value="original">Keep original</option>
						<option value="1080">1080p (Full HD)</option>
						<option value="720">720p (HD) — recommended</option>
						<option value="480">480p</option>
						<option value="360">360p</option>
					</Select>
				</Field>
				{info.hasAudio && (
					<label className="flex min-h-12 items-center gap-3 font-medium">
						<Switch checked={removeAudio} onCheckedChange={setRemoveAudio} /> Remove sound
					</label>
				)}
			</div>
			{progress === null && !result && (
				<Button size="lg" className="self-start" onClick={run}>
					<FilePlay /> Compress video
				</Button>
			)}
			{progress !== null && (
				<div className="flex flex-col gap-3">
					<Progress value={progress * 100} label="Compressing… keep this tab open" />
					<Button variant="secondary" className="self-start" onClick={() => abort.current?.abort()}>
						<Square /> Cancel
					</Button>
				</div>
			)}
			{error && <Notice tone="critical">{error}</Notice>}
			{result && resultUrl && (
				<div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
					<video src={resultUrl} controls playsInline className="w-full rounded-2xl bg-black" />
					<div className="flex flex-col gap-3 rounded-2xl bg-positive-soft/60 p-5">
						<p className="text-lg font-bold">Done!</p>
						<p>
							{formatBytes(file.size)} → <strong>{formatBytes(result.size)}</strong>
							{result.size < file.size && <> (−{Math.round((1 - result.size / file.size) * 100)}%)</>}
						</p>
						{result.size >= file.size && <Notice tone="caution">This video was already well compressed. Try “Small” or a lower resolution.</Notice>}
						<Button size="lg" onClick={() => downloadBlob(result, replaceExtension(file.name, "mp4").replace(/\.mp4$/, "-compressed.mp4"))}>
							<Download /> Download MP4
						</Button>
					</div>
				</div>
			)}
			<Button variant="ghost" className="self-start" disabled={progress !== null} onClick={() => { setFile(null); setResult(null); }}>
				{progress !== null ? <Loader2 className="animate-spin" /> : <RotateCcw />} Choose another video
			</Button>
			<PrivacyNote text="Compressed on your device with its built-in video encoder — never uploaded." />
		</div>
	);
}
