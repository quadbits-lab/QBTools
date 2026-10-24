import { getDb, sql } from "@qbtools/db";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: () => {
				try {
					getDb().run(sql`select 1`);
					return Response.json(
						{ status: "ok", db: "ok", uptime: Math.round(process.uptime()) },
						{ headers: { "Cache-Control": "no-store" } },
					);
				} catch (error) {
					console.error("[health] database check failed", error);
					return Response.json(
						{ status: "error", db: "unavailable" },
						{ status: 503, headers: { "Cache-Control": "no-store" } },
					);
				}
			},
		},
	},
});
