import { test } from "bun:test";

test("default import shape", async () => {
	const mod = await import("opentype.js");
	const d = (mod as unknown as Record<string, unknown>).default;
	console.log(
		"keys:",
		Object.keys(mod).slice(0, 8),
		"default type:",
		typeof d,
		"default?.parse:",
		typeof (d as { parse?: unknown })?.parse,
	);
});
