import type { CategoryId } from "@qbtools/registry";
import {
	AppWindow,
	AudioWaveform,
	Braces,
	Cake,
	Calculator,
	CaseSensitive,
	Clapperboard,
	Eraser,
	FileDown,
	FileImage,
	FilePlay,
	Files,
	FileText,
	Gauge,
	GraduationCap,
	Hash,
	HeartPulse,
	Image,
	KeyRound,
	Landmark,
	LayoutTemplate,
	Letters,
	Lock,
	type LucideIcon,
	Minimize2,
	PanelsTopLeft,
	Percent,
	QrCode,
	ReceiptText,
	Repeat,
	Scaling,
	ScanBarcode,
	ScanText,
	Scissors,
	Shapes,
	ShieldCheck,
	Signature,
	Sparkles,
	SpellCheck,
	Stamp,
	Type,
	WandSparkles,
	Wrench,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
	"app-window": AppWindow,
	"audio-waveform": AudioWaveform,
	braces: Braces,
	cake: Cake,
	calculator: Calculator,
	"case-sensitive": CaseSensitive,
	clapperboard: Clapperboard,
	eraser: Eraser,
	"file-down": FileDown,
	"file-image": FileImage,
	"file-play": FilePlay,
	files: Files,
	"file-text": FileText,
	gauge: Gauge,
	"graduation-cap": GraduationCap,
	hash: Hash,
	"heart-pulse": HeartPulse,
	image: Image,
	"key-round": KeyRound,
	landmark: Landmark,
	"layout-template": LayoutTemplate,
	letters: Letters,
	lock: Lock,
	"minimize-2": Minimize2,
	"panels-top-left": PanelsTopLeft,
	percent: Percent,
	"qr-code": QrCode,
	"receipt-text": ReceiptText,
	repeat: Repeat,
	scaling: Scaling,
	"scan-barcode": ScanBarcode,
	"scan-text": ScanText,
	scissors: Scissors,
	"shield-check": ShieldCheck,
	signature: Signature,
	shapes: Shapes,
	sparkles: Sparkles,
	stamp: Stamp,
	"spell-check": SpellCheck,
	type: Type,
	"wand-sparkles": WandSparkles,
};

export function iconFor(name: string): LucideIcon {
	return icons[name] ?? Wrench;
}

/**
 * Category accent classes. Colors come from the `--cat-*` tokens in theme.css
 * (soft fill, hairline, icon and text per discipline), so they follow light/dark.
 * Class names are written out in full so Tailwind can see them.
 */
export type CategoryAccent = "emerald" | "rose" | "indigo" | "amber" | "violet" | "sky" | "teal";

export const categoryStyles: Record<
	CategoryId,
	{
		/** Icon tile: soft fill, hairline, icon color. */
		tile: string;
		/** Pill badge: soft fill, hairline, text color. */
		badge: string;
		/** Accent text color. */
		text: string;
		/** Small solid dot. */
		dot: string;
		borderHover: string;
		accent: CategoryAccent;
		/** Color utility specifically for the icon. */
		iconColor: string;
	}
> = {
	image: {
		tile: "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-icon",
		badge: "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-fg",
		text: "text-cat-emerald-fg",
		dot: "bg-muted-foreground/40",
		borderHover: "hover:border-foreground/25",
		accent: "emerald",
		iconColor: "text-cat-emerald-icon",
	},
	pdf: {
		tile: "border-cat-rose-border bg-cat-rose-bg text-cat-rose-icon",
		badge: "border-cat-rose-border bg-cat-rose-bg text-cat-rose-fg",
		text: "text-cat-rose-fg",
		dot: "bg-muted-foreground/40",
		borderHover: "hover:border-foreground/25",
		accent: "rose",
		iconColor: "text-cat-rose-icon",
	},
	text: {
		tile: "border-cat-indigo-border bg-cat-indigo-bg text-cat-indigo-icon",
		badge: "border-cat-indigo-border bg-cat-indigo-bg text-cat-indigo-fg",
		text: "text-cat-indigo-fg",
		dot: "bg-muted-foreground/40",
		borderHover: "hover:border-foreground/25",
		accent: "indigo",
		iconColor: "text-cat-indigo-icon",
	},
	calculators: {
		tile: "border-cat-amber-border bg-cat-amber-bg text-cat-amber-icon",
		badge: "border-cat-amber-border bg-cat-amber-bg text-cat-amber-fg",
		text: "text-cat-amber-fg",
		dot: "bg-muted-foreground/40",
		borderHover: "hover:border-foreground/25",
		accent: "amber",
		iconColor: "text-cat-amber-icon",
	},
	generators: {
		tile: "border-cat-violet-border bg-cat-violet-bg text-cat-violet-icon",
		badge: "border-cat-violet-border bg-cat-violet-bg text-cat-violet-fg",
		text: "text-cat-violet-fg",
		dot: "bg-muted-foreground/40",
		borderHover: "hover:border-foreground/25",
		accent: "violet",
		iconColor: "text-cat-violet-icon",
	},
	media: {
		tile: "border-cat-sky-border bg-cat-sky-bg text-cat-sky-icon",
		badge: "border-cat-sky-border bg-cat-sky-bg text-cat-sky-fg",
		text: "text-cat-sky-fg",
		dot: "bg-muted-foreground/40",
		borderHover: "hover:border-foreground/25",
		accent: "sky",
		iconColor: "text-cat-sky-icon",
	},
	security: {
		tile: "border-cat-teal-border bg-cat-teal-bg text-cat-teal-icon",
		badge: "border-cat-teal-border bg-cat-teal-bg text-cat-teal-fg",
		text: "text-cat-teal-fg",
		dot: "bg-muted-foreground/40",
		borderHover: "hover:border-foreground/25",
		accent: "teal",
		iconColor: "text-cat-teal-icon",
	},
	developer: {
		tile: "border-cat-sky-border bg-cat-sky-bg text-cat-sky-icon",
		badge: "border-cat-sky-border bg-cat-sky-bg text-cat-sky-fg",
		text: "text-cat-sky-fg",
		dot: "bg-muted-foreground/40",
		borderHover: "hover:border-foreground/25",
		accent: "sky",
		iconColor: "text-cat-sky-icon",
	},
};

export const categoryTone: Record<CategoryId, string> = {
	image: categoryStyles.image.tile,
	pdf: categoryStyles.pdf.tile,
	text: categoryStyles.text.tile,
	calculators: categoryStyles.calculators.tile,
	generators: categoryStyles.generators.tile,
	media: categoryStyles.media.tile,
	security: categoryStyles.security.tile,
	developer: categoryStyles.developer.tile,
};

/** "Image tools" → "Image", "Security & Encryption" → "Security". */
export function categoryShortName(name: string): string {
	return name.replace(/ tools$/i, "").replace(/ & .*$/, "");
}
