import { z } from "zod";

/** Shared by forms (client hints) and server functions (the real check). */
const email = z.string().trim().toLowerCase().email("Please enter a valid email address").max(200);
const honeypot = z.string().max(0).optional().or(z.string().transform(() => "bot"));

export const contactSchema = z.object({
	name: z.string().trim().min(2, "Please enter your name").max(100),
	email,
	subject: z.string().trim().min(3, "Please add a subject").max(150),
	message: z.string().trim().min(10, "Please write at least 10 characters").max(5000),
	website: honeypot,
});

export const suggestionSchema = z.object({
	title: z.string().trim().min(3, "What tool would you like?").max(120),
	details: z.string().trim().max(2000).optional(),
	category: z.string().trim().max(40).optional(),
	email: z.union([email, z.literal("")]).optional(),
	website: honeypot,
});

export const SERVICES = ["Custom tool or calculator", "Website", "Design & branding", "SEO & content", "Bulk processing / API", "Other"] as const;
export const BUDGETS = ["Under $500", "$500–$2,000", "$2,000–$10,000", "$10,000+", "Not sure yet"] as const;

export const leadSchema = z.object({
	name: z.string().trim().min(2, "Please enter your name").max(100),
	email,
	company: z.string().trim().max(120).optional(),
	service: z.enum(SERVICES),
	budget: z.string().trim().max(40).optional(),
	message: z.string().trim().min(10, "Tell us a little about the project").max(5000),
	website: honeypot,
});

export const waitlistSchema = z.object({
	email,
	interest: z.string().trim().max(200).optional(),
	website: honeypot,
});

/** First error message per field, for inline display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = String(issue.path[0] ?? "form");
		out[key] ??= issue.message;
	}
	return out;
}
