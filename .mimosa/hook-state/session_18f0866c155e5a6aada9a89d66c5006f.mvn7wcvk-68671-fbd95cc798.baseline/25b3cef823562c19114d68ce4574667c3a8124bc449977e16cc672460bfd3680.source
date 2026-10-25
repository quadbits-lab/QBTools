import "@tanstack/react-start/server-only";

/** Runtime origin for server-generated files; falls back to the build-time value. */
export function runtimeSiteUrl(): string {
	return (process.env.SITE_URL ?? import.meta.env.VITE_SITE_URL ?? "http://localhost:8310").replace(
		/\/$/,
		"",
	);
}
