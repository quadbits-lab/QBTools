import { createFileRoute } from "@tanstack/react-router";
import { accountHandler } from "#/server/account-api";

const handler = ({ request }: { request: Request }) => accountHandler(request);
export const Route = createFileRoute("/api/account/$")({
	server: { handlers: { GET: handler, POST: handler, PATCH: handler, DELETE: handler } },
});
