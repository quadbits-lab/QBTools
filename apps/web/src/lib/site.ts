export const SITE_NAME = "QBTools";
export const SITE_TAGLINE = "Free tools that just work";
export const SITE_DESCRIPTION =
	"Free online tools for everyday tasks — compress images, merge PDFs, count words, calculate EMI, make QR codes and more. No signup, private and fast.";
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "http://localhost:8310").replace(
	/\/$/,
	"",
);
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? "hello@quadbits.io";
/** Matches the dark theme background (oklch 0.18 monochrome gray). */
export const THEME_COLOR = "#1f1f1f";

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;
