import { contactMessages, count, desc, getDb, premiumWaitlist, serviceLeads, toolSuggestions } from "@qbtools/db";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getEnv } from "./env";
import { createRateLimiter } from "./rate-limit";
import { clientKey } from "./request";

const COOKIE = "qb_admin";

/** The cookie holds an HMAC of the token, never the token itself. */
function sessionValue(token: string) {
	return createHmac("sha256", token).update("qbtools-admin-session-v1").digest("hex");
}

function safeEqual(a: string, b: string) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function isAdmin(): boolean {
	const token = getEnv().ADMIN_TOKEN;
	const cookie = getCookie(COOKIE);
	return Boolean(token && cookie && safeEqual(cookie, sessionValue(token)));
}

const loginLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60_000 });

export const adminLoginFn = createServerFn({ method: "POST" })
	.validator(z.object({ token: z.string().min(1).max(500) }))
	.handler(async ({ data }) => {
		const token = getEnv().ADMIN_TOKEN;
		if (!token) return { ok: false as const, error: "Admin is disabled. Set ADMIN_TOKEN (16+ characters) to enable it." };
		if (!loginLimiter.take(clientKey()).ok) return { ok: false as const, error: "Too many attempts. Try again later." };
		if (!safeEqual(data.token, token)) return { ok: false as const, error: "That token isn't right." };
		setCookie(COOKIE, sessionValue(token), {
			httpOnly: true,
			sameSite: "strict",
			secure: getEnv().NODE_ENV === "production",
			path: "/",
			maxAge: 60 * 60 * 12,
		});
		return { ok: true as const };
	});

export const adminLogoutFn = createServerFn({ method: "POST" }).handler(async () => {
	deleteCookie(COOKIE, { path: "/" });
	return { ok: true as const };
});

export const adminDataFn = createServerFn({ method: "GET" }).handler(async () => {
	if (!isAdmin()) return { authorized: false as const, enabled: Boolean(getEnv().ADMIN_TOKEN) };
	const db = getDb();
	const [contacts, suggestions, leads, waitlist, waitlistCount] = await Promise.all([
		db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200),
		db.select().from(toolSuggestions).orderBy(desc(toolSuggestions.votes), desc(toolSuggestions.createdAt)).limit(200),
		db.select().from(serviceLeads).orderBy(desc(serviceLeads.createdAt)).limit(200),
		db.select().from(premiumWaitlist).orderBy(desc(premiumWaitlist.createdAt)).limit(200),
		db.select({ n: count() }).from(premiumWaitlist),
	]);
	const iso = <T extends { createdAt: Date }>(rows: T[]) => rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
	return {
		authorized: true as const,
		contacts: iso(contacts),
		suggestions: iso(suggestions),
		leads: iso(leads),
		waitlist: iso(waitlist),
		waitlistTotal: waitlistCount[0]?.n ?? 0,
	};
});
