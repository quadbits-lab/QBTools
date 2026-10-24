import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { userMigrations } from "./user-migrations";
import * as schema from "./user-schema";

export async function migrateUsers(pg: PGlite) {
	await pg.exec("CREATE TABLE IF NOT EXISTS user_migration (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
	for (const migration of userMigrations) {
		await pg.transaction(async (tx) => {
			if ((await tx.query("SELECT id FROM user_migration WHERE id=$1", [migration.id])).rows.length) return;
			await tx.exec(migration.sql);
			await tx.query("INSERT INTO user_migration(id) VALUES ($1)", [migration.id]);
		});
	}
}

export async function createUserDb(path?: string) {
	const pg = await PGlite.create(path ?? "memory://");
	await migrateUsers(pg);
	return { pg, db: drizzle(pg, { schema }) };
}
export type UserDb = Awaited<ReturnType<typeof createUserDb>>;
let shared: Promise<UserDb> | undefined;
/** One owner process per datadir; initialization is never performed in a browser. */
export function getUserDb() {
	shared ??= createUserDb(process.env.PGLITE_DATA_DIR ?? "./data/users").catch((error) => {
		shared = undefined;
		throw error;
	});
	return shared;
}

export async function ensureUserData(pg: PGlite, userId: string) {
	await pg.transaction(async (tx) => {
		await tx.query("INSERT INTO user_preferences(user_id) VALUES ($1) ON CONFLICT DO NOTHING", [userId]);
		await tx.query("INSERT INTO storage_usage(user_id) VALUES ($1) ON CONFLICT DO NOTHING", [userId]);
	});
}
