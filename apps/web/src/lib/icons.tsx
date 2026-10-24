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
 * Icon tile classes per category. The design system has no accent hues, so
 * every category shares the same hairline tile; kept as a map for future use.
 */
const TILE = "border border-input text-foreground";
export const categoryTone: Record<string, string> = {
	image: TILE,
	pdf: TILE,
	text: TILE,
	calculators: TILE,
	generators: TILE,
	media: TILE,
};
