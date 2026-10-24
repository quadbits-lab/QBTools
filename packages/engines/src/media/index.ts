import {
	ALL_FORMATS,
	AudioBufferSource,
	BlobSource,
	BufferTarget,
	Conversion,
	canEncodeAudio,
	Input,
	Mp3OutputFormat,
	Mp4OutputFormat,
	Output,
	QUALITY_HIGH,
	QUALITY_LOW,
	QUALITY_MEDIUM,
	QUALITY_VERY_LOW,
} from "mediabunny";

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
	return typeof window !== "undefined" && "VideoEncoder" in window && "AudioEncoder" in window;
}

export interface VideoInfo {
	duration: number;
	width: number;
	height: number;
	hasAudio: boolean;
}

export async function probeVideo(file: File): Promise<VideoInfo> {
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

export interface CompressVideoOptions {
	preset: VideoPreset;
	resolution: Resolution;
	removeAudio: boolean;
	onProgress?: (fraction: number) => void;
	signal?: AbortSignal;
}

/** Re-encode to H.264/AAC MP4 with WebCodecs (hardware accelerated where available). */
export async function compressVideo(file: File, options: CompressVideoOptions): Promise<Blob> {
	const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
	const output = new Output({
		format: new Mp4OutputFormat({ fastStart: "in-memory" }),
		target: new BufferTarget(),
	});
	const maxSide = RESOLUTIONS[options.resolution];
	const videoTrack = await input.getPrimaryVideoTrack();
	if (!videoTrack) throw new Error("No video found in this file.");
	const landscape = videoTrack.displayWidth >= videoTrack.displayHeight;
	const shortSide = Math.min(videoTrack.displayWidth, videoTrack.displayHeight);
	const resize =
		maxSide && shortSide > maxSide ? (landscape ? { height: maxSide } : { width: maxSide }) : {};

	const conversion = await Conversion.init({
		input,
		output,
		tracks: "primary",
		video: {
			codec: "avc",
			quality: VIDEO_PRESETS[options.preset].quality,
			forceTranscode: true,
			...resize,
		},
		audio: options.removeAudio ? { discard: true } : { codec: "aac", quality: QUALITY_MEDIUM },
		showWarnings: false,
	});
	if (!conversion.isValid) {
		throw new Error(
			"Your browser can't convert this video. Try the latest Chrome, Edge or Safari, or a different file.",
		);
	}
	conversion.onProgress = (p) => options.onProgress?.(p);
	options.signal?.addEventListener("abort", () => void conversion.cancel());
	await conversion.execute();
	const buffer = output.target.buffer;
	if (!buffer) throw new Error("Compression failed.");
	return new Blob([buffer], { type: "video/mp4" });
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

export async function encodeMp3(buffer: AudioBuffer, bitrate = 192_000): Promise<Blob> {
	if (!(await canEncodeAudio("mp3"))) {
		const { registerMp3Encoder } = await import("@mediabunny/mp3-encoder");
		registerMp3Encoder();
	}
	const output = new Output({ format: new Mp3OutputFormat(), target: new BufferTarget() });
	const source = new AudioBufferSource({ codec: "mp3", bitrate });
	output.addAudioTrack(source);
	await output.start();
	await source.add(buffer);
	await output.finalize();
	const data = output.target.buffer;
	if (!data) throw new Error("MP3 encoding failed.");
	return new Blob([data], { type: "audio/mpeg" });
}

export function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = seconds - m * 60;
	return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}
