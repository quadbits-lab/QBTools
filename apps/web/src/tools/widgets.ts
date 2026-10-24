import { type ComponentType, type LazyExoticComponent, lazy } from "react";
import type { ToolWidgetProps } from "./types";

type Widget = LazyExoticComponent<ComponentType<ToolWidgetProps>>;

/**
 * slug → lazily loaded widget. Each tool is its own chunk, so heavy
 * libraries (pdf.js, ML models, encoders) load only on that tool's page.
 * Keep keys in sync with @qbtools/registry (enforced by widgets.test.ts).
 */
export const widgets: Record<string, Widget> = {
	"compress-image": lazy(() => import("./compress-image")),
	"resize-image": lazy(() => import("./resize-image")),
	"convert-image": lazy(() => import("./convert-image")),
	"remove-background": lazy(() => import("./remove-background")),
	"merge-pdf": lazy(() => import("./merge-pdf")),
	"split-pdf": lazy(() => import("./split-pdf")),
	"compress-pdf": lazy(() => import("./compress-pdf")),
	"image-to-pdf": lazy(() => import("./image-to-pdf")),
	"word-counter": lazy(() => import("./word-counter")),
	"case-converter": lazy(() => import("./case-converter")),
	"grammar-checker": lazy(() => import("./grammar-checker")),
	"paraphrasing-tool": lazy(() => import("./paraphrasing-tool")),
	"age-calculator": lazy(() => import("./age-calculator")),
	"emi-calculator": lazy(() => import("./emi-calculator")),
	"percentage-calculator": lazy(() => import("./percentage-calculator")),
	"gpa-calculator": lazy(() => import("./gpa-calculator")),
	"bmi-calculator": lazy(() => import("./bmi-calculator")),
	"qr-code-generator": lazy(() => import("./qr-code-generator")),
	"password-generator": lazy(() => import("./password-generator")),
	"invoice-generator": lazy(() => import("./invoice-generator")),
	"signature-generator": lazy(() => import("./signature-generator")),
	"video-compressor": lazy(() => import("./video-compressor")),
	"audio-trimmer": lazy(() => import("./audio-trimmer")),
	"thumbnail-maker": lazy(() => import("./thumbnail-maker")),
	"video-trimmer": lazy(() => import("./video-trimmer")),
	"video-to-audio": lazy(() => import("./video-to-audio")),
	"video-to-gif": lazy(() => import("./video-to-gif")),
	"file-encryptor": lazy(() => import("./file-encryptor")),
	"hash-generator": lazy(() => import("./hash-generator")),
	"text-encryptor": lazy(() => import("./text-encryptor")),
};
