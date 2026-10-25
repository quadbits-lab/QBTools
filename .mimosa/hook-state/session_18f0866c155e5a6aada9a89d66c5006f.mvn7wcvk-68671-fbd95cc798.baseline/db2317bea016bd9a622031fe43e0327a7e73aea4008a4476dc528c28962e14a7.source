export interface ObjectStore {
	put(key: string, body: ReadableStream<Uint8Array>, type: string): Promise<void>;
	stat(key: string): Promise<{ size: number } | null>;
	remove(key: string): Promise<void>;
	read(key: string, start?: number, end?: number): ReadableStream<Uint8Array>;
}
export function storageConfigured() {
	return Boolean(
		process.env.S3_ENDPOINT &&
			process.env.S3_BUCKET &&
			process.env.S3_ACCESS_KEY_ID &&
			process.env.S3_SECRET_ACCESS_KEY,
	);
}
let store: ObjectStore | undefined;
export function getObjectStore(): ObjectStore {
	if (!storageConfigured()) throw new Error("Media Storage is not configured.");
	if (store) return store;
	const client = new Bun.S3Client({
		endpoint: process.env.S3_ENDPOINT,
		bucket: process.env.S3_BUCKET,
		accessKeyId: process.env.S3_ACCESS_KEY_ID,
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
		region: process.env.S3_REGION ?? "us-east-1",
		virtualHostedStyle: false,
	});
	store = {
		async put(key, body, type) {
			const writer = client
				.file(key)
				.writer({ type, partSize: 5 * 1024 * 1024, queueSize: 1, retry: 2 });
			const reader = body.getReader();
			let pending = 0;
			try {
				for (;;) {
					const next = await reader.read();
					if (next.done) break;
					await writer.write(next.value);
					pending += next.value.length;
					if (pending >= 5 * 1024 * 1024) {
						await writer.flush();
						pending = 0;
					}
				}
				await writer.end();
			} catch (error) {
				await reader.cancel(error).catch(() => {});
				try {
					await writer.end(error instanceof Error ? error : new Error("Upload interrupted"));
				} catch {
					/* Native S3 aborts the multipart upload. */
				}
				throw error;
			} finally {
				reader.releaseLock();
			}
		},
		async stat(key) {
			try {
				const result = await client.file(key).stat();
				return { size: result.size };
			} catch (error) {
				if (
					error instanceof Error &&
					"code" in error &&
					["NoSuchKey", "NotFound", "404"].includes(String(error.code))
				)
					return null;
				throw error;
			}
		},
		async remove(key) {
			await client.file(key).delete();
		},
		read(key, start, end) {
			const file = client.file(key);
			return start === undefined ? file.stream() : file.slice(start, end).stream();
		},
	};
	return store;
}
