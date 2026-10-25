import { expect, test } from "bun:test";
import { createRateLimiter } from "./rate-limit";

test("limits per key and resets after the window", () => {
	let t = 0;
	const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
	expect(limiter.take("a").ok).toBe(true);
	expect(limiter.take("a").ok).toBe(true);
	const blocked = limiter.take("a");
	expect(blocked.ok).toBe(false);
	if (!blocked.ok) expect(blocked.retryAfter).toBe(1);
	expect(limiter.take("b").ok).toBe(true);
	t = 1000;
	expect(limiter.take("a").ok).toBe(true);
});
