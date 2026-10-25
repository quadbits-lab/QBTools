import "@tanstack/react-start/server-only";

import { z } from "zod";
import { aiTextSchema } from "#/lib/ai-schemas";
import { runAiText } from "./ai-text";
import { requireUser } from "./auth";
import { readBearerToken } from "./cli-token";
import { getEnv } from "./env";

const privateHeaders = {
	"Content-Type": "application/json",
	"Cache-Control": "private, no-store",
	Vary: "Cookie, Authorization",
};
function json(data: unknown, status = 200) {
	return Response.json(data, { status, headers: privateHeaders });
}
function fail(status: number, code: string, message: string) {
	return json({ error: code, message }, status);
}

function checkOrigin(request: Request) {
	if (readBearerToken(request)) return undefined;
	if (["GET", "HEAD"].includes(request.method)) return undefined;
	const origin = request.headers.get("origin");
	const expected = new URL(process.env.BETTER_AUTH_URL ?? request.url).origin;
	if (origin !== expected) return fail(403, "ORIGIN", "Request origin is not allowed.");
	return undefined;
}

async function readJson(request: Request): Promise<unknown> {
	if (!request.body) return {};
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		for (;;) {
			const next = await reader.read();
			if (next.done) break;
			size += next.value.length;
			if (size > 256000) {
				await reader.cancel();
				return null;
			}
			chunks.push(next.value);
		}
		const data = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			data.set(chunk, offset);
			offset += chunk.length;
		}
		return JSON.parse(new TextDecoder().decode(data)) as unknown;
	} finally {
		reader.releaseLock();
	}
}

const actionByPath: Record<string, "grammar" | "paraphrase"> = {
	grammar: "grammar",
	paraphrase: "paraphrase",
};

/**
 * POST /api/ai/grammar|paraphrase — same AI core as the web app, behind
 * requireUser (session cookie or CLI API token). Rate limits live inside
 * runAiText, scoped to the user id for CLI traffic.
 */
export async function aiApiHandler(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const action = url.pathname.split("/api/ai/")[1] ?? "";
	const originResult = checkOrigin(request);
	if (originResult) return originResult;
	try {
		const user = await requireUser(request);
		const mode = actionByPath[action];
		if (!mode) return fail(404, "NOT_FOUND", "Unknown AI endpoint.");

		const limit = z.object({ text: z.string().max(30_000) }).safeParse(await readJson(request));
		if (!limit.success) return fail(400, "VALIDATION", "Provide text to process.");
		if (!limit.data) return fail(400, "VALIDATION", "Request body is required.");
		const parsed = aiTextSchema.safeParse({
			mode,
			text: limit.data.text,
			...(mode === "paraphrase" ? { tone: "simple" } : {}),
		});
		if (!parsed.success) return fail(400, "VALIDATION", "Check the submitted values.");

		const result = await runAiText(parsed.data, `cli:${user.id}`);
		return json(result);
	} catch (error) {
		if (error instanceof Response) return error;
		const hasAiKey = Boolean(process.env.AI_API_KEY);
		if (!hasAiKey)
			return fail(503, "AI_UNAVAILABLE", "The AI helper isn't switched on for this site yet.");
		console.error("[ai-api] request failed", error instanceof Error ? error.name : "Error");
		return fail(503, "UNAVAILABLE", "This service is temporarily unavailable. Please try again.");
	}
}
