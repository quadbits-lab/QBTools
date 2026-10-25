import { createServerFn } from "@tanstack/react-start";
import { type AiTextResult, aiTextSchema } from "#/lib/ai-schemas";
import { runAiText } from "./ai-text";
import { getEnv } from "./env";
import { clientKey } from "./request";

export const aiStatusFn = createServerFn({ method: "GET" }).handler(async () => {
	const env = getEnv();
	return { available: Boolean(env.AI_API_KEY), maxChars: env.AI_MAX_INPUT_CHARS };
});

export const aiTextFn = createServerFn({ method: "POST" })
	.validator(aiTextSchema)
	.handler(async ({ data }): Promise<AiTextResult> => {
		return runAiText(data, clientKey());
	});
