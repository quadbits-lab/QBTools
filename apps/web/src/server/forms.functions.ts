import {
	contactMessages,
	getDb,
	premiumWaitlist,
	serviceLeads,
	sql,
	toolSuggestions,
} from "@qbtools/db";
import { createServerFn } from "@tanstack/react-start";
import { contactSchema, leadSchema, suggestionSchema, waitlistSchema } from "#/lib/form-schemas";
import { getEnv } from "./env";
import { createRateLimiter } from "./rate-limit";
import { clientKey } from "./request";

export type FormResult = { ok: true; message: string } | { ok: false; error: string };

let limiter: ReturnType<typeof createRateLimiter> | undefined;
function guard(bucket: string, honeypot: string | undefined): FormResult | null {
	// Bots fill the hidden field; pretend success so they don't retry.
	if (honeypot) return { ok: true, message: "Thanks!" };
	limiter ??= createRateLimiter({ limit: getEnv().RATE_LIMIT_FORMS_PER_HOUR, windowMs: 3_600_000 });
	const result = limiter.take(`${bucket}:${clientKey()}`);
	return result.ok
		? null
		: {
				ok: false,
				error: `Too many submissions. Please try again in ${Math.ceil(result.retryAfter / 60)} minutes.`,
			};
}

export const submitContact = createServerFn({ method: "POST" })
	.validator(contactSchema)
	.handler(async ({ data }): Promise<FormResult> => {
		const blocked = guard("contact", data.website);
		if (blocked) return blocked;
		await getDb()
			.insert(contactMessages)
			.values({ name: data.name, email: data.email, subject: data.subject, message: data.message });
		return {
			ok: true,
			message: "Thanks! Your message has been sent. We usually reply within 2 working days.",
		};
	});

export const submitSuggestion = createServerFn({ method: "POST" })
	.validator(suggestionSchema)
	.handler(async ({ data }): Promise<FormResult> => {
		const blocked = guard("suggest", data.website);
		if (blocked) return blocked;
		const db = getDb();
		// Same idea suggested again (case-insensitive)? Count it as a vote.
		const existing = await db
			.select({ id: toolSuggestions.id })
			.from(toolSuggestions)
			.where(sql`lower(${toolSuggestions.title}) = lower(${data.title})`)
			.limit(1);
		if (existing[0]) {
			await db
				.update(toolSuggestions)
				.set({ votes: sql`${toolSuggestions.votes} + 1` })
				.where(sql`${toolSuggestions.id} = ${existing[0].id}`);
			return {
				ok: true,
				message: "Great minds! Someone suggested this too — we've added your vote.",
			};
		}
		await db.insert(toolSuggestions).values({
			title: data.title,
			details: data.details ?? "",
			category: data.category || null,
			email: data.email || null,
		});
		return { ok: true, message: "Thank you! Your idea has been added to our list." };
	});

export const submitLead = createServerFn({ method: "POST" })
	.validator(leadSchema)
	.handler(async ({ data }): Promise<FormResult> => {
		const blocked = guard("lead", data.website);
		if (blocked) return blocked;
		await getDb()
			.insert(serviceLeads)
			.values({
				name: data.name,
				email: data.email,
				company: data.company ?? "",
				service: data.service,
				budget: data.budget ?? "",
				message: data.message,
			});
		return {
			ok: true,
			message: "Thanks! We'll email you within 1–2 working days with next steps.",
		};
	});

export const joinWaitlist = createServerFn({ method: "POST" })
	.validator(waitlistSchema)
	.handler(async ({ data }): Promise<FormResult> => {
		const blocked = guard("waitlist", data.website);
		if (blocked) return blocked;
		await getDb()
			.insert(premiumWaitlist)
			.values({ email: data.email.toLowerCase(), interest: data.interest ?? "" })
			.onConflictDoNothing();
		return { ok: true, message: "You're on the list! We'll email you when Premium launches." };
	});
