import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";

// Bundle the QBTools service worker into apps/web/public/sw.js.
//
// The worker is written in TypeScript so its cache policy can be unit tested,
// but a service worker must be a single classic script served from the origin
// root. Bun.build does the bundling; the build id is a hash of the worker
// sources so every deploy that changes the worker starts a fresh cache
// generation and the old caches are dropped on activate.
const root = join(import.meta.dir, "..");
const sources = [
	join(root, "apps/web/src/pwa/service-worker.ts"),
	join(root, "apps/web/src/pwa/rules.ts"),
];
const output = join(root, "apps/web/public/sw.js");
const staging = join(root, "apps/web/public/.sw-build");

const hasher = new Bun.CryptoHasher("sha256");
for (const source of sources) {
	hasher.update(await readFile(source));
}
const buildId = hasher.digest("hex").slice(0, 12);

await rm(staging, { force: true, recursive: true });
await mkdir(staging, { recursive: true });
try {
	const result = await Bun.build({
		entrypoints: [sources[0] as string],
		outdir: staging,
		target: "browser",
		format: "iife",
		minify: true,
		naming: "sw.js",
		define: { __SW_BUILD_ID__: JSON.stringify(buildId) },
	});
	if (!result.success) {
		throw new Error(
			`Could not build the service worker: ${result.logs.map((log) => String(log)).join("\n")}`,
		);
	}
	const bundle = await readFile(join(staging, "sw.js"), "utf8");
	// A missing build id would silently pin every deploy to the same cache
	// generation, so fail loudly instead.
	if (!bundle.includes(buildId)) {
		throw new Error("The service worker build id was not injected into the bundle.");
	}
	await Bun.write(output, bundle);
	console.info(`Built service worker (${bundle.length} bytes, build ${buildId}).`);
} finally {
	await rm(staging, { force: true, recursive: true });
}
