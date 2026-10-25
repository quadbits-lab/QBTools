/**
 * Build the publishable bundle: dist/bin.js with @qbtools/* workspace sources
 * inlined and every runtime dependency kept external (they ship in
 * "dependencies" of the published package). Run from apps/cli: bun run build:package
 */

const external = new Set<string>();
for (const manifest of [
	new URL("../package.json", import.meta.url),
	new URL("../../../packages/engines/package.json", import.meta.url),
	new URL("../../../packages/registry/package.json", import.meta.url),
]) {
	const pkg = (await Bun.file(manifest).json()) as {
		dependencies?: Record<string, string>;
		optionalDependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
	};
	for (const section of [pkg.dependencies, pkg.optionalDependencies, pkg.peerDependencies]) {
		for (const name of Object.keys(section ?? {})) external.add(name);
	}
}

const result = await Bun.build({
	entrypoints: [new URL("./src/bin.tsx", import.meta.url).pathname],
	outdir: new URL("./dist", import.meta.url).pathname,
	target: "bun",
	format: "esm",
	minify: false,
	external: [...external],
	sourcemap: "linked",
});

if (!result.success) {
	for (const log of result.logs) console.error(log);
	process.exit(1);
}
console.log(
	`Bundled dist/bin.js (${result.outputs.length} outputs) with ${external.size} externals.`,
);
