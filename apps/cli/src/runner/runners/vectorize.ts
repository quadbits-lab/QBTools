/** Image runners: PNG → SVG vectorization (headless vtracer path). */

import { files, str, type ToolRunner } from "../types";
import { writeOutput } from "../files";
import type { VectorizePreset } from "@qbtools/engines/vectorize";

const PRESETS: VectorizePreset[] = ["logo", "bw", "photo", "poster", "pixel"];

export const pngToSvg: ToolRunner = {
	slug: "png-to-svg",
	availability: "local",
	fields: [
		{ name: "in", label: "Image (PNG/JPEG/WebP)", kind: "file", required: true, accept: [".png", ".jpg", ".jpeg", ".webp"] },
		{
			name: "preset",
			label: "Preset",
			kind: "select",
			default: "logo",
			options: PRESETS.map((preset) => ({ label: preset, value: preset })),
		},
	],
	async run({ values, outDir, outPath, onProgress, signal }) {
		const { vectorizeBytes } = await import("@qbtools/engines/vectorize");
		const [input] = files(values, "in");
		if (!input) throw new Error("Provide an image via --in <file>.");
		const preset = str(values, "preset", "logo") as VectorizePreset;
		const bytes = new Uint8Array(await input.arrayBuffer());
		const result = await vectorizeBytes(bytes, { preset, onProgress, signal });
		const base = input.name.replace(/\.[a-z0-9]+$/i, "");
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: `${base}.svg` },
			new TextEncoder().encode(result.svg),
		);
		return {
			summary: `${result.pathsCount} paths · ${result.colorsCount} colours · ${result.durationMs.toFixed(0)} ms → ${saved.path}`,
			outputs: [],
			data: {
				path: saved.path,
				paths: result.pathsCount,
				colors: result.colorsCount,
				durationMs: result.durationMs,
			},
		};
	},
};
