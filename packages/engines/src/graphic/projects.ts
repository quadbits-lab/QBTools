/** Versioned `.qbdesign.json` project files (share and re-edit designs). */
import { checkAbort, type ProcessingOptions } from "../processing";
import type { DesignProject, DesignSettings, GraphicToolKind } from "./types";

export const QBDESIGN_FORMAT = "qbdesign";
export const QBDESIGN_VERSION = 1;
export const QBDESIGN_MAX_BYTES = 50 * 1024 * 1024;

export function projectFileName(tool: GraphicToolKind, name: string): string {
	const slug =
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "design";
	return `${slug}-${tool}.qbdesign.json`;
}

/** Serialize a design into a shareable project Blob. */
export function serializeDesign(project: DesignProject): Blob {
	const payload = {
		format: QBDESIGN_FORMAT,
		version: QBDESIGN_VERSION,
		tool: project.device,
		settings: project.settings,
		meta: project.meta,
	};
	return new Blob([JSON.stringify(payload)], { type: "application/json" });
}

type UnknownRecord = Record<string, unknown>;

/** Basic shape validation after format/version checks throw descriptive errors. */
function validateSettings(settings: DesignSettings): void {
	if (!settings || typeof settings !== "object") throw new Error("The project file is damaged.");
	if (settings.tool === "og-banner") {
		const d = settings.design;
		if (!d || typeof d !== "object") throw new Error("The project file is damaged.");
		const canvas = (d as unknown as UnknownRecord).canvas as UnknownRecord | null;
		if (!canvas || typeof canvas.width !== "number" || typeof canvas.height !== "number")
			throw new Error("The banner canvas size is missing from the project.");
		if (canvas.width < 50 || canvas.height < 50 || canvas.width > 8192 || canvas.height > 8192)
			throw new Error("Banner dimensions in the project are out of range.");
	} else {
		const d = settings.design;
		if (!d || typeof d !== "object") throw new Error("The project file is damaged.");
		const canvas = (d as unknown as UnknownRecord).canvas;
		if (typeof canvas !== "number" || canvas < 16 || canvas > 8192)
			throw new Error("Icon size in the project is out of range.");
	}
}

/** Parse and validate a project file or text payload. */
export async function parseDesign(
	file: Blob,
	options: ProcessingOptions = {},
): Promise<DesignProject> {
	checkAbort(options.signal);
	if (file.size > QBDESIGN_MAX_BYTES)
		throw new Error("Project files are limited to 50 MB. This one is larger.");
	let raw: string;
	try {
		raw = await file.text();
	} catch {
		throw new Error("This project file could not be read.");
	}
	checkAbort(options.signal);
	let data: UnknownRecord;
	try {
		data = JSON.parse(raw) as UnknownRecord;
	} catch {
		throw new Error("This is not a QBTools design file.");
	}
	if (data.format !== QBDESIGN_FORMAT) throw new Error("This is not a QBTools design file.");
	const version = data.version;
	if (typeof version !== "number" || version > QBDESIGN_VERSION)
		throw new Error(
			"This project was made by a newer version of QBTools and cannot be opened here.",
		);
	if (typeof data.tool !== "string") throw new Error("The project file is damaged.");
	const tool = data.tool as GraphicToolKind;
	if (!["og-banner", "favicon", "app-icon"].includes(tool))
		throw new Error("The project file is damaged.");
	const settings = data.settings as DesignSettings;
	validateSettings(settings);
	const meta = (data.meta as DesignProject["meta"]) ?? { name: "Imported design", savedAt: "" };
	return {
		device: tool,
		version: QBDESIGN_VERSION,
		settings,
		meta: {
			name: typeof meta.name === "string" ? meta.name : "Imported design",
			savedAt: typeof meta.savedAt === "string" ? meta.savedAt : new Date().toISOString(),
		},
	};
}
