import "@tanstack/react-start/server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getUserDb } from "@qbtools/db/users";

/**
 * CLI API tokens: independent of better-auth plugins. A token is shown once
 * at creation (`qbk_…`); the server stores only its SHA-256 hash. Requests
 * present it as `Authorization: Bearer qbk_…`, which skips cookie/CSRF
 * handling because no ambient credential is involved.
 */

export interface CliTokenUser {
	id: string;
	name: string;
	email: string;
	authKind: "cli-token";
}

const TOKEN_PREFIX = "qbk_";
const TOKEN_TTL_DAYS = 365;

export function generateCliToken(): { token: string; tokenHash: string } {
	const token = `${TOKEN_PREFIX}${randomBytes(24).toString("base64url")}`;
	return { token, tokenHash: hashCliToken(token) };
}

export function hashCliToken(token: string): string {
	return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time hash comparison for lookups. */
export function tokenHashMatches(candidate: Uint8Array, stored: string): boolean {
	const storedBytes = Buffer.from(stored, "hex");
	if (storedBytes.length !== candidate.length) return false;
	return timingSafeEqual(new Uint8Array(storedBytes), candidate);
}

export function readBearerToken(request: Request): string | null {
	const header = request.headers.get("authorization");
	if (!header?.startsWith("Bearer ")) return null;
	const token = header.slice("Bearer ".length).trim();
	return token.startsWith(TOKEN_PREFIX) && token.length > TOKEN_PREFIX.length + 16 ? token : null;
}

/** Resolve a request's bearer token to a user, or null. Updates last_used_at. */
export async function userForCliToken(request: Request): Promise<CliTokenUser | null> {
	const token = readBearerToken(request);
	if (!token) return null;
	const tokenHash = hashCliToken(token);
	const { pg } = await getUserDb();
	const rows = await pg.query<{
		id: string;
		user_id: string;
		token_hash: string;
		expires_at: string | null;
		name: string;
		email: string;
	}>(
		`SELECT t.id, t.user_id, t.token_hash, t.expires_at, u.name, u.email
		 FROM cli_token t JOIN auth_user u ON u.id = t.user_id
		 WHERE t.token_hash = $1 LIMIT 1`,
		[tokenHash],
	);
	const row = rows.rows[0];
	if (!row) return null;
	if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return null;
	await pg
		.query("UPDATE cli_token SET last_used_at = now() WHERE id = $1", [row.id])
		.catch(() => {});
	return {
		id: row.user_id,
		name: row.name,
		email: row.email,
		authKind: "cli-token",
	};
}

export interface CliTokenRecord {
	id: string;
	name: string;
	createdAt: string;
	lastUsedAt: string | null;
	expiresAt: string;
}

export async function createCliToken(
	userId: string,
	name: string,
): Promise<{ record: CliTokenRecord; token: string }> {
	const { token, tokenHash } = generateCliToken();
	const { pg } = await getUserDb();
	const id = randomBytes(16).toString("hex");
	const rows = await pg.query<{ created_at: string }>(
		`INSERT INTO cli_token (id, user_id, token_hash, name, expires_at)
		 VALUES ($1, $2, $3, $4, now() + ($5 || ' days')::interval) RETURNING created_at`,
		[id, userId, tokenHash, name.slice(0, 60) || "CLI", String(TOKEN_TTL_DAYS)],
	);
	return {
		token,
		record: {
			id,
			name: name.slice(0, 60) || "CLI",
			createdAt: new Date(rows.rows[0]?.created_at ?? Date.now()).toISOString(),
			lastUsedAt: null,
			expiresAt: new Date(Date.now() + TOKEN_TTL_DAYS * 86_400_000).toISOString(),
		},
	};
}

export async function listCliTokens(userId: string): Promise<CliTokenRecord[]> {
	const { pg } = await getUserDb();
	const rows = await pg.query<{
		id: string;
		name: string;
		created_at: string;
		last_used_at: string | null;
		expires_at: string;
	}>(
		`SELECT id, name, created_at, last_used_at, expires_at FROM cli_token
		 WHERE user_id = $1 ORDER BY created_at DESC`,
		[userId],
	);
	return rows.rows.map((row) => ({
		id: row.id,
		name: row.name,
		createdAt: new Date(row.created_at).toISOString(),
		lastUsedAt: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
		expiresAt: new Date(row.expires_at).toISOString(),
	}));
}

export async function revokeCliToken(userId: string, tokenId: string): Promise<boolean> {
	const { pg } = await getUserDb();
	const result = await pg.query("DELETE FROM cli_token WHERE id = $1 AND user_id = $2", [
		tokenId,
		userId,
	]);
	return (result.rowCount ?? 0) > 0;
}
