import { describe, expect, test } from "bun:test";
import { SITE_DESCRIPTION, SITE_NAME, THEME_BACKGROUND, THEME_COLOR } from "#/lib/site";

interface ManifestIcon {
	src: string;
	sizes: string;
	type?: string;
	purpose?: string;
}

interface Manifest {
	id?: string;
	name?: string;
	short_name?: string;
	description?: string;
	lang?: string;
	dir?: string;
	start_url?: string;
	scope?: string;
	display?: string;
	display_override?: string[];
	orientation?: string;
	background_color?: string;
	theme_color?: string;
	categories?: string[];
	icons?: ManifestIcon[];
	shortcuts?: { name: string; url: string }[];
}

const manifestUrl = new URL("../../public/manifest.webmanifest", import.meta.url);
const manifest = (await Bun.file(manifestUrl).json()) as Manifest;

describe("web app manifest", () => {
	test("matches the site identity", () => {
		expect(manifest.name).toContain(SITE_NAME);
		expect(manifest.short_name).toBe(SITE_NAME);
		expect(manifest.description).toBe(SITE_DESCRIPTION);
	});

	test("uses the dark theme colours of the app", () => {
		expect(manifest.theme_color).toBe(THEME_COLOR);
		expect(manifest.background_color).toBe(THEME_BACKGROUND);
	});

	test("declares the fields an installable app needs", () => {
		expect(manifest.id).toBe("/");
		expect(manifest.start_url).toBe("/");
		expect(manifest.scope).toBe("/");
		expect(manifest.display).toBe("standalone");
		expect(manifest.lang).toBe("en");
		expect(manifest.dir).toBe("ltr");
	});

	test("ships an installable icon set", () => {
		const icons = manifest.icons ?? [];
		const purposes = (size: string) =>
			icons.filter((icon) => icon.sizes === size).map((icon) => icon.purpose);
		expect(purposes("192x192")).toContain("any");
		expect(purposes("512x512")).toContain("any");
		expect(purposes("512x512")).toContain("maskable");
		for (const icon of icons) {
			expect(icon.src.startsWith("/")).toBe(true);
			expect(icon.type).toBe("image/png");
		}
	});

	test("shortcuts point at real tool routes", () => {
		const shortcuts = manifest.shortcuts ?? [];
		expect(shortcuts.length).toBeGreaterThan(0);
		for (const shortcut of shortcuts) {
			expect(shortcut.name.length).toBeGreaterThan(0);
			expect(shortcut.url.startsWith("/tools")).toBe(true);
		}
	});
});
