import type { CategoryId } from "@qbtools/registry";
import {
	AudioWaveform,
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
	GraduationCap,
	HeartPulse,
	Image,
	KeyRound,
	Landmark,
	Letters,
	type LucideIcon,
	Minimize2,
	PanelsTopLeft,
	Percent,
	QrCode,
	ReceiptText,
	Repeat,
	Scaling,
	Scissors,
	Signature,
	Sparkles,
	SpellCheck,
	Type,
	WandSparkles,
	Wrench,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
	"audio-waveform": AudioWaveform,
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
	"graduation-cap": GraduationCap,
	"heart-pulse": HeartPulse,
	image: Image,
	"key-round": KeyRound,
	landmark: Landmark,
	letters: Letters,
	"minimize-2": Minimize2,
	"panels-top-left": PanelsTopLeft,
	percent: Percent,
	"qr-code": QrCode,
	"receipt-text": ReceiptText,
	repeat: Repeat,
	scaling: Scaling,
	scissors: Scissors,
	signature: Signature,
	sparkles: Sparkles,
	"spell-check": SpellCheck,
	type: Type,
	"wand-sparkles": WandSparkles,
};

export function iconFor(name: string): LucideIcon {
	return icons[name] ?? Wrench;
}

/**
 * Curated tone and style classes per category for rich visual structure.
 * Designed with high contrast in both dark and light color schemes.
 */
export const categoryStyles: Record<
	CategoryId,
	{
		tile: string;
		badge: string;
		borderHover: string;
		accent: string;
	}
> = {
	image: {
		tile: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
		badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
		borderHover: "hover:border-emerald-500/50",
		accent: "emerald",
	},
	pdf: {
		tile: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
		badge: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
		borderHover: "hover:border-rose-500/50",
		accent: "rose",
	},
	text: {
		tile: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
		badge: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
		borderHover: "hover:border-indigo-500/50",
		accent: "indigo",
	},
	calculators: {
		tile: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
		badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
		borderHover: "hover:border-amber-500/50",
		accent: "amber",
	},
	generators: {
		tile: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
		badge: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
		borderHover: "hover:border-violet-500/50",
		accent: "violet",
	},
	media: {
		tile: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
		badge: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
		borderHover: "hover:border-sky-500/50",
		accent: "sky",
	},
};

export const categoryTone: Record<CategoryId, string> = {
	image: categoryStyles.image.tile,
	pdf: categoryStyles.pdf.tile,
	text: categoryStyles.text.tile,
	calculators: categoryStyles.calculators.tile,
	generators: categoryStyles.generators.tile,
	media: categoryStyles.media.tile,
};


