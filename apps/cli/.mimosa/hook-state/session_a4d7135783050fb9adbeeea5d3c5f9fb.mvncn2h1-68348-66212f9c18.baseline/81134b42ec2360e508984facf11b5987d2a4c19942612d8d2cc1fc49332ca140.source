/** PDF runners: merge, split, watermark, image-to-pdf, compress, protect. */

import { files, num, requireString, str, type ToolRunner } from "../types";
import { formatBytes, readInputFiles, writeOutput } from "../files";

function pdfMime(name: string): string {
	return name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
}

export const mergePdf: ToolRunner = {
	slug: "merge-pdf",
	availability: "local",
	fields: [
		{
			name: "in",
			label: "PDF files to merge (in order)",
			kind: "files",
			required: true,
			accept: [".pdf"],
		},
	],
	async run({ values, outDir, outPath, onProgress }) {
		const { mergePdfs } = await import("@qbtools/engines/pdf");
		const inputs = files(values, "in");
		if (inputs.length < 2) throw new Error("Merging needs at least two PDFs.");
		const blob = await mergePdfs(inputs, (done) =>
			onProgress?.({ stage: "processing", fraction: done / inputs.length, label: `Merged ${done}/${inputs.length}` }),
		);
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: "merged.pdf" },
			new Uint8Array(await blob.arrayBuffer()),
		);
		return {
			summary: `Merged ${inputs.length} PDFs (${formatBytes(saved.bytes)}) → ${saved.path}`,
			outputs: [{ type: "file", bytes: new Uint8Array(await blob.arrayBuffer()), suggestedName: "merged.pdf", mimeType: pdfMime(saved.path) }],
			data: { path: saved.path, count: inputs.length, bytes: saved.bytes },
		};
	},
};

export const splitPdf: ToolRunner = {
	slug: "split-pdf",
	availability: "local",
	fields: [
		{ name: "in", label: "PDF file", kind: "file", required: true, accept: [".pdf"] },
		{
			name: "mode",
			label: "Split mode",
			kind: "select",
			default: "every",
			options: [
				{ label: "One PDF per page", value: "every" },
				{ label: "Extract a page range", value: "ranges" },
			],
		},
		{ name: "ranges", label: "Page ranges (ranges mode)", kind: "text", placeholder: "1-3, 5" },
	],
	async run({ values, outDir, onProgress }) {
		const { splitPdf: split } = await import("@qbtools/engines/pdf");
		const [input] = files(values, "in");
		if (!input) throw new Error("Provide a PDF via --in <file>.");
		const mode =
			str(values, "mode", "every") === "ranges"
				? { kind: "ranges" as const, ranges: requireString(values, "ranges", "page ranges") }
				: { kind: "every" as const };
		onProgress?.({ stage: "processing", fraction: null, label: "Splitting…" });
		const results = await split(input, mode);
		const written: { path: string; size: number }[] = [];
		for (const part of results) {
			const saved = await writeOutput(
				{ outDir, suggestedName: part.name },
				new Uint8Array(await part.blob.arrayBuffer()),
			);
			written.push({ path: saved.path, size: saved.bytes });
		}
		return {
			summary: `Split into ${written.length} file${written.length > 1 ? "s" : ""} in ${outDir}`,
			outputs: [
				{
					type: "table",
					columns: ["File", "Size"],
					rows: written.map((file) => [file.path, formatBytes(file.size)]),
				},
			],
			data: { files: written },
		};
	},
};

export const watermarkPdfRunner: ToolRunner = {
	slug: "watermark-pdf",
	availability: "local",
	fields: [
		{ name: "in", label: "PDF file", kind: "file", required: true, accept: [".pdf"] },
		{ name: "text", label: "Watermark text", kind: "text", default: "CONFIDENTIAL" },
		{
			name: "layout",
			label: "Layout",
			kind: "select",
			default: "center",
			options: [
				{ label: "Centered", value: "center" },
				{ label: "Tiled", value: "tile" },
			],
		},
		{ name: "opacity", label: "Opacity (0.05–1)", kind: "number", default: 0.25, min: 0.05, max: 1 },
		{ name: "rotation", label: "Rotation (°)", kind: "number", default: 45, min: -90, max: 90 },
		{ name: "size", label: "Width (% of page)", kind: "number", default: 70, min: 5, max: 100 },
		{ name: "color", label: "Colour (#rrggbb)", kind: "text", default: "#b91c1c" },
		{ name: "pages", label: "Page ranges (empty = all)", kind: "text" },
	],
	async run({ values, outDir, outPath, onProgress, signal }) {
		const { watermarkPdf, DEFAULT_WATERMARK } = await import("@qbtools/engines/pdf-watermark");
		const [input] = files(values, "in");
		if (!input) throw new Error("Provide a PDF via --in <file>.");
		const result = await watermarkPdf(
			input,
			{
				...DEFAULT_WATERMARK,
				text: str(values, "text", DEFAULT_WATERMARK.text || "CONFIDENTIAL"),
				layout: str(values, "layout", "center") === "tile" ? "tile" : "center",
				opacity: num(values, "opacity", 0.25),
				rotation: num(values, "rotation", 45),
				size: num(values, "size", 70),
				color: str(values, "color", DEFAULT_WATERMARK.color),
				pages: str(values, "pages"),
			},
			{ onProgress, signal },
		);
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: "watermarked.pdf" },
			new Uint8Array(await result.blob.arrayBuffer()),
		);
		return {
			summary: `Stamped ${result.stamped}/${result.pageCount} pages → ${saved.path}`,
			outputs: [],
			data: { path: saved.path, stamped: result.stamped, pageCount: result.pageCount },
		};
	},
};

