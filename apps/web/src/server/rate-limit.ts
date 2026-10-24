/**
 * In-memory fixed-window limiter keyed by bucket + client. Good for a single
 * container; swap for Redis if you ever run several replicas.
 */
export function createRateLimiter(options: { limit: number; windowMs: number; now?: () => number }) {
	const now = options.now ?? Date.now;
	const hits = new Map<string, { count: number; resetAt: number }>();

	return {
		/** Returns ok=false with seconds until reset once the limit is hit. */
		take(key: string): { ok: true; remaining: number } | { ok: false; retryAfter: number } {
			const t = now();
			let entry = hits.get(key);
			if (!entry || entry.resetAt <= t) {
				entry = { count: 0, resetAt: t + options.windowMs };
				hits.set(key, entry);
			}
			if (entry.count >= options.limit) {
				return { ok: false, retryAfter: Math.ceil((entry.resetAt - t) / 1000) };
			}
			entry.count += 1;
			// Opportunistic cleanup so the map can't grow without bound.
			if (hits.size > 10_000) {
				for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
			}
			return { ok: true, remaining: options.limit - entry.count };
		},
		size: () => hits.size,
	};
}
