/** Local fixtures use real Better Auth callbacks; never imported by application code. */

import { createAuth } from "../apps/web/src/server/auth-core";
import { createUserDb } from "../packages/db/src/users";

const directory = process.env.PGLITE_DATA_DIR;
if (!directory?.includes("qbtools-auth-test-"))
	throw new Error("Set PGLITE_DATA_DIR to a disposable qbtools-auth-test- directory.");
const baseURL = process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:8312";
const secret = process.env.BETTER_AUTH_SECRET ?? "qbtools-test-secret-only-32-characters-long";
const database = await createUserDb(directory);
const auth = createAuth({
	database,
	secret,
	baseURL,
	clientId: "test-client",
	clientSecret: "test-secret",
});
let current = 1;
const original = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
	const url = String(input instanceof Request ? input.url : input);
	if (url.startsWith("https://github.com/login/oauth/access_token"))
		return Response.json({
			access_token: "fake-test-token",
			token_type: "bearer",
			scope: "read:user,user:email",
		});
	if (url.startsWith("https://api.github.com/user/emails"))
		return Response.json([{ email: `user${current}@example.test`, primary: true, verified: true }]);
	if (url.startsWith("https://api.github.com/user"))
		return Response.json({
			id: current,
			login: `user${current}`,
			name: current === 1 ? "Alice Test" : "Bob Test",
			email: null,
			avatar_url: null,
		});
	return original(input, init);
}) as typeof fetch;
const fixture: Record<string, unknown> = { baseURL };
for (current = 1; current <= 2; current++) {
	const start = await auth.handler(
		new Request(`${baseURL}/api/auth/sign-in/social`, {
			method: "POST",
			headers: { Origin: baseURL, "Content-Type": "application/json" },
			body: JSON.stringify({ provider: "github", callbackURL: "/dashboard" }),
		}),
	);
	const state = new URL((await start.json()).url).searchParams.get("state");
	const response = await auth.handler(
		new Request(`${baseURL}/api/auth/callback/github?code=test&state=${state}`, {
			headers: {
				Cookie: start.headers
					.getSetCookie()
					.map((v) => v.split(";")[0])
					.join("; "),
			},
		}),
	);
	const raw = response.headers
		.getSetCookie()
		.find((v) => v.startsWith("better-auth.session_token="));
	if (!raw) throw new Error("No signed fixture session");
	const session = await auth.api.getSession({
		headers: new Headers({ Cookie: raw.split(";")[0] as string }),
	});
	if (!session) throw new Error("Invalid fixture session");
	fixture[current === 1 ? "alice" : "bob"] = {
		cookie: raw.split(";")[0]?.slice("better-auth.session_token=".length),
		id: session.user.id,
	};
}
globalThis.fetch = original;
await database.pg.close();
await Bun.write(
	process.env.QBTOOLS_AUTH_FIXTURE ?? "/tmp/qbtools-auth-test-fixture.json",
	JSON.stringify(fixture),
);
console.info("Signed browser-test fixtures created.");
