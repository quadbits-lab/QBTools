import "@tanstack/react-start/server-only";

import fs from "node:fs";
import path from "node:path";
import { getUserDb } from "@qbtools/db/users";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { createAuth } from "./auth-core";

function ensureEnvLoaded() {
	if (process.env.BETTER_AUTH_SECRET) return;
	for (const envPath of [
		path.resolve(process.cwd(), ".env"),
		path.resolve(process.cwd(), "apps/web/.env"),
		path.resolve(import.meta.dirname, "../../../.env"),
		path.resolve(import.meta.dirname, "../../.env"),
	]) {
		if (fs.existsSync(envPath)) {
			try {
				const content = fs.readFileSync(envPath, "utf8");
				for (const line of content.split("\n")) {
					const trimmed = line.trim();
					if (!trimmed || trimmed.startsWith("#")) continue;
					const eq = trimmed.indexOf("=");
					if (eq > 0) {
						const k = trimmed.slice(0, eq).trim();
						const v = trimmed.slice(eq + 1).trim();
						if (process.env[k] === undefined || process.env[k] === "") {
							process.env[k] = v;
						}
					}
				}
			} catch {}
		}
	}
}

export function isDevAuth() {
	ensureEnvLoaded();
	return process.env.APP_ENV === "development";
}

export function githubConfigured() {
	ensureEnvLoaded();
	return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function authConfigured() {
	ensureEnvLoaded();
	if (isDevAuth()) {
		const secret = process.env.BETTER_AUTH_SECRET;
		return Boolean(secret && secret.length >= 32);
	}
	const values = [
		process.env.BETTER_AUTH_SECRET,
		process.env.BETTER_AUTH_URL,
		process.env.GITHUB_CLIENT_ID,
		process.env.GITHUB_CLIENT_SECRET,
	];
	if (values.some(Boolean) && !values.every(Boolean))
		throw new Error(
			"Authentication configuration is incomplete. Set BETTER_AUTH_SECRET, BETTER_AUTH_URL, GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET together.",
		);
	return values.every(Boolean);
}
let shared: Promise<ReturnType<typeof createAuth>> | undefined;
export function getAuth() {
	if (!authConfigured())
		throw new Error(
			"Authentication is not configured. Set the authentication environment variables.",
		);
	shared ??= (async () => {
		const secret = process.env.BETTER_AUTH_SECRET ?? "";
		if (secret.length < 32)
			throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
		const baseURL = (
			process.env.BETTER_AUTH_URL ||
			process.env.SITE_URL ||
			"http://localhost:8310"
		).replace(/\/$/, "");
		return createAuth({
			database: await getUserDb(),
			secret,
			baseURL,
			clientId: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			emailPasswordEnabled: isDevAuth(),
			plugins: [tanstackStartCookies()],
		});
	})().catch((error) => {
		shared = undefined;
		throw error;
	});
	return shared;
}
export async function requestSession(headers: Headers) {
	if (!authConfigured()) return null;
	return (await getAuth()).api.getSession({ headers });
}
export async function requireUser(request: Request) {
	const session = await requestSession(request.headers);
	if (!session)
		throw new Response(JSON.stringify({ error: "UNAUTHORIZED", message: "Sign in to continue." }), {
			status: 401,
			headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
		});
	return session.user;
}
