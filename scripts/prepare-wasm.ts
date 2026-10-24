import { cp, mkdir, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = join(import.meta.dir, "..");
const modules = join(root, "packages/engines/node_modules");
const output = join(root, "apps/web/public/wasm");
const manifest: Record<string, string> = {};
await mkdir(output, { recursive: true });
async function copyPackage(
	key: string,
	name: string,
	subdir: string,
	filter: (name: string) => boolean = () => true,
	base?: string,
) {
	const folder = base ?? join(modules, name);
	const pkg = JSON.parse(await readFile(join(folder, "package.json"), "utf8"));
	const id = `${key}-${pkg.version}`;
	const target = join(output, id);
	await rm(target, { force: true, recursive: true });
	await mkdir(target, { recursive: true });
	for (const entry of await readdir(join(folder, subdir), { withFileTypes: true })) {
		if (filter(entry.name))
			await cp(join(folder, subdir, entry.name), join(target, entry.name), { recursive: true });
	}
	for (const name of await readdir(folder)) {
		if (/^(license|copying|notice)/i.test(name))
			await cp(join(folder, name), join(target, name), { recursive: true });
	}
	manifest[key] = `/wasm/${id}`;
}
await copyPackage("jpeg", "@jsquash/jpeg", "codec/enc", (n) => n === "mozjpeg_enc.wasm");
await copyPackage("webp", "@jsquash/webp", "codec/enc", (n) => n.endsWith(".wasm"));
await copyPackage("avif", "@jsquash/avif", "codec/enc", (n) => n === "avif_enc.wasm");
await copyPackage("png", "@jsquash/oxipng", "codec/pkg", (n) => n.endsWith(".wasm"));
await copyPackage("resvg", "@resvg/resvg-wasm", ".", (n) => n === "index_bg.wasm");
await copyPackage("pdfjs", "pdfjs-dist", ".", (n) =>
	["wasm", "cmaps", "standard_fonts"].includes(n),
);
await copyPackage("qpdf", "@neslinesli93/qpdf-wasm", "dist");
await copyPackage("tesseract", "tesseract.js", "dist", (n) => n.startsWith("worker.min.js"));
const tessRoot = await realpath(join(modules, "tesseract.js"));
const coreRoot = dirname(Bun.resolveSync("tesseract.js-core", tessRoot));
await copyPackage(
	"tesseract-core",
	"tesseract.js-core",
	".",
	(n) => /\.wasm(\.js)?$/.test(n),
	coreRoot,
);
for (const language of ["eng", "ara"]) {
	await copyPackage(`lang-${language}`, `@tesseract.js-data/${language}`, "4.0.0_best_int");
}
const languageFolder = "tessdata-1.0.0";
await mkdir(join(output, languageFolder), { recursive: true });
for (const language of ["eng", "ara"]) {
	await cp(
		join(modules, `@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`),
		join(output, languageFolder, `${language}.traineddata.gz`),
	);
}
manifest.tessdata = `/wasm/${languageFolder}`;
await copyPackage("ffmpeg", "@ffmpeg/ffmpeg", "dist/esm");
await copyPackage("ffmpeg-core", "@ffmpeg/core", "dist/esm");
for (const name of [
	"mediabunny",
	"@mediabunny/aac-encoder",
	"@mediabunny/flac-encoder",
	"@mediabunny/mp3-encoder",
	"hash-wasm",
	"@resvg/resvg-wasm",
	"dompurify",
	"opentype.js",
	"upng-js",
]) {
	await copyPackage(`notices-${name.replace(/[@/]/g, "-")}`, name, ".", (entry) =>
		/^(license|copying|notice)/i.test(entry),
	);
}
// Graphic-editor UI assets (icons and fonts) live outside the engines workspace.
for (const [key, name] of [
	["notices-lucide-static", "lucide-static"],
	["notices-fontsource-inter", "@fontsource/inter"],
	["notices-fontsource-anton", "@fontsource/anton"],
	["notices-fontsource-dm-mono", "@fontsource/dm-mono"],
] as const) {
	await copyPackage(
		key,
		name,
		".",
		(entry) => /^(license|copying|notice)/i.test(entry),
		join(root, "apps/web/node_modules", name),
	);
}
await cp(join(root, "THIRD_PARTY_NOTICES.md"), join(output, "THIRD_PARTY_NOTICES.md"));
await writeFile(join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.info("Prepared versioned, same-origin WASM and OCR assets.");
