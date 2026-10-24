import { z } from "zod";

export const TONES = ["simple", "formal", "friendly", "shorter", "creative"] as const;
export type Tone = (typeof TONES)[number];

export const aiTextSchema = z.discriminatedUnion("mode", [
	z.object({ mode: z.literal("grammar"), text: z.string().trim().min(1, "Please paste some text").max(20_000) }),
	z.object({
		mode: z.literal("paraphrase"),
		tone: z.enum(TONES),
		text: z.string().trim().min(1, "Please paste some text").max(20_000),
	}),
]);

export type AiTextInput = z.infer<typeof aiTextSchema>;

export type GrammarChange = { original: string; corrected: string; reason: string };

export type AiTextResult =
	| { ok: true; mode: "grammar"; corrected: string; changes: GrammarChange[] }
	| { ok: true; mode: "paraphrase"; versions: string[] }
	| { ok: false; error: string };
