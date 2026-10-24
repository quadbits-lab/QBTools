import { downloadBlob, replaceExtension } from "@qbtools/engines/files";
import { checkAbort } from "@qbtools/engines/processing";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Slider } from "@qbtools/ui/slider";
import { Download, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type WaveSurfer from "wavesurfer.js";
import type { Region } from "wavesurfer.js/plugins/regions";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { TaskProgress } from "#/components/kit/task-progress";
import { useTask } from "#/lib/processing/use-task";

type Media = typeof import("@qbtools/engines/media");

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
const parseTime = (value: string) => {
	const [m, s] = value.includes(":") ? value.split(":") : ["0", value];
	return Number(m) * 60 + Number(s);
};

export default function AudioTrimmer() {
	const container = useRef<HTMLDivElement>(null);
	const ws = useRef<WaveSurfer | null>(null);
	const region = useRef<Region | null>(null);
	const media = useRef<Media | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
	const [range, setRange] = useState({ start: 0, end: 0 });
	const [fadeIn, setFadeIn] = useState(0);
	const [fadeOut, setFadeOut] = useState(1);
	const [format, setFormat] = useState<"mp3" | "wav" | "flac">("mp3");
	const [playing, setPlaying] = useState(false);
	const exportTask = useTask<Blob>();
	const pending = exportTask.busy;
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!file || !container.current) return;
		let disposed = false;
		const url = URL.createObjectURL(file);
		void (async () => {
			const [{ default: WaveSurferLib }, { default: RegionsPlugin }, engine] = await Promise.all([
				import("wavesurfer.js"),
				import("wavesurfer.js/plugins/regions"),
				import("@qbtools/engines/media"),
			]);
			if (disposed || !container.current) return;
			media.current = engine;
			const styles = getComputedStyle(document.documentElement);
			const regions = RegionsPlugin.create();
			const instance = WaveSurferLib.create({
				container: container.current,
				url,
				height: 128,
				waveColor: styles.getPropertyValue("--muted-foreground").trim() || "#94a3b8",
				progressColor: styles.getPropertyValue("--primary").trim() || "#4f46e5",
				cursorColor: styles.getPropertyValue("--foreground").trim() || "#111",
				barWidth: 2,
				barGap: 1,
				barRadius: 2,
				plugins: [regions],
			});
			ws.current = instance;
			instance.on("ready", (duration) => {
				const end = Math.min(duration, 30);
				region.current = regions.addRegion({
					start: 0,
					end,
					color: "color-mix(in oklch, var(--primary) 22%, transparent)",
					drag: true,
					resize: true,
				});
				setRange({ start: 0, end });
			});
			instance.on("play", () => setPlaying(true));
			instance.on("pause", () => setPlaying(false));
			instance.on("timeupdate", (time) => {
				if (region.current && time >= region.current.end) instance.pause();
			});
			regions.on("region-updated", (r) => setRange({ start: r.start, end: r.end }));
			instance.on("error", () =>
				setError("This audio file couldn't be opened. Try MP3, WAV, M4A or OGG."),
			);
			try {
				const decoded = await engine.decodeAudio(file);
				if (!disposed) setBuffer(decoded);
			} catch (e) {
				if (!disposed) setError(e instanceof Error ? e.message : "Couldn't read this audio.");
			}
		})();
		return () => {
			disposed = true;
			ws.current?.destroy();
			ws.current = null;
			URL.revokeObjectURL(url);
		};
	}, [file]);

	const setRegion = (start: number, end: number) => {
		const duration = buffer?.duration ?? ws.current?.getDuration() ?? 0;
		const s = Math.max(0, Math.min(start, duration));
		const e = Math.max(s + 0.1, Math.min(end, duration));
		region.current?.setOptions({ start: s, end: e });
		setRange({ start: s, end: e });
	};

	const exportClip = () => {
		if (!buffer || !media.current || !file) return;
		const engine = media.current;
		setError(null);
		void exportTask.run(async (options) => {
			options.onProgress?.({ stage: "processing", fraction: null, label: "Encoding audio clip…" });
			const clip = engine.trimAudioBuffer(buffer, range.start, range.end, fadeIn, fadeOut);
			const blob =
				format === "wav"
					? engine.encodeWav(clip)
					: format === "flac"
						? await engine.encodeFlac(clip, options)
						: await engine.encodeMp3(clip, 192_000, options);
			checkAbort(options.signal);
			downloadBlob(blob, replaceExtension(file.name, format).replace(/(\.\w+)$/, "-trimmed$1"));
			return blob;
		});
	};

	if (!file) {
		return (
			<div className="flex flex-col gap-4">
				<FileDrop
					accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
					onFiles={(f) => f[0] && setFile(f[0])}
					hint="MP3, WAV, M4A, OGG or FLAC"
				/>
				<PrivacyNote />
			</div>
		);
	}

	const length = Math.max(0, range.end - range.start);
	return (
		<div className="flex flex-col gap-5">
			<p className="truncate font-medium">{file.name}</p>
			<div
				ref={container}
				role="group"
				className="border border-border bg-surface-2 p-3"
				aria-label="Audio waveform. Drag the highlighted area or its edges to choose the part to keep."
			/>
			<div className="flex flex-wrap items-end gap-4">
				<Button
					size="lg"
					variant="secondary"
					onClick={() => (playing ? ws.current?.pause() : region.current?.play())}
					disabled={!buffer}
				>
					{playing ? <Pause /> : <Play />} {playing ? "Pause" : "Play selection"}
				</Button>
				<Field label="Start" htmlFor="at-start" className="w-32">
					<Input
						id="at-start"
						value={fmt(range.start)}
						onChange={(e) => {
							const v = parseTime(e.target.value);
							if (Number.isFinite(v)) setRegion(v, range.end);
						}}
						className="font-mono"
					/>
				</Field>
				<Field label="End" htmlFor="at-end" className="w-32">
					<Input
						id="at-end"
						value={fmt(range.end)}
						onChange={(e) => {
							const v = parseTime(e.target.value);
							if (Number.isFinite(v)) setRegion(range.start, v);
						}}
						className="font-mono"
					/>
				</Field>
				<p className="pb-3 text-muted-foreground">
					Length: <strong className="font-mono text-foreground">{fmt(length)}</strong>
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				<Slider
					id="fade-in"
					label="Fade in"
					valueLabel={`${fadeIn}s`}
					min={0}
					max={5}
					step={0.5}
					value={fadeIn}
					onChange={(e) => setFadeIn(Number(e.target.value))}
				/>
				<Slider
					id="fade-out"
					label="Fade out"
					valueLabel={`${fadeOut}s`}
					min={0}
					max={5}
					step={0.5}
					value={fadeOut}
					onChange={(e) => setFadeOut(Number(e.target.value))}
				/>
				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium">Save as</span>
					<Segmented
						label="Format"
						value={format}
						onChange={setFormat}
						options={[
							{ value: "mp3", label: "MP3" },
							{ value: "wav", label: "WAV" },
							{ value: "flac", label: "FLAC" },
						]}
					/>
				</div>
			</div>
			<div className="flex flex-wrap gap-2">
				<Button size="lg" onClick={exportClip} disabled={!buffer || pending || length < 0.1}>
					{pending ? <Loader2 className="animate-spin" /> : <Download />} Download{" "}
					{format.toUpperCase()}
				</Button>
				<Button
					size="lg"
					variant="ghost"
					onClick={() => {
						exportTask.reset();
						setFile(null);
						setBuffer(null);
					}}
				>
					<RotateCcw /> Another file
				</Button>
			</div>
			<TaskProgress busy={pending} progress={exportTask.progress} cancel={exportTask.cancel} />
			{(error || exportTask.error) && <Notice tone="critical">{error || exportTask.error}</Notice>}
			<p className="text-sm text-muted-foreground">
				WAV and FLAC preserve decoded audio without further lossy compression. They do not restore
				quality lost in the source.
			</p>
			<PrivacyNote />
		</div>
	);
}
