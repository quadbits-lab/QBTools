import { createFileRoute } from "@tanstack/react-router";

/** AdSense ads.txt — set ADS_TXT, e.g. "google.com, pub-123, DIRECT, f08c47fec0942fa0". */
export const Route = createFileRoute("/ads.txt")({
	server: {
		handlers: {
			GET: () => {
				const body = process.env.ADS_TXT?.replace(/\\n/g, "\n").trim();
				return body
					? new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } })
					: new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
			},
		},
	},
});
