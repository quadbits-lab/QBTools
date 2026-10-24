import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
	text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
	integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date());

export const contactMessages = sqliteTable("contact_messages", {
	id: id(),
	name: text("name").notNull(),
	email: text("email").notNull(),
	subject: text("subject").notNull(),
	message: text("message").notNull(),
	status: text("status", { enum: ["new", "done"] })
		.notNull()
		.default("new"),
	createdAt: createdAt(),
});

export const toolSuggestions = sqliteTable("tool_suggestions", {
	id: id(),
	title: text("title").notNull(),
	details: text("details").notNull().default(""),
	category: text("category"),
	email: text("email"),
	votes: integer("votes").notNull().default(1),
	status: text("status", { enum: ["new", "planned", "shipped", "declined"] })
		.notNull()
		.default("new"),
	createdAt: createdAt(),
});

export const serviceLeads = sqliteTable("service_leads", {
	id: id(),
	name: text("name").notNull(),
	email: text("email").notNull(),
	company: text("company").notNull().default(""),
	service: text("service").notNull(),
	budget: text("budget").notNull().default(""),
	message: text("message").notNull(),
	status: text("status", { enum: ["new", "contacted", "won", "lost"] })
		.notNull()
		.default("new"),
	createdAt: createdAt(),
});

export const premiumWaitlist = sqliteTable("premium_waitlist", {
	id: id(),
	email: text("email").notNull().unique(),
	interest: text("interest").notNull().default(""),
	createdAt: createdAt(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type ToolSuggestion = typeof toolSuggestions.$inferSelect;
export type ServiceLead = typeof serviceLeads.$inferSelect;
export type WaitlistEntry = typeof premiumWaitlist.$inferSelect;
