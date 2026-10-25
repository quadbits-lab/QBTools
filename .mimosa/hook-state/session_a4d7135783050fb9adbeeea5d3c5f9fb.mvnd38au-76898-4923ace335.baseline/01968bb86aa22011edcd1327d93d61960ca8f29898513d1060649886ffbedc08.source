import "@tanstack/react-start/server-only";
import { getUserDb } from "@qbtools/db/users";
import { getTool } from "@qbtools/registry";
import { z } from "zod";
import { apiResult, checkOrigin, json, readJson } from "./account-api";
import { requireUser } from "./auth";
import { MediaService } from "./media-service";
import { MediaError, parseRange, validateFilename } from "./media-validation";
import { getObjectStore, storageConfigured } from "./object-store";
import { createRateLimiter } from "./rate-limit";

let shared: Promise<MediaService> | undefined;
export function getMediaService() {
	shared ??= (async () => {
		const service = new MediaService((await getUserDb()).pg, getObjectStore());
		await service.reconcile();
		const timer = setInterval(() => {
			void service.reconcile().catch(() => {});
		}, 60_000);
		timer.unref();
		return service;
	})().catch((error) => {
		shared = undefined;
		throw error;
	});
	return shared;
}
const attempts = createRateLimiter({ limit: 100, windowMs: 3600000 });
const uuid = z.string().uuid();
const reserveSchema = z
	.object({
		requestKey: uuid,
		name: z.string().max(200),
		bytes: z.number().int().positive(),
		mime: z.string().max(150),
		previewBytes: z.number().int().nonnegative().optional(),
		sourceTool: z.string().max(100).optional(),
	})
	.strict();
