import "@tanstack/react-start/server-only";
import { ensureUserData, getUserDb } from "@qbtools/db/users";
import { getTool } from "@qbtools/registry";
import { z } from "zod";
import { STORAGE_LIMIT } from "../lib/media-contract";
import { requireUser } from "./auth";
import { MediaError } from "./media-validation";
import { storageConfigured } from "./object-store";

export const privateHeaders = {
	"Content-Type": "application/json",
	"Cache-Control": "private, no-store",
	Vary: "Cookie",
};
export function json(data: unknown, status = 200) {
	return Response.json(data, { status, headers: privateHeaders });
}
export function checkOrigin(request: Request) {
	if (["GET", "HEAD"].includes(request.method)) return;
	const origin = request.headers.get("origin");
	const expected = new URL(process.env.BETTER_AUTH_URL ?? request.url).origin;
	if (origin !== expected) throw new MediaError("ORIGIN", "Request origin is not allowed.", 403);
}
export async function readJson(request: Request) {
	if (!request.headers.get("content-type")?.startsWith("application/json"))
		throw new MediaError("CONTENT_TYPE", "Expected JSON.", 415);
	if (!request.body) throw new MediaError("INVALID_BODY", "Request body is required.");
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		for (;;) {
			const next = await reader.read();
			if (next.done) break;
			size += next.value.length;
			if (size > 65536) {
				await reader.cancel();
				throw new MediaError("BODY_SIZE", "Request is too large.", 413);
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
export async function apiResult(run: () => Promise<Response>) {
	try {
		return await run();
	} catch (error) {
		if (error instanceof Response) return error;
		if (error instanceof MediaError)
			return json({ error: error.code, message: error.message }, error.status);
		if (error instanceof z.ZodError || error instanceof SyntaxError)
			return json(
				{ error: "VALIDATION", message: "Check the submitted values and try again." },
				400,
			);
		if (error instanceof Error && error.name === "AbortError")
			return json({ error: "CANCELLED", message: "Upload cancelled." }, 409);
		console.error("[account] request failed", error instanceof Error ? error.name : "Error");
		return json(
			{
				error: "UNAVAILABLE",
				message: "This service is temporarily unavailable. Please try again.",
			},
			503,
		);
	}
}
const preferencesSchema = z
	.object({
		theme: z.enum(["dark", "light", "system"]).optional(),
		media_view: z.enum(["grid", "list"]).optional(),
		media_sort: z.enum(["newest", "oldest", "name", "size"]).optional(),
		track_recent: z.boolean().optional(),
	})
	.strict();
export async function accountHandler(request: Request) {
	return apiResult(async () => {
		checkOrigin(request);
		const user = await requireUser(request);
		const { pg } = await getUserDb();
		await ensureUserData(pg, user.id);
		const action = new URL(request.url).pathname.split("/").pop();
		if (request.method === "GET" && action === "profile") {
			const preferences = (
				await pg.query(
					"SELECT theme,media_view,media_sort,track_recent,favorites_imported FROM user_preferences WHERE user_id=$1",
					[user.id],
				)
			).rows[0];
			const favorites = (
				await pg.query<{ slug: string }>(
					"SELECT slug FROM favorite_tool WHERE user_id=$1 ORDER BY created_at DESC,slug",
					[user.id],
				)
			).rows.map((r) => r.slug);
			const recent = (
				await pg.query<{ slug: string }>(
					"SELECT slug FROM recent_tool WHERE user_id=$1 ORDER BY used_at DESC LIMIT 50",
					[user.id],
				)
			).rows.map((r) => r.slug);
			const usage = (
				await pg.query<{ used_bytes: number; reserved_bytes: number }>(
					"SELECT * FROM storage_usage WHERE user_id=$1",
					[user.id],
				)
			).rows[0];
			return json({
				preferences,
				favorites,
				recent,
				storage: {
					used: Number(usage?.used_bytes ?? 0),
					reserved: Number(usage?.reserved_bytes ?? 0),
					limit: STORAGE_LIMIT,
					available: storageConfigured(),
				},
			});
		}
		if (request.method === "PATCH" && action === "preferences") {
			const input = preferencesSchema.parse(await readJson(request));
			for (const [key, value] of Object.entries(input))
				await pg.query(`UPDATE user_preferences SET ${key}=$2 WHERE user_id=$1`, [user.id, value]);
			return json({ ok: true });
		}
		if (request.method === "POST" && action === "favorites") {
			const input = z
				.object({ slug: z.string().max(100), saved: z.boolean() })
				.parse(await readJson(request));
			if (!getTool(input.slug)) throw new MediaError("INVALID_TOOL", "Unknown tool.");
			if (input.saved)
				await pg.query(
					"INSERT INTO favorite_tool(user_id,slug) VALUES ($1,$2) ON CONFLICT DO NOTHING",
					[user.id, input.slug],
				);
			else
				await pg.query("DELETE FROM favorite_tool WHERE user_id=$1 AND slug=$2", [
					user.id,
					input.slug,
				]);
			return json({ ok: true });
		}
		if (request.method === "POST" && action === "import-favorites") {
			const { slugs } = z
				.object({ slugs: z.array(z.string().max(100)).max(100) })
				.parse(await readJson(request));
			await pg.transaction(async (tx) => {
				const changed = await tx.query(
					"UPDATE user_preferences SET favorites_imported=true WHERE user_id=$1 AND NOT favorites_imported RETURNING user_id",
					[user.id],
				);
				if (changed.rows.length)
					for (const slug of slugs)
						if (getTool(slug))
							await tx.query(
								"INSERT INTO favorite_tool(user_id,slug) VALUES ($1,$2) ON CONFLICT DO NOTHING",
								[user.id, slug],
							);
			});
			return json({ ok: true });
		}
		if (action === "recent" && request.method === "DELETE") {
			await pg.query("DELETE FROM recent_tool WHERE user_id=$1", [user.id]);
			return json({ ok: true });
		}
		if (action === "recent" && request.method === "POST") {
			const { slug } = z.object({ slug: z.string().max(100) }).parse(await readJson(request));
			if (!getTool(slug)) throw new MediaError("INVALID_TOOL", "Unknown tool.");
			await pg.transaction(async (tx) => {
				await tx.query(
					"INSERT INTO recent_tool(user_id,slug) SELECT $1,$2 WHERE (SELECT track_recent FROM user_preferences WHERE user_id=$1) ON CONFLICT(user_id,slug) DO UPDATE SET used_at=now()",
					[user.id, slug],
				);
				await tx.query(
					"DELETE FROM recent_tool WHERE user_id=$1 AND slug NOT IN (SELECT slug FROM recent_tool WHERE user_id=$1 ORDER BY used_at DESC LIMIT 50)",
					[user.id],
				);
			});
			return json({ ok: true });
		}
		return json({ error: "NOT_FOUND" }, 404);
	});
}
