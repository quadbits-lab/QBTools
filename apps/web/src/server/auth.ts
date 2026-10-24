import "@tanstack/react-start/server-only";
import { getUserDb } from "@qbtools/db/users";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { createAuth } from "./auth-core";

export function authConfigured() {
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
			"GitHub sign-in is not configured. Set the authentication environment variables.",
		);
	shared ??= (async () => {
		const secret = process.env.BETTER_AUTH_SECRET ?? "";
		if (secret.length < 32)
			throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
		return createAuth({
			database: await getUserDb(),
			secret,
			baseURL: (process.env.BETTER_AUTH_URL ?? "").replace(/\/$/, ""),
			clientId: process.env.GITHUB_CLIENT_ID ?? "",
			clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
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
