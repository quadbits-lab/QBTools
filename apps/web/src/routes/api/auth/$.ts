import { createFileRoute } from "@tanstack/react-router";
import { authConfigured, getAuth } from "#/server/auth";

async function handler({ request }: { request: Request }) {
	if (!authConfigured())
		return Response.json(
			{ error: "AUTH_UNAVAILABLE", message: "GitHub sign-in is not configured yet." },
			{ status: 503, headers: { "Cache-Control": "private, no-store" } },
		);
	const response = await (await getAuth()).handler(request);
	response.headers.set("Cache-Control", "private, no-store");
	return response;
}
export const Route = createFileRoute("/api/auth/$")({
	server: { handlers: { GET: handler, POST: handler } },
});
