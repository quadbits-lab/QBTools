import type { PGlite } from "@qbtools/db/users";
import { ensureUserData } from "@qbtools/db/users";
import { FILE_LIMIT, PREVIEW_LIMIT, STORAGE_LIMIT } from "../lib/media-contract";
import { MediaError, validateContent, validateFilename } from "./media-validation";
import type { ObjectStore } from "./object-store";

export interface AssetRow {
	id: string;
	user_id: string;
	request_key: string;
	name: string;
	mime: string;
	bytes: number;
	preview_bytes: number;
	source_tool: string | null;
	object_key: string;
	state: string;
	content_uploaded: boolean;
	preview_uploaded: boolean;
	charged: boolean;
	sha256: string | null;
	created_at: Date;
	expires_at: Date;
	cleanup_error: boolean;
}
export interface ReserveInput {
	requestKey: string;
	name: string;
	mime: string;
	bytes: number;
	previewBytes?: number;
	sourceTool?: string;
}
export class MediaService {
	private active = new Map<
		string,
		{ userId: string; controller: AbortController; stopped: Promise<void> }
	>();
	constructor(
		public pg: PGlite,
		public objects: ObjectStore,
	) {}
	async get(userId: string, id: string) {
		const row = (
			await this.pg.query<AssetRow>("SELECT * FROM media_asset WHERE user_id=$1 AND id=$2", [
				userId,
				id,
			])
		).rows[0];
		if (!row) throw new MediaError("NOT_FOUND", "File not found.", 404);
		return row;
	}
	async usage(userId: string) {
		await ensureUserData(this.pg, userId);
		const row = (
			await this.pg.query<{ used_bytes: number; reserved_bytes: number }>(
				"SELECT * FROM storage_usage WHERE user_id=$1",
				[userId],
			)
		).rows[0];
		return {
			used: Number(row?.used_bytes ?? 0),
			reserved: Number(row?.reserved_bytes ?? 0),
			limit: STORAGE_LIMIT,
		};
	}
	async reserve(userId: string, input: ReserveInput) {
		validateFilename(input.name);
		if (
			!Number.isSafeInteger(input.bytes) ||
			input.bytes <= 0 ||
			input.bytes > FILE_LIMIT ||
			!Number.isSafeInteger(input.previewBytes ?? 0) ||
			(input.previewBytes ?? 0) < 0 ||
			(input.previewBytes ?? 0) > PREVIEW_LIMIT
		)
			throw new MediaError(
				"FILE_SIZE",
				"Files must be non-empty and at most 100 MB; previews must be at most 256 KB.",
				413,
			);
		await ensureUserData(this.pg, userId);
		return this.pg.transaction(async (tx) => {
			const existing = (
				await tx.query<AssetRow>("SELECT * FROM media_asset WHERE user_id=$1 AND request_key=$2", [
					userId,
					input.requestKey,
				])
			).rows[0];
			if (existing) {
				if (
					existing.name !== input.name ||
					Number(existing.bytes) !== input.bytes ||
					Number(existing.preview_bytes) !== (input.previewBytes ?? 0)
				)
					throw new MediaError(
						"CONFLICT",
						"This upload key was already used for another file.",
						409,
					);
				return existing;
			}
			const pending =
				(
					await tx.query<{ n: number }>(
						"SELECT count(*)::int n FROM media_asset WHERE user_id=$1 AND state IN ('reserved','uploading','uploaded')",
						[userId],
					)
				).rows[0]?.n ?? 0;
			if (pending >= 2)
				throw new MediaError("UPLOAD_LIMIT", "Finish or cancel an existing upload first.", 429);
			const total = input.bytes + (input.previewBytes ?? 0);
			const reserved = await tx.query(
				"UPDATE storage_usage SET reserved_bytes=reserved_bytes+$2 WHERE user_id=$1 AND used_bytes+reserved_bytes+$2 <= $3 RETURNING user_id",
				[userId, total, STORAGE_LIMIT],
			);
			if (!reserved.rows.length)
				throw new MediaError(
					"QUOTA_EXCEEDED",
					"Your 10 GB allowance is full. Delete files or finish pending uploads first.",
					409,
				);
			const id = crypto.randomUUID();
			return (
				await tx.query<AssetRow>(
					"INSERT INTO media_asset(id,user_id,request_key,name,mime,bytes,preview_bytes,source_tool,object_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
					[
						id,
						userId,
						input.requestKey,
						input.name,
						input.mime,
						input.bytes,
						input.previewBytes ?? 0,
						input.sourceTool ?? null,
						`users/${userId}/${id}`,
					],
				)
			).rows[0] as AssetRow;
		});
	}
	async upload(
		userId: string,
		id: string,
		body: ReadableStream<Uint8Array>,
		preview: boolean,
		signal: AbortSignal,
	) {
		const row = await this.get(userId, id);
		if ((preview && row.preview_uploaded) || (!preview && row.content_uploaded)) return;
		if (row.expires_at.getTime() <= Date.now() || !["reserved", "uploaded"].includes(row.state))
			throw new MediaError("UPLOAD_STATE", "This upload is no longer available. Start again.", 409);
		if (
			this.active.has(id) ||
			this.active.size >= 4 ||
			[...this.active.values()].filter((a) => a.userId === userId).length >= 2
		)
			throw new MediaError("UPLOAD_LIMIT", "Uploads are busy. Try again shortly.", 429);
		const controller = new AbortController();
		let stop = () => {};
		const stopped = new Promise<void>((resolve) => {
			stop = resolve;
		});
		this.active.set(id, { userId, controller, stopped });
		try {
			const claimed = await this.pg.query(
				"UPDATE media_asset SET state='uploading', expires_at=now()+interval '2 minutes' WHERE id=$1 AND user_id=$2 AND state=$3 RETURNING id",
				[id, userId, row.state],
			);
			if (!claimed.rows.length)
				throw new MediaError("UPLOAD_STATE", "Another request is using this upload.", 409);
		} catch (error) {
			this.active.delete(id);
			stop();
			throw error;
		}

		const reader = body.getReader();
		const abort = () => {
			controller.abort();
			void reader.cancel().catch(() => {});
		};
		signal.addEventListener("abort", abort, { once: true });
		controller.signal.addEventListener(
			"abort",
			() => {
				void reader.cancel().catch(() => {});
			},
			{ once: true },
		);
		if (signal.aborted) abort();
		const heartbeat = setInterval(() => {
			void this.pg
				.query(
					"UPDATE media_asset SET expires_at=now()+interval '2 minutes' WHERE id=$1 AND state='uploading'",
					[id],
				)
				.catch(abort);
		}, 30_000);
		const timeout = setTimeout(abort, 30 * 60_000);
		const expected = Number(preview ? row.preview_bytes : row.bytes);
		let seen = 0;
		const hasher = new Bun.CryptoHasher("sha256");
		try {
			if (!expected) throw new MediaError("NO_PREVIEW", "No preview was reserved.");
			const first: Uint8Array[] = [];
			let prefixBytes = 0;
			while (prefixBytes < 8192) {
				const chunk = await reader.read();
				if (chunk.done) break;
				prefixBytes += chunk.value.length;
				if (prefixBytes > expected)
					throw new MediaError("FILE_SIZE", "The upload exceeds its reserved size.", 413);
				first.push(chunk.value);
			}
			const prefix = new Uint8Array(Math.min(prefixBytes, 8192));
			let offset = 0;
			for (const chunk of first) {
				const part = chunk.subarray(0, prefix.length - offset);
				prefix.set(part, offset);
				offset += part.length;
			}
			const mime = await validateContent(preview ? "preview.png" : row.name, prefix);
			if (preview) {
				const view = new DataView(prefix.buffer);
				if (prefix.length < 24 || view.getUint32(16) > 256 || view.getUint32(20) > 256)
					throw new MediaError("PREVIEW_SIZE", "Preview must be a PNG no larger than 256 pixels.");
			}
			const consume = (chunk: Uint8Array) => {
				if (controller.signal.aborted) throw new DOMException("Upload cancelled", "AbortError");
				seen += chunk.length;
				if (seen > expected)
					throw new MediaError("FILE_SIZE", "The upload exceeds its reserved size.", 413);
				hasher.update(chunk);
				return chunk;
			};
			let index = 0;
			const stream = new ReadableStream<Uint8Array>({
				async pull(out) {
					try {
						if (index < first.length) {
							out.enqueue(consume(first[index++] as Uint8Array));
							return;
						}
						const next = await reader.read();
						if (!next.done) {
							out.enqueue(consume(next.value));
							return;
						}
						if (controller.signal.aborted || seen !== expected)
							throw new MediaError("TRUNCATED", "The upload was interrupted or its size changed.");
						out.close();
					} catch (error) {
						out.error(error);
					}
				},
				cancel: () => reader.cancel(),
			});
			await this.objects.put(`${row.object_key}${preview ? "/preview" : "/content"}`, stream, mime);
			if (controller.signal.aborted) throw new DOMException("Upload cancelled", "AbortError");
			const saved = await this.pg.query(
				preview
					? "UPDATE media_asset SET preview_uploaded=true,state='uploaded',expires_at=now()+interval '10 minutes' WHERE id=$1 AND state='uploading' RETURNING id"
					: "UPDATE media_asset SET content_uploaded=true,mime=$2,sha256=$3,state='uploaded',expires_at=now()+interval '10 minutes' WHERE id=$1 AND state='uploading' RETURNING id",
				preview ? [id] : [id, mime, hasher.digest("hex")],
			);
			if (!saved.rows.length) throw new MediaError("UPLOAD_STATE", "Upload was cancelled.", 409);
		} catch (error) {
			await this.pg.query("UPDATE media_asset SET state='cleanup' WHERE id=$1 AND state!='ready'", [
				id,
			]);
			throw error;
		} finally {
			clearInterval(heartbeat);
			clearTimeout(timeout);
			signal.removeEventListener("abort", abort);
			await reader.cancel().catch(() => {});
			reader.releaseLock();
			this.active.delete(id);
			stop();
			const current = await this.get(userId, id);
			if (current.state === "cleanup") await this.clean(current);
		}
	}
	async complete(userId: string, id: string) {
		const row = await this.get(userId, id);
		if (row.state === "ready") return row;
		if (
			row.state !== "uploaded" ||
			!row.content_uploaded ||
			(Number(row.preview_bytes) && !row.preview_uploaded)
		)
			throw new MediaError("UPLOAD_STATE", "Upload all reserved content before saving.", 409);
		const main = await this.objects.stat(`${row.object_key}/content`);
		const thumb = Number(row.preview_bytes)
			? await this.objects.stat(`${row.object_key}/preview`)
			: null;
		if (
			main?.size !== Number(row.bytes) ||
			(Number(row.preview_bytes) && thumb?.size !== Number(row.preview_bytes))
		) {
			await this.cancel(userId, id);
			throw new MediaError("SIZE_MISMATCH", "Stored file verification failed. Try again.");
		}
		await this.pg.transaction(async (tx) => {
			const changed = await tx.query(
				"UPDATE media_asset SET state='ready',charged=true WHERE id=$1 AND user_id=$2 AND state='uploaded' RETURNING id",
				[id, userId],
			);
			if (!changed.rows.length) return;
			await tx.query(
				"UPDATE storage_usage SET used_bytes=used_bytes+$2,reserved_bytes=reserved_bytes-$2 WHERE user_id=$1",
				[userId, Number(row.bytes) + Number(row.preview_bytes)],
			);
		});
		const saved = await this.get(userId, id);
		if (saved.state !== "ready") throw new MediaError("UPLOAD_STATE", "Upload was cancelled.", 409);
		return saved;
	}
	async cancel(userId: string, id: string) {
		const row = await this.get(userId, id);
		if (row.state === "cancelled") return;
		await this.pg.query(
			"UPDATE media_asset SET state=CASE WHEN charged THEN 'deleting' ELSE 'cleanup' END WHERE id=$1 AND user_id=$2 AND state!='cancelled'",
			[id, userId],
		);
		const active = this.active.get(id);
		if (active) {
			active.controller.abort();
			await active.stopped;
		}
		await this.clean(await this.get(userId, id));
	}
	private async clean(row: AssetRow) {
		if (this.active.has(row.id) || !["cleanup", "deleting"].includes(row.state)) return;
		try {
			for (const part of ["content", "preview"]) {
				await this.objects.remove(`${row.object_key}/${part}`);
				if (await this.objects.stat(`${row.object_key}/${part}`))
					throw new Error("Object still present");
			}
			await this.pg.transaction(async (tx) => {
				const changed = await tx.query<AssetRow>(
					"UPDATE media_asset SET state='cancelled',cleanup_error=false WHERE id=$1 AND state IN ('cleanup','deleting') RETURNING *",
					[row.id],
				);
				const current = changed.rows[0];
				if (!current) return;
				await tx.query(
					current.charged
						? "UPDATE storage_usage SET used_bytes=used_bytes-$2 WHERE user_id=$1"
						: "UPDATE storage_usage SET reserved_bytes=reserved_bytes-$2 WHERE user_id=$1",
					[current.user_id, Number(current.bytes) + Number(current.preview_bytes)],
				);
			});
		} catch {
			await this.pg.query(
				"UPDATE media_asset SET cleanup_error=true,expires_at=now()+interval '1 minute' WHERE id=$1 AND state IN ('cleanup','deleting')",
				[row.id],
			);
		}
	}
	async reconcile() {
		const expired = await this.pg.query<AssetRow>(
			"SELECT * FROM media_asset WHERE state IN ('cleanup','deleting') OR (state IN ('reserved','uploading','uploaded') AND expires_at < now()) ORDER BY expires_at LIMIT 100",
		);
		for (const row of expired.rows) {
			if (this.active.has(row.id)) continue;
			await this.pg.query(
				"UPDATE media_asset SET state=CASE WHEN charged THEN 'deleting' ELSE 'cleanup' END WHERE id=$1 AND state!='ready' AND state!='cancelled'",
				[row.id],
			);
			await this.clean(await this.get(row.user_id, row.id));
		}
	}
}
