import { expect, test } from "bun:test";
import type { FileJob } from "./file-jobs";
import { FileQueue } from "./file-queue";

function gate() {
	let resolve: () => void = () => {};
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve };
}
test("queue serializes later batches and retains captured settings", async () => {
	let jobs: FileJob[] = [];
	const queue = new FileQueue((list) => {
		jobs = list;
	});
	const first = gate();
	const finished = gate();
	const order: string[] = [];
	queue.add([new File(["a"], "a")], async () => {
		order.push("a");
		await first.promise;
		return { blob: new Blob(["a"]), name: "a-original" };
	});
	queue.add([new File(["b"], "b")], async () => {
		order.push("b");
		finished.resolve();
		return { blob: new Blob(["b"]), name: "b-new-settings" };
	});
	expect(order).toEqual(["a"]);
	first.resolve();
	await finished.promise;
	await Promise.resolve();
	expect(order).toEqual(["a", "b"]);
	expect(jobs.map((j) => j.result?.name)).toEqual(["a-original", "b-new-settings"]);
});
test("removing active and queued jobs cancels work without publishing stale results", async () => {
	let jobs: FileJob[] = [];
	const queue = new FileQueue((list) => {
		jobs = list;
	});
	const first = gate();
	let signal: AbortSignal | undefined;
	let queuedRan = false;
	queue.add([new File(["a"], "a")], async (_file, options) => {
		signal = options.signal;
		await first.promise;
		return { blob: new Blob(), name: "stale" };
	});
	queue.add([new File(["b"], "b")], async () => {
		queuedRan = true;
		return undefined;
	});
	for (const job of [...jobs]) queue.remove(job.id);
	expect(signal?.aborted).toBe(true);
	first.resolve();
	await Promise.resolve();
	await Promise.resolve();
	expect(jobs).toEqual([]);
	expect(queuedRan).toBe(false);
});
test("queue can reactivate after development lifecycle cleanup", async () => {
	const done = gate();
	let ran = false;
	const queue = new FileQueue(() => {});
	queue.dispose();
	queue.activate();
	queue.add([new File(["a"], "a")], async () => {
		ran = true;
		done.resolve();
		return undefined;
	});
	await done.promise;
	expect(ran).toBe(true);
});
