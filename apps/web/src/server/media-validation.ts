import { fileTypeFromBuffer } from "file-type";
import { MEDIA_ACCEPT } from "../lib/media-contract";

export class MediaError extends Error {
	constructor(public code: string, message: string, public status = 400) { super(message); }
}
export function validateFilename(name: string) {
	if (!name || name.length > 200 || /[\x00-\x1f\x7f/\\]/.test(name) || name !== name.trim() || !name.includes(".")) throw new MediaError("INVALID_NAME", "Use a filename of 1–200 characters with an extension and no path separators.");
	const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
	if (!MEDIA_ACCEPT.split(",").includes(ext)) throw new MediaError("UNSUPPORTED_TYPE", "This file type is not supported in Media Storage.", 415);
	return ext;
}
export async function validateContent(name: string, bytes: Uint8Array) {
	const ext = validateFilename(name);
	if (ext === ".enc") {
		if (new TextDecoder().decode(bytes.subarray(0, 6)) !== "QBENC1") throw new MediaError("INVALID_CONTENT", "This is not a QBTools encrypted file.", 415);
		return "application/octet-stream";
	}
	if ([".txt", ".json", ".svg"].includes(ext)) {
		let text: string;
		try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes, { stream: true }); }
		catch { throw new MediaError("INVALID_CONTENT", "Expected UTF-8 text.", 415); }
		if (/[\x00-\x08\x0e-\x1f]/.test(text)) throw new MediaError("INVALID_CONTENT", "This file contains binary data.", 415);
		if (ext === ".svg" && !/<svg[\s>]/i.test(text)) throw new MediaError("INVALID_CONTENT", "Expected an SVG document.", 415);
		if (ext === ".json" && !/^[\s\uFEFF]*[\[{]/.test(text)) throw new MediaError("INVALID_CONTENT", "Expected a JSON object or array.", 415);
		return ext === ".svg" ? "image/svg+xml" : ext === ".json" ? "application/json" : "text/plain";
	}
	const detected = await fileTypeFromBuffer(bytes);
	const aliases: Record<string, string[]> = { ".jpg": ["jpg"], ".jpeg": ["jpg"], ".heic": ["heic","heif"], ".heif": ["heic","heif"], ".m4a": ["m4a","mp4"], ".aac": ["aac"], ".ogg": ["ogg","oga","opus","ogv"], ".webm": ["webm","mkv"] };
	if (!detected || !(aliases[ext] ?? [ext.slice(1)]).includes(detected.ext)) throw new MediaError("INVALID_CONTENT", "The file contents do not match its extension.", 415);
	return detected.mime;
}
export function parseRange(value: string | null, size: number) {
	if (!value) return null;
	const match = /^bytes=(\d*)-(\d*)$/.exec(value);
	if (!match || (!match[1] && !match[2])) throw new MediaError("INVALID_RANGE", "Invalid byte range.", 416);
	const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
	const end = match[1] && match[2] ? Number(match[2]) : size - 1;
	if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) throw new MediaError("INVALID_RANGE", "Range is outside the file.", 416);
	return { start, end: Math.min(end, size - 1) };
}
