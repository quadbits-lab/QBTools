import "@tanstack/react-start/server-only";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	DATABASE_PATH: z.string().default("./data/qbtools.db"),
	ADMIN_TOKEN: z
		.string()
		.min(16, "ADMIN_TOKEN must be at least 16 characters")
		.optional()
		.or(z.literal("").transform(() => undefined)),
	AI_API_KEY: z
		.string()
		.optional()
		.or(z.literal("").transform(() => undefined)),
	AI_MODEL: z.string().default("claude-haiku-5-5"),
	AI_MAX_INPUT_CHARS: z.coerce.number().int().positive().default(5000),
	RATE_LIMIT_FORMS_PER_HOUR: z.coerce.number().int().positive().default(10),
	RATE_LIMIT_AI_PER_HOUR: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Parsed once per process, on first server use (never at module load). */
export function getEnv(): Env {
	if (cached) return cached;
	const parsed = envSchema.safeParse(process.env);
	if (!parsed.success) {
		const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
		throw new Error(`Invalid environment configuration — ${details}`);
	}
	cached = parsed.data;
	return cached;
}
