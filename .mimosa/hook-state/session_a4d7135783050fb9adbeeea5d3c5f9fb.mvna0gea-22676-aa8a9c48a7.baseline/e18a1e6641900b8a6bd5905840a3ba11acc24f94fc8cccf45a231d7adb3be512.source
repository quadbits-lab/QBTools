import { describe, expect, test } from "bun:test";
import { user } from "./user-schema";
import { createUserDb } from "./users";

describe("users db & migrations", () => {
	test("migrates auth_user with username, display_username, and phone", async () => {
		const { pg, db } = await createUserDb("memory://");

		// Inspect table columns in information_schema
		const columnsRes = await pg.query<{ column_name: string }>(
			"SELECT column_name FROM information_schema.columns WHERE table_name = 'auth_user'",
		);
		const columnNames = columnsRes.rows.map((r) => r.column_name);

		expect(columnNames).toContain("username");
		expect(columnNames).toContain("display_username");
		expect(columnNames).toContain("phone");

		// Insert user via drizzle
		const now = new Date();
		await db.insert(user).values({
			id: "test-user-1",
			name: "Jane Dev",
			email: "jane@example.com",
			username: "janedev",
			displayUsername: "JaneDev",
			phone: "+1-555-0100",
			createdAt: now,
			updatedAt: now,
		});

		const inserted = await db.select().from(user);
		expect(inserted.length).toBe(1);
		expect(inserted[0]?.username).toBe("janedev");
		expect(inserted[0]?.phone).toBe("+1-555-0100");

		await pg.close();
	});
});
