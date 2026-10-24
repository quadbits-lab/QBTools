import { describe, expect, test } from "bun:test";
import { createUserDb } from "@qbtools/db/users";
import { createAuth } from "./auth-core";

describe("auth with email, password & username", () => {
	test("registers and authenticates with email and username in dev mode", async () => {
		const database = await createUserDb("memory://");
		const auth = createAuth({
			database,
			secret: "test-secret-at-least-32-chars-long-qbtools",
			baseURL: "http://localhost:8310",
			emailPasswordEnabled: true,
		});

		// 1. Sign up with Name, Email, Password, Phone, Username
		const signUpRes = await auth.api.signUpEmail({
			body: {
				name: "Alice Developer",
				username: "alicedev",
				email: "alice@example.com",
				phone: "+1-555-0199",
				password: "Password123!",
			},
		});

		expect(signUpRes.user).toBeDefined();
		expect(signUpRes.user.name).toBe("Alice Developer");
		expect(signUpRes.user.email).toBe("alice@example.com");
		expect((signUpRes.user as { username?: string }).username).toBe("alicedev");
		expect((signUpRes.user as { phone?: string }).phone).toBe("+1-555-0199");

		// 2. Sign in with Email & Password
		const emailSignIn = await auth.api.signInEmail({
			body: {
				email: "alice@example.com",
				password: "Password123!",
			},
		});
		expect(emailSignIn.token).toBeDefined();
		expect(emailSignIn.user.id).toBe(signUpRes.user.id);

		// 3. Sign in with Username & Password
		const userSignIn = await auth.api.signInUsername({
			body: {
				username: "alicedev",
				password: "Password123!",
			},
		});
		expect(userSignIn.token).toBeDefined();
		expect(userSignIn.user.id).toBe(signUpRes.user.id);

		// 4. Invalid password should throw/fail
		let failed = false;
		try {
			await auth.api.signInEmail({
				body: {
					email: "alice@example.com",
					password: "WrongPassword!",
				},
			});
		} catch {
			failed = true;
		}
		expect(failed).toBe(true);

		// 5. Duplicate email should fail
		let dupEmailFailed = false;
		try {
			await auth.api.signUpEmail({
				body: {
					name: "Alice Clone",
					username: "aliceclone",
					email: "alice@example.com",
					phone: "+1-555-0200",
					password: "Password123!",
				},
			});
		} catch {
			dupEmailFailed = true;
		}
		expect(dupEmailFailed).toBe(true);

		// 6. Duplicate username should fail
		let dupUserFailed = false;
		try {
			await auth.api.signUpEmail({
				body: {
					name: "Bob Dev",
					username: "alicedev",
					email: "bob@example.com",
					phone: "+1-555-0200",
					password: "Password123!",
				},
			});
		} catch {
			dupUserFailed = true;
		}
		expect(dupUserFailed).toBe(true);

		await database.pg.close();
	});
});
