import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createUserDb, migrateUsers, type UserDb } from "@qbtools/db/users";
import { FILE_LIMIT, STORAGE_LIMIT, safeReturnPath } from "../lib/media-contract";
import { MediaService } from "./media-service";
import { parseRange, validateContent } from "./media-validation";
import type { ObjectStore } from "./object-store";

class MemoryObjects implements ObjectStore {
	files = new Map<string, Uint8Array>();
	failDelete = false;
	async put(key: string, body: ReadableStream<Uint8Array>) {
		const result = await new Response(body).bytes();
		this.files.set(key, result);
	}
	async stat(key: string) {
		const bytes = this.files.get(key);
		return bytes ? { size: bytes.length } : null;
	}
	async remove(key: string) {
		if (this.failDelete) throw new Error("offline");
		this.files.delete(key);
	}
	read(key: string, start = 0, end?: number) {
		return new Blob([this.files.get(key)?.slice(start, end) as BlobPart]).stream();
	}
}
let database: UserDb;
let objects: MemoryObjects;
let service: MediaService;
const reserve = (bytes = 5, name = "test.txt", user = "alice", requestKey = crypto.randomUUID()) =>
	service.reserve(user, { requestKey, name, mime: "text/plain", bytes });
const upload = (id: string, text = "hello", user = "alice") =>
	service.upload(user, id, new Blob([text]).stream(), false, new AbortController().signal);
