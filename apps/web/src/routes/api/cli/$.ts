import { createFileRoute } from "@tanstack/react-router";
import { cliApiHandler } from "#/server/cli-api";

const handler = ({ request }: { request: Request }) => cliApiHandler(request);
export const Route = createFileRoute("/api/cli/$")({
	server: { handlers: { GET: handler, POST: handler, PUT: handler, DELETE: handler } },
});