export const imageToPdf: ToolRunner = {
	slug: "image-to-pdf",
	availability: "local",
	fields: [
		{
			name: "in",
			label: "Images (PNG only in the CLI)",
			kind: "files",
			required: true,
			accept: [".png"],
		},
		{
			name: "pageSize",
			label: "Page size",
			kind: "select",
			default: "fit",
			options: [
				{ label: "Fit to image", value: "fit" },
				{ label: "A4", value: "a4" },
				{ label: "Letter", value: "letter" },
			],
		},
		{
			name: "orientation",
			label: "Orientation (fixed page sizes)",
			kind: "select",
			default: "auto",
			options: [
				{ label: "Auto", value: "auto" },
				{ label: "Portrait", value: "portrait" },
				{ label: "Landscape", value: "landscape" },
			],
		},
		{ name: "margin", label: "Margin (pt)", kind: "number", default: 0, min: 0, max: 72 },
	],
	async run({ values, outDir, outPath, onProgress }) {
		const { imagesToPdf } = await import("@qbtools/engines/pdf");
		const inputs = files(values, "in");
		if (!inputs.length) throw new Error("Provide PNG images via --in <file> […].");
		const nonPng = inputs.filter((file) => !file.name.toLowerCase().endsWith(".png"));
		if (nonPng.length)
			throw new Error(
				`Only PNG inputs are supported headless (got: ${nonPng.map((f) => f.name).join(", ")}). Convert to PNG first.`,
			);
		const blob = await imagesToPdf(
			inputs,
			{
				pageSize: str(values, "pageSize", "fit") as "a4" | "letter" | "fit",
				orientation: str(values, "orientation", "auto") as "auto" | "portrait" | "landscape",
				marginPt: num(values, "margin", 0),
			},
			(done) => onProgress?.({ stage: "processing", fraction: done / inputs.length, label: `Placed ${done}/${inputs.length}` }),
		);
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: "images.pdf" },
			new Uint8Array(await blob.arrayBuffer()),
		);
		return {
			summary: `${inputs.length} images → ${saved.path}`,
			outputs: [],
			data: { path: saved.path, count: inputs.length },
		};
	},
};

export const compressPdf: ToolRunner = {
	slug: "compress-pdf",
	availability: "local",
	fields: [
		{ name: "in", label: "PDF file", kind: "file", required: true, accept: [".pdf"] },
		{
			name: "mode",
			label: "Mode",
			kind: "select",
			default: "text",
			options: [
				{ label: "Preserve text (structure optimization)", value: "text" },
			],
		},
	],
	async run({ values, outDir, outPath, onProgress, signal }) {
		const [input] = files(values, "in");
		if (!input) throw new Error("Provide a PDF via --in <file>.");
		const { optimizePdf } = await import("@qbtools/engines/pdf-optimize");
		const result = await optimizePdf(input, { onProgress, signal });
		const base = input.name.replace(/\.pdf$/i, "");
		if (!result.decreased) {
			return {
				summary: `Already optimal (${formatBytes(input.size)}) — no smaller copy produced.`,
				outputs: [
					{ type: "text", text: `qpdf couldn't shrink this file (${formatBytes(input.size)}). Scan-heavy PDFs compress better in the web app.` },
				],
				data: { decreased: false, originalBytes: input.size },
			};
		}
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: `${base}-compressed.pdf` },
			new Uint8Array(await result.blob.arrayBuffer()),
		);
		const savedPct = Math.round((1 - saved.bytes / input.size) * 100);
		return {
			summary: `${formatBytes(input.size)} → ${formatBytes(saved.bytes)} (−${savedPct}%) → ${saved.path}`,
			outputs: [],
			data: {
				path: saved.path,
				originalBytes: input.size,
				compressedBytes: saved.bytes,
				warnings: result.warnings,
			},
		};
	},
};

export const protectPdfRunner: ToolRunner = {
	slug: "protect-pdf",
	availability: "local",
	fields: [
		{ name: "in", label: "PDF file", kind: "file", required: true, accept: [".pdf"] },
		{
			name: "mode",
			label: "Action",
			kind: "select",
			default: "protect",
			options: [
				{ label: "Add a password", value: "protect" },
				{ label: "Remove a password", value: "unlock" },
			],
		},
		{ name: "password", label: "Password", kind: "text", required: true },
	],
	async run({ values, outDir, outPath, onProgress, signal }) {
		const { protectPdf } = await import("@qbtools/engines/pdf-protect");
		const [input] = files(values, "in");
		if (!input) throw new Error("Provide a PDF via --in <file>.");
		const mode = str(values, "mode", "protect") === "unlock" ? "unlock" : "protect";
		const blob = await protectPdf(
			{ file: input, mode, password: requireString(values, "password", "password") },
			{ onProgress, signal },
		);
		const base = input.name.replace(/\.pdf$/i, "");
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: mode === "protect" ? `${base}-protected.pdf` : `${base}-unlocked.pdf` },
			new Uint8Array(await blob.arrayBuffer()),
		);
		return {
			summary: `${mode === "protect" ? "Protected" : "Unlocked"} ${input.name} → ${saved.path}`,
			outputs: [],
			data: { path: saved.path, mode },
		};
	},
};

export const pdfRunners: ToolRunner[] = [
	mergePdf,
	splitPdf,
	watermarkPdfRunner,
	imageToPdf,
	compressPdf,
	protectPdfRunner,
];
