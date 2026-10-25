import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

// Preserve package-relative WASM/data imports in the server image, without
// copying the entire monorepo node_modules or publishing database binaries.
const root = join(import.meta.dir, "..");
const source = dirname(
	Bun.resolveSync("@electric-sql/pglite/package.json", join(root, "packages/db")),
);
const target = join(root, "apps/web/dist/server/node_modules/@electric-sql/pglite");
await mkdir(dirname(target), { recursive: true });
await cp(source, target, { recursive: true });
const maintenance = await Bun.build({
	entrypoints: [join(root, "packages/db/src/user-backup.ts")],
	outdir: join(root, "apps/web/dist/server"),
	target: "bun",
	external: ["@electric-sql/pglite"],
});
if (!maintenance.success) throw new Error("Could not build user database maintenance tooling.");
console.info("Prepared server-only PGlite runtime.");