beforeAll(async () => {
	database = await createUserDb();
	for (const id of ["alice", "bob", "charlie", "dana", "eli"])
		await database.pg.query(
			"INSERT INTO auth_user(id,name,email,created_at,updated_at) VALUES($1,$1,$2,now(),now())",
			[id, `${id}@example.test`],
		);
}, 20000);
afterAll(async () => {
	await database.pg.close();
});
beforeEach(async () => {
	await database.pg.exec("TRUNCATE media_asset, storage_usage, user_preferences CASCADE");
	objects = new MemoryObjects();
	service = new MediaService(database.pg, objects);
});
describe("strict media accounting", () => {
	test("migrations repeat without modifying existing data", async () => {
		await migrateUsers(database.pg);
		expect((await database.pg.query("SELECT id FROM auth_user")).rows.length).toBe(5);
	});
	test("accepts exact limit and rejects one byte over", async () => {
		await service.usage("alice");
		await database.pg.query("UPDATE storage_usage SET used_bytes=$1 WHERE user_id='alice'", [
			STORAGE_LIMIT - 5,
		]);
		const row = await reserve();
		await expect(reserve(1, "other.txt")).rejects.toThrow("10 GB");
		await upload(row.id);
		await service.complete("alice", row.id);
		expect((await service.usage("alice")).used).toBe(STORAGE_LIMIT);
	});
	test("concurrent reservations cannot oversubscribe", async () => {
		await service.usage("alice");
		await database.pg.query("UPDATE storage_usage SET used_bytes=$1 WHERE user_id='alice'", [
			STORAGE_LIMIT - 10,
		]);
		const results = await Promise.allSettled([reserve(6), reserve(6)]);
		expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
		expect((await service.usage("alice")).reserved).toBe(6);
	});
	test("reservation and completion are idempotent", async () => {
		const key = crypto.randomUUID();
		const a = await reserve(5, "test.txt", "alice", key);
		const b = await reserve(5, "test.txt", "alice", key);
		expect(a.id).toBe(b.id);
		await upload(a.id);
		await Promise.all([service.complete("alice", a.id), service.complete("alice", a.id)]);
		expect(await service.usage("alice")).toMatchObject({ used: 5, reserved: 0 });
	});
	test("the database rejects impossible counters", async () => {
		await service.usage("alice");
		await expect(
			database.pg.query("UPDATE storage_usage SET used_bytes=$1 WHERE user_id='alice'", [
				STORAGE_LIMIT + 1,
			]),
		).rejects.toThrow();
	});
	test("file size and filename validation", async () => {
		await expect(reserve(0)).rejects.toThrow();
		await expect(reserve(FILE_LIMIT + 1)).rejects.toThrow();
		expect((await reserve(FILE_LIMIT)).bytes).toBe(FILE_LIMIT);
		await expect(reserve(5, "../secret.txt")).rejects.toThrow();
		await expect(reserve(5, "script.html")).rejects.toThrow();
	});
	test("truncated and excessive streams never publish assets", async () => {
		for (const text of ["hi", "hello!"]) {
			const row = await reserve();
			await expect(upload(row.id, text)).rejects.toThrow();
			expect((await service.get("alice", row.id)).state).toBe("cancelled");
			expect((await service.usage("alice")).reserved).toBe(0);
		}
	});
	test("mismatched content is rejected", async () => {
		const row = await reserve(5, "fake.png");
		await expect(upload(row.id)).rejects.toThrow();
		expect(objects.files.size).toBe(0);
	});
	test("failed cleanup retains quota and can retry", async () => {
		const row = await reserve();
		await upload(row.id);
		await service.complete("alice", row.id);
		objects.failDelete = true;
		await service.cancel("alice", row.id);
		expect((await service.usage("alice")).used).toBe(5);
		objects.failDelete = false;
		await service.reconcile();
		await service.cancel("alice", row.id);
		expect((await service.usage("alice")).used).toBe(0);
	});
	test("expired reservations are recovered", async () => {
		const row = await reserve();
		await database.pg.query(
			"UPDATE media_asset SET expires_at=now()-interval '1 hour' WHERE id=$1",
			[row.id],
		);
		await service.reconcile();
		expect((await service.usage("alice")).reserved).toBe(0);
	});
	test("cross-user access and cancellation are rejected", async () => {
		const row = await reserve();
		await expect(service.get("bob", row.id)).rejects.toThrow("not found");
		await expect(service.cancel("bob", row.id)).rejects.toThrow();
	});
	test("missing stored content cannot complete", async () => {
		const row = await reserve();
		await upload(row.id);
		objects.files.clear();
		await expect(service.complete("alice", row.id)).rejects.toThrow("verification");
		expect((await service.usage("alice")).reserved).toBe(0);
	});
	test("limits unfinished reservations per user", async () => {
		await reserve();
		await reserve();
		await expect(reserve()).rejects.toThrow("existing upload");
	});
	test("cancelled request refunds reservation", async () => {
		const row = await reserve();
		const controller = new AbortController();
		controller.abort();
		await expect(
			service.upload("alice", row.id, new Blob(["hello"]).stream(), false, controller.signal),
		).rejects.toThrow();
		expect((await service.usage("alice")).reserved).toBe(0);
	});
});
test("safe ranges and return destinations", () => {
	expect(parseRange("bytes=1-3", 5)).toEqual({ start: 1, end: 3 });
	expect(parseRange("bytes=-2", 5)).toEqual({ start: 3, end: 4 });
	expect(() => parseRange("bytes=8-", 5)).toThrow();
	expect(() => parseRange("bytes=0-1,3-4", 5)).toThrow();
	for (const value of [
		"//evil.test",
		"/\\evil.test",
		"/%2f%2fevil.test",
		"/api/media/x",
		"https://evil.test",
	]) {
		expect(safeReturnPath(value)).toBe("/dashboard");
	}
	expect(safeReturnPath("/tools/compress-image")).toBe("/tools/compress-image");
});
test("existing encrypted format and text samples", async () => {
	expect(
		await validateContent("document.enc", new TextEncoder().encode("QBEN" + "x".repeat(60))),
	).toBe("application/octet-stream");
	await expect(validateContent("fake.enc", new Uint8Array(12))).rejects.toThrow();
	expect(await validateContent("project.json", new TextEncoder().encode('{"version":1}'))).toBe(
		"application/json",
	);
	await expect(validateContent("bad.txt", new Uint8Array([0, 1, 2]))).rejects.toThrow();
});
