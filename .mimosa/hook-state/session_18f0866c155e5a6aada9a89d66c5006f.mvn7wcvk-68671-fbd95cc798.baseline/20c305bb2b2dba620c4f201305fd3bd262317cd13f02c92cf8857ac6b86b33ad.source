import {
	ALL_FORMATS,
	AudioBufferSource,
	BlobSource,
	BufferTarget,
	Conversion,
	canEncodeAudio,
	FlacOutputFormat,
	Input,
	Mp3OutputFormat,
	Mp4OutputFormat,
	Output,
	QUALITY_HIGH,
	QUALITY_LOW,
	QUALITY_MEDIUM,
	QUALITY_VERY_LOW,
	WavOutputFormat,
	WebMOutputFormat,
} from "mediabunny";
import { checkAbort, type ProcessingOptions } from "../processing";

export const VIDEO_PRESETS = {
	high: { label: "High quality", hint: "Smaller, looks the same", quality: QUALITY_HIGH },
	balanced: { label: "Balanced", hint: "Great for WhatsApp & email", quality: QUALITY_MEDIUM },
	small: { label: "Small", hint: "Much smaller, softer picture", quality: QUALITY_LOW },
	tiny: { label: "Tiny", hint: "Smallest possible", quality: QUALITY_VERY_LOW },
} as const;
export type VideoPreset = keyof typeof VIDEO_PRESETS;

export const RESOLUTIONS = {
	original: null,
	"1080": 1080,
	"720": 720,
	"480": 480,
	"360": 360,
} as const;
export type Resolution = keyof typeof RESOLUTIONS;

export function supportsWebCodecs(): boolean {
	return typeof window !== "undefined" && "VideoEncoder" in window;
}

export interface VideoInfo {
	duration: number;
	width: number;
	height: number;
	hasAudio: boolean;
}

export interface MediaBackendOptions {
	backend?: "native" | "compatibility";
	ffmpeg?: import("./ffmpeg").FFmpegSession;
	signal?: AbortSignal;
	onStatus?: ProcessingOptions["onProgress"];
}
async function compatibility<T>(
	options: MediaBackendOptions,
	work: (session: import("./ffmpeg").FFmpegSession, job: ProcessingOptions) => Promise<T>,
) {
	const session = options.ffmpeg ?? new (await import("./ffmpeg")).FFmpegSession();
	try {
		return await work(session, { signal: options.signal, onProgress: options.onStatus });
	} finally {
		if (!options.ffmpeg) session.dispose();
	}
}
export async function probeVideo(
	file: File,
	options: MediaBackendOptions = {},
): Promise<VideoInfo> {
	if (options.backend === "compatibility")
		return compatibility(options, (session, job) => session.probe(file, job));
	checkAbort(options.signal);
	const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
	try {
		const video = await input.getPrimaryVideoTrack();
		if (!video) throw new Error("No video found in this file.");
		const audio = await input.getPrimaryAudioTrack();
		return {
			duration: await input.computeDuration(),
			width: video.displayWidth,
			height: video.displayHeight,
			hasAudio: Boolean(audio),
		};
	} finally {
		input.dispose?.();
	}
}

export interface CompressVideoOptions extends MediaBackendOptions {
	format?: "mp4" | "webm";
	preset: VideoPreset;
	resolution: Resolution;
	removeAudio: boolean;
	onProgress?: (fraction: number) => void;
	signal?: AbortSignal;
}

