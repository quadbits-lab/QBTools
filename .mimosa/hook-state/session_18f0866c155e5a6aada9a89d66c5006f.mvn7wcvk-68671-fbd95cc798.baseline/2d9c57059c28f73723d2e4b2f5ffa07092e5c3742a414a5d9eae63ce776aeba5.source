import { createFileRoute } from "@tanstack/react-router";
import { mediaHandler } from "#/server/media-api";

const handler = ({ request }: { request: Request }) => mediaHandler(request);
export const Route = createFileRoute("/api/media/$")({
	server: {
		handlers: {
			GET: handler,
			HEAD: handler,
			POST: handler,
			PUT: handler,
			PATCH: handler,
			DELETE: handler,
		},
	},
});
