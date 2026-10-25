import { afterAll, beforeAll, expect, test } from "bun:test";
import { createUserDb, type UserDb } from "@qbtools/db/users";
import { MediaService } from "./media-service";
import { getObjectStore } from "./object-store";

const enabled = process.env.QBTOOLS_RUSTFS_TEST === "1";
let database: UserDb;
let service: MediaService;
const userId = `rustfs-${crypto.randomUUID()}`;
beforeAll(async () => {
	if (!enabled) return;
	Object.assign(process.env, {
		S3_ENDPOINT: "http://127.0.0.1:19000",
		S3_BUCKET: "qbtools-test",
		S3_REGION: "us-east-1",
		S3_ACCESS_KEY_ID: "qbtools-test-access",
		S3_SECRET_ACCESS_KEY: "qbtools-disposable-test-secret",
	});
	database = await createUserDb();
	await database.pg.query(
		"INSERT INTO auth_user(id,name,email,created_at,updated_at) VALUES($1,$1,$2,now(),now())",
		[userId, `${userId}@example.test`],
	);
	service = new MediaService(database.pg, getObjectStore());
}, 20000);
afterAll(async () => {
	if (database) await database.pg.close();
});
test.skipIf(!enabled)(
	"Bun native S3 writes, verifies, range reads, and deletes on RustFS",
	async () => {
		const row = await service.reserve(userId, {
			requestKey: crypto.randomUUID(),
			name: "native.txt",
			mime: "text/plain",
			bytes: 11,
		});
		await service.upload(
			userId,
			row.id,
			new Blob(["hello world"]).stream(),
			false,
			new AbortController().signal,
		);
		await service.complete(userId, row.id);
		expect(
			await new Response(service.objects.read(`${row.object_key}/content`, 6, 11)).text(),
		).toBe("world");
		await service.cancel(userId, row.id);
		expect((await service.usage(userId)).used).toBe(0);
	},
	30000,
);
test.skipIf(!enabled)(
	"100 MB streams through native multipart without a complete input buffer",
	async () => {
		const size = 100_000_000;
		const row = await service.reserve(userId, {
			requestKey: crypto.randomUUID(),
			name: "large.txt",
			mime: "text/plain",
			bytes: size,
		});
		let sent = 0;
		const chunk = new Uint8Array(64 * 1024).fill(65);
		const stream = new ReadableStream<Uint8Array>({
			pull(controller) {
				if (sent === size) {
					controller.close();
					return;
				}
				const part = chunk.subarray(0, Math.min(chunk.length, size - sent));
				sent += part.length;
				controller.enqueue(part);
			},
		});
		await service.upload(userId, row.id, stream, false, new AbortController().signal);
		await service.complete(userId, row.id);
		expect((await service.usage(userId)).used).toBe(size);
		await service.cancel(userId, row.id);
	},
	60000,
);
test.skipIf(!enabled)(
	"multipart failure removes partial data and refunds reservation",
	async () => {
		const row = await service.reserve(userId, {
			requestKey: crypto.randomUUID(),
			name: "interrupted.txt",
			mime: "text/plain",
			bytes: 10_000_000,
		});
		let count = 0;
		const stream = new ReadableStream<Uint8Array>({
			pull(c) {
				if (count++ < 100) c.enqueue(new Uint8Array(65536).fill(65));
				else c.error(new Error("connection lost"));
			},
		});
		await expect(
			service.upload(userId, row.id, stream, false, new AbortController().signal),
		).rejects.toThrow();
		expect((await service.usage(userId)).reserved).toBe(0);
		expect(await service.objects.stat(`${row.object_key}/content`)).toBeNull();
	},
	30000,
);
