import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDb, desc, migrate, premiumWaitlist, toolSuggestions } from "./index";

describe("db", () => {
	test("migrations are idempotent", () => {
		const sqlite = new Database(":memory:");
		expect(migrate(sqlite)).toEqual(["0001_init"]);
		expect(migrate(sqlite)).toEqual([]);
	});

	test("insert and query every table through drizzle on a file db", async () => {
		const dir = mkdtempSync(join(tmpdir(), "qbtools-db-"));
		const db = createDb(join(dir, "nested", "test.db"));
		await db.insert(toolSuggestions).values({ title: "JSON formatter", details: "please" });
		await db.insert(toolSuggestions).values({ title: "Unit converter", votes: 5 });
		const rows = await db.select().from(toolSuggestions).orderBy(desc(toolSuggestions.votes));
		expect(rows.map((r) => r.title)).toEqual(["Unit converter", "JSON formatter"]);
		expect(rows[0]?.createdAt).toBeInstanceOf(Date);

		await db.insert(premiumWaitlist).values({ email: "a@example.com" });
		expect(() => db.insert(premiumWaitlist).values({ email: "a@example.com" }).run()).toThrow();
		db.sqlite.close();
	});
});
