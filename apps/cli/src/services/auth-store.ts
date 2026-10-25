/**
 * CLI credential store: ~/.config/qbtools/auth.json, mode 0600. Holds either
 * an API token (qbk_…) or a better-auth session token captured during
 * dev-mode password login.
 */

import { chmod, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { configDir } from "./config";

export interface StoredAuth {
	version: 1;
	kind: "token" | "session";
	token: string;
	user?: { id?: string; name?: string; email?: string };
	savedAt: string;
}

export function authFilePath(): string {
	return join(configDir(), "auth.json");
}

export async function saveAuth(auth: StoredAuth): Promise<void> {
	await mkdir(configDir(), { recursive: true });
	await Bun.write(authFilePath(), `${JSON.stringify(auth, null, "\t")}\n`);
	await chmod(authFilePath(), 0o600).catch(() => {});
}

export async function loadAuth(): Promise<StoredAuth | null> {
	try {
		const parsed = JSON.parse(await Bun.file(authFilePath()).text()) as StoredAuth;
		if (!parsed.token) return null;
		return parsed;
	} catch {
		return null;
	}
}

export async function clearAuth(): Promise<void> {
	await unlink(authFilePath()).catch(() => {});
}
