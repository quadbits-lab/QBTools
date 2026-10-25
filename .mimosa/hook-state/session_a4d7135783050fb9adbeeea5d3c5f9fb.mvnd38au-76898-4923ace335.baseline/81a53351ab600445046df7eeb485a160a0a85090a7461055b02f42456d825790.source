import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrations } from "./migrations";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

/** Apply pending migrations inside one transaction each. Returns applied ids. */
export function migrate(sqlite: Database): string[] {
	sqlite.run(
		"CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY NOT NULL, applied_at INTEGER NOT NULL)",
	);
	const done = new Set(
		sqlite
			.query<{ id: string }, []>("SELECT id FROM _migrations")
			.all()
			.map((row) => row.id),
	);
	const applied: string[] = [];
	for (const migration of migrations) {
		if (done.has(migration.id)) continue;
		sqlite.transaction(() => {
			sqlite.run(migration.sql);
			sqlite.run("INSERT INTO _migrations (id, applied_at) VALUES (?, ?)", [
				migration.id,
				Date.now(),
			]);
		})();
		applied.push(migration.id);
	}
	return applied;
}

export function createDb(path: string) {
	if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
	const sqlite = new Database(path, { create: true, strict: true });
	sqlite.run("PRAGMA journal_mode = WAL");
	sqlite.run("PRAGMA busy_timeout = 5000");
	sqlite.run("PRAGMA foreign_keys = ON");
	sqlite.run("PRAGMA synchronous = NORMAL");
	migrate(sqlite);
	return Object.assign(drizzle(sqlite, { schema }), { sqlite });
}

let shared: Db | undefined;

/** Process-wide connection, opened lazily from DATABASE_PATH. */
export function getDb(): Db {
	shared ??= createDb(process.env.DATABASE_PATH ?? "./data/qbtools.db");
	return shared;
}