/** Re-encode to H.264/AAC MP4 with WebCodecs (hardware accelerated where available). */
export async function compressVideo(file: File, options: CompressVideoOptions): Promise<Blob> {
	if (options.backend === "compatibility")
		return compatibility(options, (session, job) =>
			session.video(file, { ...options, ...job, onProgress: job.onProgress }),
		);
	checkAbort(options.signal);
	const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
	try {
		const output = new Output({
			format:
				options.format === "webm"
					? new WebMOutputFormat()
					: new Mp4OutputFormat({ fastStart: "in-memory" }),
			target: new BufferTarget(),
		});
		const maxSide = RESOLUTIONS[options.resolution];
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) throw new Error("No video found in this file.");
		const landscape = videoTrack.displayWidth >= videoTrack.displayHeight;
		const shortSide = Math.min(videoTrack.displayWidth, videoTrack.displayHeight);
		const resize =
			maxSide && shortSide > maxSide ? (landscape ? { height: maxSide } : { width: maxSide }) : {};

		await ensureAudioEncoder(options.format === "webm" ? "opus" : "aac");
		const conversion = await Conversion.init({
			input,
			output,
			tracks: "primary",
			video: {
				codec: options.format === "webm" ? "vp9" : "avc",
				quality: VIDEO_PRESETS[options.preset].quality,
				forceTranscode: true,
				...resize,
			},
			audio: options.removeAudio
				? { discard: true }
				: { codec: options.format === "webm" ? "opus" : "aac", quality: QUALITY_MEDIUM },
			showWarnings: false,
		});
		if (
			!conversion.isValid ||
			conversion.discardedTracks.some((track) => track.reason !== "discarded_by_user")
		) {
			throw new Error(
				"Your browser can't convert this video. Try the latest Chrome, Edge or Safari, or a different file.",
			);
		}
		await executeConversion(conversion, input, {
			...options,
			onProgress: (fraction) => {
				options.onProgress?.(fraction);
				options.onStatus?.({ stage: "processing", fraction, label: "Processing video…" });
			},
		});
		const buffer = output.target.buffer;
		if (!buffer) throw new Error("Compression failed.");
		return new Blob([buffer], { type: options.format === "webm" ? "video/webm" : "video/mp4" });
	} finally {
		input.dispose();
	}
}

/** Capture one frame as a canvas (used by the thumbnail maker). */
export async function grabVideoFrame(file: File, atSeconds: number): Promise<HTMLCanvasElement> {
	const url = URL.createObjectURL(file);
	try {
		const video = document.createElement("video");
		video.muted = true;
		video.playsInline = true;
		video.preload = "auto";
		video.src = url;
		await new Promise<void>((resolve, reject) => {
			video.onloadeddata = () => resolve();
			video.onerror = () => reject(new Error("This video couldn't be opened."));
		});
		video.currentTime = Math.min(Math.max(0, atSeconds), Math.max(0, video.duration - 0.05));
		await new Promise<void>((resolve) => {
			video.onseeked = () => resolve();
		});
		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext("2d")?.drawImage(video, 0, 0);
		return canvas;
	} finally {
		URL.revokeObjectURL(url);
	}
}

/* ----------------------------- Audio ----------------------------- */

export async function decodeAudio(file: File): Promise<AudioBuffer> {
	const ctx = new AudioContext();
	try {
		return await ctx.decodeAudioData(await file.arrayBuffer());
	} catch {
		throw new Error("This audio file couldn't be opened. Try MP3, WAV, M4A or OGG.");
	} finally {
		void ctx.close();
	}
}

/** Copy [start, end) seconds with linear fade in/out. */
export function trimAudioBuffer(
	buffer: AudioBuffer,
	start: number,
	end: number,
	fadeIn: number,
	fadeOut: number,
): AudioBuffer {
	const rate = buffer.sampleRate;
	const from = Math.max(0, Math.floor(start * rate));
	const to = Math.min(buffer.length, Math.ceil(end * rate));
	const length = Math.max(1, to - from);
	const out = new AudioBuffer({
		length,
		numberOfChannels: buffer.numberOfChannels,
		sampleRate: rate,
	});
	const fadeInLen = Math.min(length, Math.floor(fadeIn * rate));
	const fadeOutLen = Math.min(length, Math.floor(fadeOut * rate));
	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		const src = buffer.getChannelData(ch).subarray(from, to);
		const dst = out.getChannelData(ch);
		dst.set(src);
		for (let i = 0; i < fadeInLen; i++) dst[i] = (dst[i] ?? 0) * (i / fadeInLen);
		for (let i = 0; i < fadeOutLen; i++) {
			const j = length - 1 - i;
			dst[j] = (dst[j] ?? 0) * (i / fadeOutLen);
		}
	}
	return out;
}

