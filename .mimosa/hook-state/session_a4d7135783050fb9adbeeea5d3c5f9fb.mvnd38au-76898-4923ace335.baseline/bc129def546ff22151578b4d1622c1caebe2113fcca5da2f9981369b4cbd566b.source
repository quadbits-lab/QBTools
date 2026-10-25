let manifest: Promise<Record<string, string>> | null = null;

/**
 * Headless (Bun/Node) resolution: map manifest keys to the installed package
 * directories, exposed as file:// URLs. Keep in sync with the copy list in
 * scripts/prepare-wasm.ts — the web app serves those copies, headless callers
 * read the same files straight from node_modules.
 */
const HEADLESS_PACKAGES: Record<string, { spec: string; subdir: string }> = {
	qpdf: { spec: "@neslinesli93/qpdf-wasm", subdir: "dist" },
	zxing: { spec: "zxing-wasm", subdir: "dist" },
	vtracer: { spec: "@visioncortex/vtracer", subdir: "pkg" },
	jpeg: { spec: "@jsquash/jpeg", subdir: "codec/enc" },
	webp: { spec: "@jsquash/webp", subdir: "codec/enc" },
	avif: { spec: "@jsquash/avif", subdir: "codec/enc" },
	png: { spec: "@jsquash/oxipng", subdir: "codec/pkg" },
	brotli: { spec: "brotli-wasm", subdir: "pkg.web" },
	zstd: { spec: "@bokuweb/zstd-wasm", subdir: "dist/web" },
};

const headlessBases = new Map<string, Promise<string>>();

function isHeadless(): boolean {
	return typeof globalThis.location === "undefined";
}

async function headlessBase(name: string): Promise<string> {
	const entry = HEADLESS_PACKAGES[name];
	if (!entry) throw new Error(`Missing processing asset: ${name}`);
	let base = headlessBases.get(name);
	if (!base) {
		base = packageRoot(entry.spec).then((root) => {
			let path = root.split("\\").join("/");
			if (!path.startsWith("/")) path = `/${path}`;
			const subdir = entry.subdir ? `/${entry.subdir}` : "";
			return `file://${path}${subdir}`;
		});
		headlessBases.set(name, base);
	}
	return base;
}

/** Climb from a package's entry file to the package root (its own package.json). */
async function packageRoot(spec: string): Promise<string> {
	const entry = Bun.resolveSync(spec, import.meta.dir);
	let dir = entry.slice(0, entry.lastIndexOf("/"));
	for (let hops = 0; hops < 8; hops++) {
		const pkgFile = Bun.file(`${dir}/package.json`);
		if (await pkgFile.exists()) {
			const pkg = (await pkgFile.json()) as { name?: string };
			if (pkg.name === spec) return dir;
		}
		const parent = dir.slice(0, dir.lastIndexOf("/"));
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error(`Could not locate installed package root for ${spec}`);
}

export async function assetBase(name: string): Promise<string> {
	if (isHeadless()) return headlessBase(name);
	manifest ??= fetch("/wasm/manifest.json")
		.then(async (response) => {
			if (!response.ok) throw new Error("Processing assets couldn't load. Please retry.");
			return response.json() as Promise<Record<string, string>>;
		})
		.catch((error) => {
			manifest = null;
			throw error;
		});
	const base = (await manifest)[name];
	if (!base) throw new Error(`Missing processing asset: ${name}`);
	return new URL(base, globalThis.location.origin).href;
}
