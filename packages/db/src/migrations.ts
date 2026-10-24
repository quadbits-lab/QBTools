/**
 * Forward-only SQL migrations, embedded in code so the bundled server needs
 * no migration files on disk. Append new entries; never edit applied ones.
 */
export const migrations: { id: string; sql: string }[] = [
	{
		id: "0001_init",
		sql: `
CREATE TABLE contact_messages (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	email TEXT NOT NULL,
	subject TEXT NOT NULL,
	message TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'new',
	created_at INTEGER NOT NULL
);
CREATE INDEX contact_messages_created_idx ON contact_messages (created_at);

CREATE TABLE tool_suggestions (
	id TEXT PRIMARY KEY NOT NULL,
	title TEXT NOT NULL,
	details TEXT NOT NULL DEFAULT '',
	category TEXT,
	email TEXT,
	votes INTEGER NOT NULL DEFAULT 1,
	status TEXT NOT NULL DEFAULT 'new',
	created_at INTEGER NOT NULL
);
CREATE INDEX tool_suggestions_votes_idx ON tool_suggestions (votes);

CREATE TABLE service_leads (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	email TEXT NOT NULL,
	company TEXT NOT NULL DEFAULT '',
	service TEXT NOT NULL,
	budget TEXT NOT NULL DEFAULT '',
	message TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'new',
	created_at INTEGER NOT NULL
);

CREATE TABLE premium_waitlist (
	id TEXT PRIMARY KEY NOT NULL,
	email TEXT NOT NULL UNIQUE,
	interest TEXT NOT NULL DEFAULT '',
	created_at INTEGER NOT NULL
);
`,
	},
];
