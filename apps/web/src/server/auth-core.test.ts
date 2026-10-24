import { afterAll, beforeAll, expect, test } from "bun:test";
import { createUserDb, type UserDb } from "@qbtools/db/users";
import { createAuth } from "./auth-core";

let database: UserDb;
let auth: ReturnType<typeof createAuth>;
const origin = "http://localhost:8312";
beforeAll(async () => {
	database = await createUserDb();
	auth = createAuth({
		database,
		secret: "qbtools-test-secret-only-32-characters-long",
		baseURL: origin,
		clientId: "test-client",
		clientSecret: "test-secret",
	});
}, 20000);
afterAll(async () => {
	await database.pg.close();
});
function cookies(response: Response) {
	return response.headers
		.getSetCookie()
		.map((v) => v.split(";")[0])
		.join("; ");
}
const post = (path: string, body: unknown, cookie = "", requestOrigin = origin) =>
	auth.handler(
		new Request(`${origin}/api/auth/${path}`, {
			method: "POST",
			headers: { Origin: requestOrigin, "Content-Type": "application/json", Cookie: cookie },
			body: JSON.stringify(body),
		}),
	);
test("OAuth creates an account using a private verified GitHub email, then signs in again", async () => {
	const original = globalThis.fetch;
	globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input instanceof Request ? input.url : input);
		if (url.startsWith("https://github.com/login/oauth/access_token"))
			return Response.json({
				access_token: "fake-github-token",
				token_type: "bearer",
				scope: "read:user,user:email",
			});
		if (url.startsWith("https://api.github.com/user/emails"))
			return Response.json([
				{ email: "private@example.test", primary: true, verified: true, visibility: null },
			]);
		if (url.startsWith("https://api.github.com/user"))
			return Response.json({
				id: 12345,
				login: "qbtester",
				name: "QB Tester",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345",
			});
		return original(input, init);
	}) as typeof fetch;
	try {
		let sessionCookie = "";
		for (let i = 0; i < 2; i++) {
			const started = await post("sign-in/social", {
				provider: "github",
				callbackURL: "/dashboard",
			});
			expect(started.ok).toBe(true);
			const target = new URL((await started.json()).url);
			expect(target.searchParams.get("scope")).toContain("user:email");
			const state = target.searchParams.get("state");
			expect(state).toBeTruthy();
			const callback = new Request(
				`${origin}/api/auth/callback/github?code=valid-code&state=${state}`,
				{ headers: { Cookie: cookies(started) } },
			);
			const result = await auth.handler(callback);
			expect(result.status).toBe(302);
			expect(result.headers.get("location")).toBe("/dashboard");
			sessionCookie = cookies(result);
			const session = await auth.handler(
				new Request(`${origin}/api/auth/get-session`, { headers: { Cookie: sessionCookie } }),
			);
			const data = await session.json();
			expect(data.user.email).toBe("private@example.test");
			expect(data.user.name).toBe("QB Tester");
			expect(JSON.stringify(data)).not.toContain("fake-github-token");
			const replay = await auth.handler(callback);
			expect(replay.headers.get("location")).toContain("error=");
		}
		expect((await database.pg.query("SELECT id FROM auth_user")).rows).toHaveLength(1);
		const account = (
			await database.pg.query<{ access_token: string }>("SELECT access_token FROM auth_account")
		).rows[0];
		expect(account?.access_token).not.toBe("fake-github-token");
		const logout = await post("sign-out", {}, sessionCookie);
		expect(logout.ok).toBe(true);
		const loggedOut = await auth.handler(
			new Request(`${origin}/api/auth/get-session`, { headers: { Cookie: sessionCookie } }),
		);
		expect(await loggedOut.json()).toBeNull();
	} finally {
		globalThis.fetch = original;
	}
});
test("cross-origin auth mutations and unsafe callbacks are rejected", async () => {
	expect(
		(
			await post(
				"sign-in/social",
				{ provider: "github", callbackURL: "/dashboard" },
				"",
				"https://evil.test",
			)
		).status,
	).toBe(403);
	expect(
		(await post("sign-in/social", { provider: "github", callbackURL: "https://evil.test" })).ok,
	).toBe(false);
});
test("invalid OAuth state fails without creating users", async () => {
	const result = await auth.handler(
		new Request(`${origin}/api/auth/callback/github?code=bad&state=forged`),
	);
	expect(result.headers.get("location")).toContain("error=");
});
