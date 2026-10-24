import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import { authConfigured, githubConfigured, isDevAuth, requestSession } from "./auth";

export const sessionFn = createServerFn({ method: "GET" }).handler(async () => {
	setResponseHeader("Cache-Control", "private, no-store");
	const session = await requestSession(getRequestHeaders());
	return {
		enabled: authConfigured(),
		emailPasswordEnabled: isDevAuth(),
		githubEnabled: githubConfigured(),
		user: session
			? {
					id: session.user.id,
					name: session.user.name,
					email: session.user.email,
					image: session.user.image ?? null,
					username: (session.user as { username?: string | null }).username ?? null,
					phone: (session.user as { phone?: string | null }).phone ?? null,
				}
			: null,
	};
});
