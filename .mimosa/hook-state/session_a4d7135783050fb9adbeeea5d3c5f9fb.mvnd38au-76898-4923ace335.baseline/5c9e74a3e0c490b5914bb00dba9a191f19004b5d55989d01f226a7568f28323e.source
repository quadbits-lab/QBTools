import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { assetBase } from "../assets";
import { checkAbort, LIMITS, type ProcessingOptions, progress } from "../processing";
import type { VideoInfo } from "./index";
export interface FfmpegVideoOptions extends ProcessingOptions {
	format?: "mp4" | "webm";
	preset?: "high" | "balanced" | "small" | "tiny";
	resolution?: "original" | "1080" | "720" | "480" | "360";
	removeAudio?: boolean;
	start?: number;
	end?: number;
}
export class FFmpegSession {
	private engine: FFmpeg | null = null;
	private options: ProcessingOptions = {};
	private busy = false;
	dispose() {
		this.engine?.terminate();
		this.engine = null;
		this.options = {};
	}
	private async load(options: ProcessingOptions) {
		checkAbort(options.signal);
		this.options = options;
		if (this.engine) return this.engine;
		progress(options, "Loading compatibility engine…", null, "loading");
		const { FFmpeg } = await import("@ffmpeg/ffmpeg");
		const [base, wrapper] = await Promise.all([assetBase("ffmpeg-core"), assetBase("ffmpeg")]);
		checkAbort(options.signal);
		const engine = new FFmpeg();
		this.engine = engine;
		engine.on("progress", ({ progress: value }) => {
			if (!this.options.signal?.aborted)
				this.options.onProgress?.({
					stage: "processing",
					fraction: Number.isFinite(value) && value >= 0 && value <= 1 ? value : null,
					label: "Processing media…",
				});
		});
		try {
			await engine.load({
				coreURL: `${base}/ffmpeg-core.js`,
				wasmURL: `${base}/ffmpeg-core.wasm`,
				classWorkerURL: `${wrapper}/worker.js`,
			});
		} catch (e) {
			this.dispose();
			throw e;
		}
		return engine;
	}
	private async withFile<T>(
		file: File,
		options: ProcessingOptions,
		work: (engine: FFmpeg, input: string) => Promise<T>,
	): Promise<T> {
		if (file.size > LIMITS.ffmpegBytes)
			throw new Error("Compatibility and optimized GIF modes support files up to 128 MiB.");
		checkAbort(options.signal);
		if (this.busy) throw new Error("A compatibility job is already running.");
		this.busy = true;
		const abort = () => this.dispose();
		options.signal?.addEventListener("abort", abort, { once: true });
		let engine: FFmpeg | null = null;
		try {
			engine = await this.load(options);
			checkAbort(options.signal);
			progress(options, "Reading media…");
			await engine.writeFile("input", new Uint8Array(await file.arrayBuffer()));
			checkAbort(options.signal);
			const result = await work(engine, "input");
			checkAbort(options.signal);
			return result;
		} catch (e) {
			this.dispose();
			checkAbort(options.signal);
			throw e instanceof Error
				? e
				: new Error("The media engine stopped. Try a smaller file or another format.");
		} finally {
			options.signal?.removeEventListener("abort", abort);
			if (engine && engine === this.engine)
				for (const name of [
					"input",
					"output.mp4",
					"output.webm",
					"output.gif",
					"output.mp3",
					"output.wav",
					"output.flac",
					"probe.json",
				]) {
					try {
						await engine.deleteFile(name);
					} catch {
						/* Absent after an unsuccessful command. */
					}
				}
			this.options = {};
			this.busy = false;
		}
	}
	async probe(file: File, options: ProcessingOptions = {}): Promise<VideoInfo> {
		return this.withFile(file, options, async (engine, input) => {
			const code = await engine.ffprobe([
				"-v",
				"error",
				"-show_streams",
				"-show_format",
				"-of",
				"json",
				input,
				"-o",
				"probe.json",
			]);
			// Core 0.12.10 can leave ffprobe's return value at -1 on success; validate the JSON below.
			if (code !== 0 && code !== -1)
				throw new Error("This file's format is unsupported or damaged.");
			const data = await engine.readFile("probe.json", "utf8");
			const info = JSON.parse(data as string) as {
				streams: { codec_type: string; width?: number; height?: number; duration?: string }[];
				format: { duration?: string };
			};
			const video = info.streams.find((stream) => stream.codec_type === "video");
			if (!video) throw new Error("No video found in this file.");
			const duration = Number(info.format.duration ?? video.duration);
			if (!Number.isFinite(duration) || duration <= 0)
				throw new Error("Unable to read video duration.");
			return {
				duration,
				width: video.width ?? 0,
				height: video.height ?? 0,
				hasAudio: info.streams.some((stream) => stream.codec_type === "audio"),
			};
		});
	}
	async video(file: File, options: FfmpegVideoOptions): Promise<Blob> {
		if (options.format === "webm")
			throw new Error(
				"Compatibility mode cannot reliably encode WebM. Use native mode for VP9/Opus, or select MP4.",
			);
		return this.withFile(file, options, async (engine, input) => {
			const format = "mp4";
			const filename = `output.${format}`;
			const args = ["-i", input];
			if (options.start !== undefined) args.push("-ss", String(options.start));
			if (options.end !== undefined) {
				if (!(options.end > (options.start ?? 0)))
					throw new Error("Choose an end after the start.");
				args.push("-t", String(options.end - (options.start ?? 0)));
			}
			const side =
				options.resolution && options.resolution !== "original" ? Number(options.resolution) : null;
			if (side)
				args.push(
					"-vf",
					`scale='if(gte(iw,ih),-2,trunc(min(iw,${side})/2)*2)':'if(gte(iw,ih),trunc(min(ih,${side})/2)*2,-2)'`,
				);
			else args.push("-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2");
			const crf = { high: 20, balanced: 26, small: 31, tiny: 36 }[options.preset ?? "balanced"];
			args.push(
				"-map",
				"0:v:0",
				"-map",
				"0:a:0?",
				"-c:v",
				"libx264",
				"-threads",
				"1",
				"-crf",
				String(crf),
				"-pix_fmt",
				"yuv420p",
			);
			args.push("-preset", "veryfast", "-movflags", "+faststart");
			if (options.removeAudio) args.push("-an");
			else args.push("-c:a", "aac", "-b:a", "128k");
			await this.exec(engine, [...args, filename]);
			return this.output(engine, filename, `video/${format}`);
		});
	}
	async audio(
		file: File,
		format: "mp3" | "wav" | "flac",
		options: ProcessingOptions = {},
	): Promise<Blob> {
		return this.withFile(file, options, async (engine, input) => {
			const name = `output.${format}`;
			await this.exec(engine, [
				"-i",
				input,
				"-map",
				"0:a:0",
				"-vn",
				"-c:a",
				format === "mp3" ? "libmp3lame" : format === "wav" ? "pcm_s16le" : "flac",
				...(format === "mp3" ? ["-b:a", "192k"] : []),
				name,
			]);
			return this.output(engine, name, format === "mp3" ? "audio/mpeg" : `audio/${format}`);
		});
	}
	async gif(
		file: File,
		options: ProcessingOptions & { start: number; end: number; fps: number; width: number },
	): Promise<Blob> {
		if (
			!Number.isFinite(options.start) ||
			!Number.isFinite(options.end) ||
			options.start < 0 ||
			options.end <= options.start ||
			options.end - options.start > 15 ||
			options.width < 1 ||
			options.width > 720 ||
			options.fps < 1 ||
			options.fps > 24
		)
			throw new Error("Choose a GIF up to 15 seconds, 720 pixels wide and 24 FPS.");
		return this.withFile(file, options, async (engine, input) => {
			const filter = `fps=${options.fps},scale='min(${options.width},iw)':-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a`;
			await this.exec(engine, [
				"-ss",
				String(options.start),
				"-t",
				String(options.end - options.start),
				"-i",
				input,
				"-filter_complex",
				filter,
				"-loop",
				"0",
				"output.gif",
			]);
			return this.output(engine, "output.gif", "image/gif");
		});
	}
	private async exec(engine: FFmpeg, args: string[]) {
		progress(this.options, "Processing media…");
		if ((await engine.exec(args)) !== 0)
			throw new Error(
				"This file or codec couldn't be converted. Try a different input or output format.",
			);
	}
	private async output(engine: FFmpeg, name: string, mime: string) {
		const data = await engine.readFile(name);
		if (typeof data === "string" || !data.length)
			throw new Error("Media conversion produced no output.");
		return new Blob([data as BlobPart], { type: mime });
	}
}
