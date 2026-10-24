import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { userMigrations } from "./user-migrations";
import * as schema from "./user-schema";

export async function migrateUsers(pg: PGlite) {
	await pg.exec(
		"CREATE TABLE IF NOT EXISTS user_migration (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
	);
	for (const migration of userMigrations) {
		await pg.transaction(async (tx) => {
			if ((await tx.query("SELECT id FROM user_migration WHERE id=$1", [migration.id])).rows.length)
				return;
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
const globalDb = globalThis as typeof globalThis & {
	__qbtoolsUserDbs?: Map<string, Promise<UserDb>>;
};
if (!globalDb.__qbtoolsUserDbs) globalDb.__qbtoolsUserDbs = new Map<string, Promise<UserDb>>();
const connections = globalDb.__qbtoolsUserDbs;
/** One connection per datadir, including during Vite server hot reloads. */
export function getUserDb() {
	const directory = process.env.PGLITE_DATA_DIR ?? "./data/users";
	let connection = connections.get(directory);
	if (!connection) {
		connection = createUserDb(directory).catch((error) => {
			connections.delete(directory);
			throw error;
		});
		connections.set(directory, connection);
	}
	return connection;
}

export async function ensureUserData(pg: PGlite, userId: string) {
	await pg.transaction(async (tx) => {
		await tx.query("INSERT INTO user_preferences(user_id) VALUES ($1) ON CONFLICT DO NOTHING", [
			userId,
		]);
		await tx.query("INSERT INTO storage_usage(user_id) VALUES ($1) ON CONFLICT DO NOTHING", [
			userId,
		]);
	});
}

export type { PGlite } from "@electric-sql/pglite";
