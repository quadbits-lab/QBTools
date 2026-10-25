import { createFileRoute } from "@tanstack/react-router";
import { aiApiHandler } from "#/server/ai-api";

const handler = ({ request }: { request: Request }) => aiApiHandler(request);
export const Route = createFileRoute("/api/ai/$")({
	server: { handlers: { POST: handler } },
});
