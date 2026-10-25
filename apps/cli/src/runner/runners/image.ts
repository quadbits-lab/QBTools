/**
 * Image runners on sharp: compress, resize, convert. The web app does these
 * in-browser via canvas; headless uses native sharp with the same option
 * surface. sharp is optional — missing installs surface as exit code 2 with
 * an install hint.
 */

import * as native from "../../services/image-native";
import { formatBytes, writeOutput } from "../files";
import { files, num, requireString, str, type ToolRunner } from "../types";

type Format = "jpeg" | "png" | "webp" | "avif";
const FORMATS: Format[] = ["jpeg", "png", "webp", "avif"];

function pickFormat(value: string, fallback: Format): Format {
	const trimmed = value.trim().toLowerCase();
	return (FORMATS as string[]).includes(trimmed) ? (trimmed as Format) : fallback;
}

async function singleInput(values: Record<string, unknown>): Promise<File> {
	const [input] = files(values, "in");
	if (!input) throw new Error("Provide an image via --in <file>.");
	return input;
}

export const compressImageRunner: ToolRunner = {
	slug: "compress-image",
	availability: "sharp",
	fields: [
		{
			name: "in",
			label: "Image file",
			kind: "file",
			required: true,
			accept: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
		},
		{
			name: "format",
			label: "Output format",
			kind: "select",
			default: "webp",
			options: FORMATS.map((format) => ({ label: format.toUpperCase(), value: format })),
		},
		{ name: "quality", label: "Quality (1–100)", kind: "number", default: 80, min: 1, max: 100 },
		{ name: "maxEdge", label: "Max long edge (px, empty = keep)", kind: "number" },
	],
	async run({ values, outDir, outPath, onProgress }) {
		const input = await singleInput(values);
		onProgress?.(native.progressFor("Encoding…"));
		const result = await native.compressImage(input, {
			format: pickFormat(str(values, "format", "webp"), "webp"),
			quality: num(values, "quality", 80),
			maxEdge: num(values, "maxEdge", 0) || undefined,
		});
		const base = input.name.replace(/\.[a-z0-9]+$/i, "");
		const ext = result.mimeType.replace("image/", "").replace("jpeg", "jpg");
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: `${base}-compressed.${ext}` },
			result.bytes,
		);
		const savedPct = Math.round((1 - result.bytes.byteLength / Math.max(1, input.size)) * 100);
		return {
			summary: `${formatBytes(input.size)} → ${formatBytes(result.bytes.byteLength)} (−${savedPct}%) · ${result.width}×${result.height} → ${saved.path}`,
			outputs: [
				{
					type: "image",
					bytes: result.bytes,
					mimeType: result.mimeType,
					suggestedName: `${base}-compressed.${ext}`,
				},
			],
			data: { path: saved.path, width: result.width, height: result.height },
		};
	},
};

export const resizeImageRunner: ToolRunner = {
	slug: "resize-image",
	availability: "sharp",
	fields: [
		{
			name: "in",
			label: "Image file",
			kind: "file",
			required: true,
			accept: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
		},
		{ name: "width", label: "Width (px)", kind: "number" },
		{ name: "height", label: "Height (px)", kind: "number" },
		{
			name: "fit",
			label: "Fit",
			kind: "select",
			default: "inside",
			options: [
				{ label: "Inside (fit within)", value: "inside" },
				{ label: "Cover (crop)", value: "cover" },
				{ label: "Contain (pad)", value: "contain" },
				{ label: "Fill (stretch)", value: "fill" },
			],
		},
		{
			name: "format",
			label: "Output format",
			kind: "select",
			default: "png",
			options: FORMATS.map((format) => ({ label: format.toUpperCase(), value: format })),
		},
		{
			name: "quality",
			label: "Quality (lossy formats)",
			kind: "number",
			default: 85,
			min: 1,
			max: 100,
		},
	],
	async run({ values, outDir, outPath, onProgress }) {
		const input = await singleInput(values);
		const width = num(values, "width", 0);
		const height = num(values, "height", 0);
		if (!width && !height) throw new Error("Set a width, a height, or both.");
		onProgress?.(native.progressFor("Resizing…"));
		const result = await native.resizeImage(input, {
			width: width || undefined,
			height: height || undefined,
			fit: str(values, "fit", "inside") as "cover" | "contain" | "inside" | "fill",
			format: pickFormat(str(values, "format", "png"), "png"),
			quality: num(values, "quality", 85),
		});
		const base = input.name.replace(/\.[a-z0-9]+$/i, "");
		const ext = result.mimeType.replace("image/", "").replace("jpeg", "jpg");
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: `${base}-${result.width}x${result.height}.${ext}` },
			result.bytes,
		);
		return {
			summary: `${result.width}×${result.height} (${formatBytes(result.bytes.byteLength)}) → ${saved.path}`,
			outputs: [
				{
					type: "image",
					bytes: result.bytes,
					mimeType: result.mimeType,
					suggestedName: `${base}-${result.width}x${result.height}.${ext}`,
				},
			],
			data: { path: saved.path, width: result.width, height: result.height },
		};
	},
};

export const convertImageRunner: ToolRunner = {
	slug: "convert-image",
	availability: "sharp",
	fields: [
		{
			name: "in",
			label: "Image file",
			kind: "file",
			required: true,
			accept: [".jpg", ".jpeg", ".png", ".webp", ".avif", ".tiff", ".gif"],
		},
		{
			name: "format",
			label: "Convert to",
			kind: "select",
			default: "png",
			options: FORMATS.map((format) => ({ label: format.toUpperCase(), value: format })),
		},
		{
			name: "quality",
			label: "Quality (lossy formats)",
			kind: "number",
			default: 90,
			min: 1,
			max: 100,
		},
	],
	async run({ values, outDir, outPath, onProgress }) {
		const input = await singleInput(values);
		const format = pickFormat(requireString(values, "format", "target format"), "png");
		onProgress?.(native.progressFor("Converting…"));
		const result = await native.convertImage(input, format, num(values, "quality", 90));
		const base = input.name.replace(/\.[a-z0-9]+$/i, "");
		const ext = result.mimeType.replace("image/", "").replace("jpeg", "jpg");
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: `${base}.${ext}` },
			result.bytes,
		);
		return {
			summary: `${input.name} → ${format.toUpperCase()} (${formatBytes(result.bytes.byteLength)}) → ${saved.path}`,
			outputs: [
				{
					type: "image",
					bytes: result.bytes,
					mimeType: result.mimeType,
					suggestedName: `${base}.${ext}`,
				},
			],
			data: { path: saved.path, width: result.width, height: result.height },
		};
	},
};

export const imageRunners: ToolRunner[] = [
	compressImageRunner,
	resizeImageRunner,
	convertImageRunner,
];