/** 16-bit PCM WAV. */
export function encodeWav(buffer: AudioBuffer): Blob {
	const channels = buffer.numberOfChannels;
	const rate = buffer.sampleRate;
	const frames = buffer.length;
	const dataSize = frames * channels * 2;
	const view = new DataView(new ArrayBuffer(44 + dataSize));
	const write = (offset: number, text: string) => {
		for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
	};
	write(0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	write(8, "WAVE");
	write(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, channels, true);
	view.setUint32(24, rate, true);
	view.setUint32(28, rate * channels * 2, true);
	view.setUint16(32, channels * 2, true);
	view.setUint16(34, 16, true);
	write(36, "data");
	view.setUint32(40, dataSize, true);
	const data = Array.from({ length: channels }, (_, ch) => buffer.getChannelData(ch));
	let offset = 44;
	for (let i = 0; i < frames; i++) {
		for (let ch = 0; ch < channels; ch++) {
			const s = Math.max(-1, Math.min(1, data[ch]?.[i] ?? 0));
			view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
			offset += 2;
		}
	}
	return new Blob([view.buffer], { type: "audio/wav" });
}

export async function encodeMp3(
	buffer: AudioBuffer,
	bitrate = 192_000,
	options: ProcessingOptions = {},
): Promise<Blob> {
	checkAbort(options.signal);
	await ensureAudioEncoder("mp3");
	const output = new Output({ format: new Mp3OutputFormat(), target: new BufferTarget() });
	const source = new AudioBufferSource({ codec: "mp3", bitrate });
	output.addAudioTrack(source);
	const abort = () => {
		void output.cancel().catch(() => {});
	};
	options.signal?.addEventListener("abort", abort, { once: true });
	try {
		checkAbort(options.signal);
		await output.start();
		await source.add(buffer);
		await output.finalize();
		checkAbort(options.signal);
		const data = output.target.buffer;
		if (!data) throw new Error("MP3 encoding failed.");
		return new Blob([data], { type: "audio/mpeg" });
	} finally {
		options.signal?.removeEventListener("abort", abort);
	}
}

export function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = seconds - m * 60;
	return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

export interface TrimVideoOptions extends MediaBackendOptions {
	start: number;
	end: number;
	onProgress?: (fraction: number) => void;
	signal?: AbortSignal;
}

/**
 * Trims a video file between start and end timestamps.
 */
export async function trimVideo(file: File, options: TrimVideoOptions): Promise<Blob> {
	if (options.backend === "compatibility")
		return compatibility(options, (session, job) =>
			session.video(file, { ...job, start: options.start, end: options.end, preset: "high" }),
		);
	checkAbort(options.signal);
	const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
	try {
		const output = new Output({
			format: new Mp4OutputFormat({ fastStart: "in-memory" }),
			target: new BufferTarget(),
		});

		await ensureAudioEncoder("aac");
		const conversion = await Conversion.init({
			input,
			output,
			tracks: "primary",
			trim: {
				start: options.start,
				end: options.end,
			},
			video: {
				codec: "avc",
				quality: QUALITY_HIGH,
			},
			audio: { codec: "aac", quality: QUALITY_MEDIUM },
			showWarnings: false,
		});

		if (
			!conversion.isValid ||
			conversion.discardedTracks.some((track) => track.reason !== "discarded_by_user")
		) {
			throw new Error("Unable to trim this video in your browser. Please try another file.");
		}

		await executeConversion(conversion, input, {
			...options,
			onProgress: (fraction) => {
				options.onProgress?.(fraction);
				options.onStatus?.({ stage: "processing", fraction, label: "Processing video…" });
			},
		});
		const buffer = output.target.buffer;
		if (!buffer) throw new Error("Video trimming failed.");
		return new Blob([buffer], { type: "video/mp4" });
	} finally {
		input.dispose();
	}
}

/**
 * Extracts audio track from any video file to MP3 or uncompressed WAV.
 */
export type AudioFormat = "mp3" | "wav" | "flac";
export async function extractAudioFromVideo(
	file: File,
	format: AudioFormat = "mp3",
	onProgress?: (fraction: number) => void,
	options: ProcessingOptions & MediaBackendOptions = {},
): Promise<Blob> {
	if (options.backend === "compatibility")
		return compatibility({ ...options, onStatus: options.onProgress }, (session, job) =>
			session.audio(file, format, job),
		);
	checkAbort(options.signal);
	await ensureAudioEncoder(format === "wav" ? "pcm-s16" : format);
	const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
	try {
		if (!(await input.getPrimaryAudioTrack())) throw new Error("This video has no audio track.");
		const output = new Output({
			format:
				format === "wav"
					? new WavOutputFormat()
					: format === "flac"
						? new FlacOutputFormat()
						: new Mp3OutputFormat(),
			target: new BufferTarget(),
		});
		const conversion = await Conversion.init({
			input,
			output,
			tracks: "primary",
			video: { discard: true },
			audio: {
				codec: format === "wav" ? "pcm-s16" : format,
				...(format === "mp3" ? { bitrate: 192_000 } : {}),
			},
			showWarnings: false,
		});
		if (
			!conversion.isValid ||
			conversion.discardedTracks.some((track) => track.track.type === "audio")
		)
			throw new Error("Your browser cannot decode this audio codec. Try Compatibility mode.");
		await executeConversion(conversion, input, {
			signal: options.signal,
			onProgress: (fraction) => {
				onProgress?.(fraction);
				options.onProgress?.({ stage: "processing", fraction, label: "Extracting audio…" });
			},
		});
		const data = output.target.buffer;
		if (!data) throw new Error("Audio extraction failed.");
		return new Blob([data], { type: format === "mp3" ? "audio/mpeg" : `audio/${format}` });
	} finally {
		input.dispose();
	}
}
export async function encodeFlac(
	buffer: AudioBuffer,
	options: ProcessingOptions = {},
): Promise<Blob> {
	checkAbort(options.signal);
	await ensureAudioEncoder("flac");
	const output = new Output({ format: new FlacOutputFormat(), target: new BufferTarget() });
	const source = new AudioBufferSource({ codec: "flac" });
	output.addAudioTrack(source);
	const abort = () => {
		void output.cancel().catch(() => {});
	};
	options.signal?.addEventListener("abort", abort, { once: true });
	try {
		checkAbort(options.signal);
		await output.start();
		await source.add(buffer);
		await output.finalize();
		checkAbort(options.signal);
		const data = output.target.buffer;
		if (!data) throw new Error("FLAC encoding failed.");
		return new Blob([data], { type: "audio/flac" });
	} finally {
		options.signal?.removeEventListener("abort", abort);
	}
}
const encoders = new Map<string, Promise<void>>();
export async function ensureAudioEncoder(codec: "mp3" | "aac" | "flac" | "opus" | "pcm-s16") {
	if (await canEncodeAudio(codec)) return;
	if (codec === "opus" || codec === "pcm-s16") return;
	if (!encoders.has(codec))
		encoders.set(
			codec,
			(async () => {
				if (codec === "aac") (await import("@mediabunny/aac-encoder")).registerAacEncoder();
				else if (codec === "flac") (await import("@mediabunny/flac-encoder")).registerFlacEncoder();
				else (await import("@mediabunny/mp3-encoder")).registerMp3Encoder();
			})().catch((e) => {
				encoders.delete(codec);
				throw e;
			}),
		);
	await encoders.get(codec);
}
async function executeConversion(
	conversion: Conversion,
	input: Input,
	options: { signal?: AbortSignal; onProgress?: (fraction: number) => void },
) {
	const abort = () => {
		void conversion.cancel().catch(() => {});
	};
	options.signal?.addEventListener("abort", abort, { once: true });
	conversion.onProgress = (p) => {
		if (!options.signal?.aborted) options.onProgress?.(p);
	};
	try {
		checkAbort(options.signal);
		await conversion.execute();
		checkAbort(options.signal);
	} finally {
		options.signal?.removeEventListener("abort", abort);
		input.dispose();
	}
}

import { applyPalette, GIFEncoder, quantize } from "gifenc";

export interface VideoToGifOptions extends MediaBackendOptions {
	mode?: "fast" | "optimized";
	worker?: {
		run<T>(
			operation: string,
			payload: unknown,
			options?: ProcessingOptions,
			transfer?: Transferable[],
		): Promise<T>;
	};
	start: number;
	end: number;
	fps?: number;
	width?: number;
	onProgress?: (fraction: number) => void;
	signal?: AbortSignal;
}

/**
 * Converts a segment of video into an animated GIF client-side.
 */
export async function videoToGif(file: File, options: VideoToGifOptions): Promise<Blob> {
	if (options.mode === "optimized" || options.backend === "compatibility")
		return compatibility(options, (session, job) =>
			session.gif(file, {
				...job,
				start: options.start,
				end: options.end,
				fps: options.fps ?? 12,
				width: options.width ?? 480,
			}),
		);
	if (
		options.end - options.start > 15 ||
		options.end <= options.start ||
		options.start < 0 ||
		(options.width ?? 480) > 720 ||
		(options.fps ?? 12) > 24
	)
		throw new Error("Choose a GIF up to 15 seconds, 720 pixels wide and 24 FPS.");
	checkAbort(options.signal);
	const fps = options.fps || 12;
	const delay = Math.round(1000 / fps);
	const start = Math.max(0, options.start);
	const end = Math.max(start + 0.1, options.end);
	const duration = end - start;
	const totalFrames = Math.max(1, Math.floor(duration * fps));

	const url = URL.createObjectURL(file);
	try {
		const video = document.createElement("video");
		video.muted = true;
		video.playsInline = true;
		video.preload = "auto";
		video.src = url;

		await new Promise<void>((resolve, reject) => {
			video.onloadeddata = () => resolve();
			video.onerror = () => reject(new Error("Unable to load video for GIF conversion."));
		});

		const origWidth = video.videoWidth || 640;
		const origHeight = video.videoHeight || 360;
		const targetWidth = options.width
			? Math.min(options.width, origWidth)
			: Math.min(480, origWidth);
		const targetHeight = Math.round((origHeight / origWidth) * targetWidth);

		const canvas = document.createElement("canvas");
		canvas.width = targetWidth;
		canvas.height = targetHeight;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) throw new Error("Could not create canvas context.");

		const gif = options.worker ? null : GIFEncoder();
		if (options.worker) await options.worker.run("gif-start", null, { signal: options.signal });

		for (let i = 0; i < totalFrames; i++) {
			checkAbort(options.signal);
			const time = start + i / fps;
			video.currentTime = Math.min(time, video.duration - 0.05);

			await new Promise<void>((resolve, reject) => {
				if (Math.abs(video.currentTime - time) < 0.001 && !video.seeking) {
					resolve();
					return;
				}
				const abort = () => {
					clearTimeout(timer);
					reject(new DOMException("Cancelled", "AbortError"));
				};
				const timer = setTimeout(() => {
					options.signal?.removeEventListener("abort", abort);
					reject(new Error("Unable to seek this video."));
				}, 15_000);
				options.signal?.addEventListener("abort", abort, { once: true });
				video.onseeked = () => {
					clearTimeout(timer);
					options.signal?.removeEventListener("abort", abort);
					resolve();
				};
			});

			ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
			const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
			if (options.worker)
				await options.worker.run(
					"gif-frame",
					{ data: imgData.data, width: targetWidth, height: targetHeight, delay },
					{ signal: options.signal },
					[imgData.data.buffer as ArrayBuffer],
				);
			else if (gif) {
				const palette = quantize(imgData.data, 256);
				const index = applyPalette(imgData.data, palette);
				gif.writeFrame(index, targetWidth, targetHeight, { palette, delay });
			}

			options.onProgress?.((i + 1) / totalFrames);
		}

		if (options.worker)
			return await options.worker.run<Blob>("gif-finish", null, { signal: options.signal });
		if (!gif) throw new Error("GIF encoder unavailable.");
		gif.finish();
		const bytes = gif.bytes();
		return new Blob([bytes as unknown as BlobPart], { type: "image/gif" });
	} finally {
		URL.revokeObjectURL(url);
	}
}
