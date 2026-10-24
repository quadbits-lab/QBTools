import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";
import { authConfigured, requestSession } from "./auth";

export const sessionFn = createServerFn({ method: "GET" }).handler(async () => {
	setResponseHeader("Cache-Control", "private, no-store");
	const session = await requestSession(getRequestHeaders());
	return {
		enabled: authConfigured(),
		user: session
			? {
					id: session.user.id,
					name: session.user.name,
					email: session.user.email,
					image: session.user.image ?? null,
				}
			: null,
	};
});
