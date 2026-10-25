/**
 * Online backup with VACUUM INTO (safe while the app is running).
 * Usage: bun src/backup.ts [outDir]   (inside Docker: docker compose exec web bun run db:backup)
 */
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const source = resolve(process.env.DATABASE_PATH ?? "./data/qbtools.db");
const outDir = resolve(process.argv[2] ?? process.env.BACKUP_DIR ?? join(source, "..", "backups"));
mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = join(outDir, `qbtools-${stamp}.db`);
const db = new Database(source, { readonly: true });
db.run("VACUUM INTO ?", [target]);
db.close();
console.log(`Backup written to ${target}`);