export function mediaHandler(request: Request) {
	return apiResult(async () => {
		checkOrigin(request);
		const user = await requireUser(request);
		if (!storageConfigured())
			throw new MediaError("STORAGE_UNAVAILABLE", "Media Storage is not configured yet.", 503);
		const service = await getMediaService();
		const url = new URL(request.url);
		const parts = url.pathname.slice("/api/media/".length).split("/");
		if (parts[0] === "list" && request.method === "GET") {
			const search = z
				.string()
				.max(100)
				.parse(url.searchParams.get("search") ?? "");
			const kind = z
				.enum(["all", "image", "audio", "video", "document"])
				.parse(url.searchParams.get("kind") ?? "all");
			const sort = z
				.enum(["newest", "oldest", "name", "size"])
				.parse(url.searchParams.get("sort") ?? "newest");
			const page = z.coerce
				.number()
				.int()
				.min(0)
				.max(10000)
				.parse(url.searchParams.get("page") ?? 0);
			const order = {
				newest: "created_at DESC,id",
				oldest: "created_at ASC,id",
				name: "lower(name),id",
				size: "bytes DESC,id",
			}[sort];
			const filter =
				kind === "all"
					? "true"
					: kind === "document"
						? "mime !~ '^(image|audio|video)/'"
						: "mime LIKE $3";
			const args: unknown[] = [
				user.id,
				`%${search.replace(/[\\%_]/g, "\\$&")}%`,
				`${kind}/%`,
				page * 40,
			];
			const rows = (
				await service.pg.query(
					`SELECT id,name,mime,bytes,preview_bytes,source_tool,created_at FROM media_asset WHERE user_id=$1 AND state='ready' AND name ILIKE $2 AND (${filter}) AND $3::text IS NOT NULL ORDER BY ${order} LIMIT 41 OFFSET $4`,
					args,
				)
			).rows;
			return json({
				assets: rows.slice(0, 40),
				more: rows.length > 40,
				usage: await service.usage(user.id),
			});
		}
		if (parts[0] === "uploads" && parts.length === 1 && request.method === "POST") {
			if (!attempts.take(user.id).ok)
				throw new MediaError("RATE_LIMIT", "Too many upload attempts. Try again later.", 429);
			const input = reserveSchema.parse(await readJson(request));
			if (input.sourceTool && !getTool(input.sourceTool))
				throw new MediaError("INVALID_TOOL", "Unknown source tool.");
			const row = await service.reserve(user.id, input);
			return json({ id: row.id, state: row.state }, 201);
		}
		if (parts[0] === "uploads" && parts[1]) {
			const id = uuid.parse(parts[1]);
			if (request.method === "GET" && parts.length === 2) {
				const row = await service.get(user.id, id);
				return json({ id, state: row.state, cleanupPending: row.cleanup_error });
			}
			if (request.method === "DELETE" && parts.length === 2) {
				await service.cancel(user.id, id);
				return json({ ok: true });
			}
			if (
				request.method === "PUT" &&
				["content", "preview"].includes(parts[2] ?? "") &&
				parts.length === 3
			) {
				if (!request.body) throw new MediaError("EMPTY", "Choose a non-empty file.");
				await service.upload(user.id, id, request.body, parts[2] === "preview", request.signal);
				return json({ ok: true });
			}
			if (request.method === "POST" && parts[2] === "complete" && parts.length === 3) {
				const row = await service.complete(user.id, id);
				return json({ id: row.id, name: row.name });
			}
		}
		const id = uuid.parse(parts[0]);
		const row = await service.get(user.id, id);
		if (request.method === "DELETE" && parts.length === 1) {
			await service.cancel(user.id, id);
			return json({ ok: true });
		}
		if (row.state !== "ready") throw new MediaError("NOT_FOUND", "File not found.", 404);
		if (request.method === "PATCH" && parts.length === 1) {
			const { name } = z.object({ name: z.string().max(200) }).parse(await readJson(request));
			const ext = validateFilename(name);
			if (ext !== validateFilename(row.name))
				throw new MediaError("EXTENSION", "Keep the original file extension.");
			await service.pg.query(
				"UPDATE media_asset SET name=$3 WHERE user_id=$1 AND id=$2 AND state='ready'",
				[user.id, id, name],
			);
			return json({ ok: true });
		}
		if (
			["GET", "HEAD"].includes(request.method) &&
			["content", "preview"].includes(parts[1] ?? "") &&
			parts.length === 2
		) {
			const preview = parts[1] === "preview";
			if (preview && !Number(row.preview_bytes))
				throw new MediaError("NOT_FOUND", "Preview unavailable.", 404);
			const size = Number(preview ? row.preview_bytes : row.bytes);
			let range: ReturnType<typeof parseRange>;
			try {
				range = parseRange(request.headers.get("range"), size);
			} catch {
				return new Response(null, {
					status: 416,
					headers: { "Content-Range": `bytes */${size}`, "Cache-Control": "private, no-store" },
				});
			}
			const inline =
				preview ||
				(/^(image\/(png|jpeg|webp|gif|avif)|audio\/|video\/)/.test(row.mime) &&
					url.searchParams.get("download") !== "1");
			const headers = new Headers({
				"Content-Type": preview ? "image/png" : row.mime,
				"Content-Length": String(range ? range.end - range.start + 1 : size),
				"Accept-Ranges": "bytes",
				"Cache-Control": "private, no-store",
				Vary: "Cookie",
				"X-Content-Type-Options": "nosniff",
				"Content-Security-Policy": "default-src 'none'; sandbox",
				"Content-Disposition": `${inline ? "inline" : "attachment"}; filename="download"; filename*=UTF-8''${encodeURIComponent(row.name).replace(/'/g, "%27")}`,
			});
			if (range) headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
			return new Response(
				request.method === "HEAD"
					? null
					: service.objects.read(
							`${row.object_key}/${preview ? "preview" : "content"}`,
							range?.start,
							range ? range.end + 1 : undefined,
						),
				{ status: range ? 206 : 200, headers },
			);
		}
		return json({ error: "NOT_FOUND" }, 404);
	});
}
