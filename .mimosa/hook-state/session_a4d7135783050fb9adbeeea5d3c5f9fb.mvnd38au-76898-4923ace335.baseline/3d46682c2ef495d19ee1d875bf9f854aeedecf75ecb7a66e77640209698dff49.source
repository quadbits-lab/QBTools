/**
 * Registry coverage map: every one of the registry's 42 tool slugs resolves to
 * exactly one CLI runner or an explicit web-only entry (parity is test-enforced
 * in runner-map.test.ts, mirroring the web app's widgets parity test).
 */

import type { Availability, ToolRunner } from "./types";
import { barcodeRunner } from "./runners/barcode";
import { calculatorRunners } from "./runners/calculators";
import { developerRunners } from "./runners/developer";
import { generatorRunners } from "./runners/generators";
import { graphicRunners } from "./runners/graphics";
import { pdfRunners } from "./runners/pdf";
import { securityRunners } from "./runners/security";
import { textRunners } from "./runners/text";
import { pngToSvg } from "./runners/vectorize";

/** Browser-only tools surfaced as deep links (`qbtools open <slug>`). */
export const WEB_ONLY_TOOLS = new Set([
	"remove-background",
	"signature-generator",
	"redact-pdf",
	"ocr-pdf",
	"extract-text",
]);

/** Transitional stubs for tools whose runners land with the server/media phases. */
function stubRunner(slug: string, availability: Availability, hint: string): ToolRunner {
	return {
		slug,
		availability,
		fields: [],
		async run() {
			const { UnavailableError } = await import("./types");
			throw new UnavailableError(availability, hint);
		},
	};
}

const SERVER_HINT =
	"Needs an authenticated QBTools server. Run `qbtools login` first (API-key auth arrives with the server phase).";
const SHARP_HINT =
	"Needs the optional sharp dependency for image processing (wired in the sharp phase).";
const FFMPEG_HINT =
	"Needs a native ffmpeg binary on your PATH (wired in the media phase).";

export const STUB_RUNNERS: ToolRunner[] = [
	stubRunner("grammar-checker", "server", SERVER_HINT),
	stubRunner("paraphrasing-tool", "server", SERVER_HINT),
	stubRunner("compress-image", "sharp", SHARP_HINT),
	stubRunner("resize-image", "sharp", SHARP_HINT),
	stubRunner("convert-image", "sharp", SHARP_HINT),
	stubRunner("video-compressor", "ffmpeg", FFMPEG_HINT),
	stubRunner("video-trimmer", "ffmpeg", FFMPEG_HINT),
	stubRunner("video-to-audio", "ffmpeg", FFMPEG_HINT),
	stubRunner("video-to-gif", "ffmpeg", FFMPEG_HINT),
	stubRunner("audio-trimmer", "ffmpeg", FFMPEG_HINT),
	stubRunner("thumbnail-maker", "ffmpeg", FFMPEG_HINT),
];

const ALL_RUNNERS: ToolRunner[] = [
	...calculatorRunners,
	...textRunners,
	...generatorRunners,
	...pdfRunners,
	...securityRunners,
	...developerRunners,
	...graphicRunners,
	pngToSvg,
	barcodeRunner,
	...STUB_RUNNERS,
];

export const RUNNERS = new Map(ALL_RUNNERS.map((runner) => [runner.slug, runner]));

export function runnerFor(slug: string): ToolRunner | undefined {
	return RUNNERS.get(slug);
}

/** CLI availability for a registry slug ("web" for browser-only tools). */
export function availabilityFor(slug: string): Availability | "web" {
	if (WEB_ONLY_TOOLS.has(slug)) return "web";
	return RUNNERS.get(slug)?.availability ?? "web";
}

export const AVAILABILITY_LABELS: Record<Availability | "web", string> = {
	local: "local",
	sharp: "+sharp",
	ffmpeg: "+ffmpeg",
	server: "server",
	web: "web",
};

export const AVAILABILITY_HINTS: Record<Availability | "web", string> = {
	local: "Runs fully offline",
	sharp: "Needs the optional sharp package",
	ffmpeg: "Needs a native ffmpeg binary",
	server: "Needs an authenticated QBTools server",
	web: "Browser only — `qbtools open <slug>`",
};
