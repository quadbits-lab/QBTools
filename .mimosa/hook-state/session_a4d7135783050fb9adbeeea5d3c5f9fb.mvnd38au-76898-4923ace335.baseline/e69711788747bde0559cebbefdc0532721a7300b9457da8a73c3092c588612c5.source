import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createUserDb } from "./users";

// Run only while the app is stopped: an embedded PGlite datadir has one owner.
const directory = resolve(process.env.PGLITE_DATA_DIR ?? "./data/users");
const action = process.argv[2] ?? "backup";
if (action === "backup") {
	const { pg } = await createUserDb(directory);
	try {
		const output = resolve(
			process.argv[3] ??
				`./data/backups/users-${new Date().toISOString().replace(/[:.]/g, "-")}.tar.gz`,
		);
		await mkdir(resolve(output, ".."), { recursive: true });
		await Bun.write(output, await pg.dumpDataDir("gzip"));
		console.info(`User database backed up to ${output}`);
	} finally {
		await pg.close();
	}
} else if (action === "restore") {
	const { PGlite } = await import("@electric-sql/pglite");
	const { existsSync } = await import("node:fs");
	if (!process.argv[3]) throw new Error("Supply a backup tarball and a new empty PGLITE_DATA_DIR.");
	if (existsSync(directory))
		throw new Error(
			"Restore requires a new destination directory; existing data will not be overwritten.",
		);
	const pg = await PGlite.create({
		dataDir: directory,
		loadDataDir: Bun.file(resolve(process.argv[3])),
	});
	await pg.close();
	console.info("Restore complete.");
} else throw new Error("Expected backup or restore.");
