import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { renderSvg } from "@qbtools/engines/graphic";

// Generate the maskable PWA icons from the existing app artwork.
//
// Android applies a mask (circle, squircle, …) that can crop up to 20% off
// every side, so the monogram is scaled down and centred on an opaque
// background. The output is committed; this script only needs re-running when
// the artwork changes.
const root = join(import.meta.dir, "..");
const enginesRoot = join(root, "../../packages/engines");
const artworkPath = join(root, "public/web-app-manifest-512x512.png");
const outputDirectory = join(root, "public/icons");

/** Fraction of the canvas the mark occupies. */
const SCALE = 0.7;
const SIZES = [192, 512];

const artworkBytes = await readFile(artworkPath);
const artwork = artworkBytes.toString("base64");

/**
 * The backdrop of the maskable icon.
 *
 * It has to match the artwork, otherwise the scaled mark shows up as a lighter
 * square inside the icon. When the artwork is transparent there is nothing to
 * match and a plain white backdrop is used.
 */
async function backdropColour(): Promise<string> {
	const upng = (await import(pathToFileURL(Bun.resolveSync("upng-js", enginesRoot)).href).then(
		(module) => module.default ?? module,
	)) as { decode: (data: Uint8Array) => { width: number; height: number; data: Uint8Array } };
	const image = upng.decode(artworkBytes);
	const data = image.data;
	if (!data || data.length < 4) return "#ffffff";
	const alpha = data[3] as number;
	if (alpha < 255) return "#ffffff";
	const hex = (value: number) => value.toString(16).padStart(2, "0");
	return `#${hex(data[0] as number)}${hex(data[1] as number)}${hex(data[2] as number)}`;
}

const BACKGROUND = await backdropColour();

function maskableSvg(size: number): string {
	const side = Math.round(size * SCALE);
	const offset = Math.round((size - side) / 2);
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
		`<rect width="${size}" height="${size}" fill="${BACKGROUND}"/>`,
		`<image x="${offset}" y="${offset}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${artwork}" xlink:href="data:image/png;base64,${artwork}"/>`,
		"</svg>",
	].join("");
}

await mkdir(outputDirectory, { recursive: true });
// The resvg wasm ships with the engines workspace package, not with the app.
const assets = {
	wasmUrl: `file://${Bun.resolveSync("@resvg/resvg-wasm/index_bg.wasm", enginesRoot)}`,
};
for (const size of SIZES) {
	const { blob } = await renderSvg(
		{
			svg: maskableSvg(size),
			width: size,
			height: size,
			format: "png",
		},
		{ assets },
	);
	const bytes = new Uint8Array(await blob.arrayBuffer());
	const target = join(outputDirectory, `maskable-${size}.png`);
	await writeFile(target, bytes);
	console.info(`Wrote ${target} (${bytes.byteLength} bytes).`);
}
