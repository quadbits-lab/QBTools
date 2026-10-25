export const SITE_NAME = "QBTools";
export const SITE_TAGLINE = "Fast, Private Tools That Never Leave Your Browser";
export const SITE_DESCRIPTION = "Free, private browser tools for everyday workflows — compress media, merge PDFs, format code, and encrypt files. 100% client-side with zero server uploads.";
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "http://localhost:8310").replace(
	/\/$/,
	"",
);
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? "hello@quadbits.io";
/** Public source repository, linked from the header and footer badges. */
export const GITHUB_REPO_URL = "https://github.com/Quadbits-Lab/QBTools";
export const GITHUB_REPO_SLUG = "Quadbits-Lab/QBTools";
/** Matches the dark theme background (oklch 0.18 monochrome gray). */
export const THEME_COLOR = "#1f1f1f";
/** Matches the light theme background. */
export const THEME_COLOR_LIGHT = "#ffffff";
/** Splash screen background, matched to the dark theme surface. */
export const THEME_BACKGROUND = "#111111";

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;
