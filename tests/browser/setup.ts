import type { FullConfig } from "@playwright/test";
/** External production servers also need readiness checks before the first browser opens. */
export default async function setup(config: FullConfig) {
	const baseURL = config.projects[0]?.use.baseURL;
	if (!baseURL) throw new Error("A QBTools browser-test baseURL is required.");
	const deadline = Date.now() + 30_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(new URL("/api/health", baseURL), {
				signal: AbortSignal.timeout(1000),
			});
			if (response.ok && (await response.json()).status === "ok") return;
		} catch {
			/* A freshly started container may still be loading its assets. */
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`QBTools did not become healthy at ${baseURL} within 30 seconds.`);
}
