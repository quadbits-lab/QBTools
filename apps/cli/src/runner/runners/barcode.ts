/** Barcode runner: generation works headless; scanning needs sharp (Phase 5). */

import { checkAbort } from "@qbtools/engines/processing";
import { writeOutput } from "../files";
import { files, num, requireString, str, type ToolRunner, UnavailableError } from "../types";

const FORMATS = [
	"QRCode",
	"Code128",
	"Code39",
	"EAN13",
	"EAN8",
	"UPCA",
	"UPCE",
	"ITF",
	"Codabar",
	"Aztec",
	"DataMatrix",
	"PDF417",
] as const;

export const barcodeRunner: ToolRunner = {
	slug: "barcode-scanner",
	availability: "local",
	fields: [
		{
			name: "mode",
			label: "Action",
			kind: "select",
			default: "generate",
			options: [
				{ label: "Generate a barcode", value: "generate" },
				{ label: "Scan an image", value: "scan" },
			],
		},
		{ name: "text", label: "Text to encode", kind: "text" },
		{
			name: "format",
			label: "Barcode format",
			kind: "select",
			default: "QRCode",
			options: FORMATS.map((format) => ({ label: format, value: format })),
		},
		{
			name: "scale",
			label: "Pixels per module (1–16)",
			kind: "number",
			default: 4,
			min: 1,
			max: 16,
		},
		{ name: "showText", label: "Print text under linear barcodes", kind: "boolean", default: true },
		{
			name: "in",
			label: "Image to scan (scan mode)",
			kind: "file",
			accept: [".png", ".jpg", ".jpeg", ".webp"],
		},
	],
	async run({ values, outDir, outPath, onProgress, signal }) {
		const mode = str(values, "mode", "generate");
		if (mode === "scan") {
			const [input] = files(values, "in");
			if (!input) throw new Error("Provide an image via --in <file> for scanning.");
			// Scanning needs image decoding (sharp) — wired in the sharp phase.
			throw new UnavailableError(
				"sharp",
				"Barcode scanning needs the optional sharp dependency. Install it with `bun add sharp` (or use the web app).",
			);
		}
		const { writeBarcodeImage } = await import("@qbtools/engines/barcode");
		const text = requireString(values, "text", "text to encode");
		onProgress?.({ stage: "loading", fraction: null, label: "Rendering barcode…" });
		const image = await writeBarcodeImage(text, {
			format: str(values, "format", "QRCode") as never,
			scale: num(values, "scale", 4),
			showText: values.showText !== false,
		});
		checkAbort(signal);
		const stem =
			text
				.replace(/[^a-z0-9]+/gi, "-")
				.slice(0, 32)
				.replace(/^-+|-+$/g, "") || "barcode";
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: `${stem}.png` },
			new Uint8Array(await image.png.arrayBuffer()),
		);
		return {
			summary: `Barcode saved to ${saved.path}`,
			outputs: [
				{
					type: "image",
					bytes: new Uint8Array(await image.png.arrayBuffer()),
					mimeType: "image/png",
					suggestedName: `${stem}.png`,
				},
			],
			data: { path: saved.path, format: str(values, "format", "QRCode") },
		};
	},
};
