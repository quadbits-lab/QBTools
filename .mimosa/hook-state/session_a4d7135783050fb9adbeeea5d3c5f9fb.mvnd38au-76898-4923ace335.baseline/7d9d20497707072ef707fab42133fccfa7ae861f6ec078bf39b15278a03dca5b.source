import { getDb, sql } from "@qbtools/db";
import { createFileRoute } from "@tanstack/react-router";
import { authConfigured, getAuth } from "#/server/auth";
import { getMediaService } from "#/server/media-api";
import { storageConfigured } from "#/server/object-store";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () => {
				try {
					getDb().run(sql`select 1`);
					if (authConfigured()) {
						await getAuth();
						if (storageConfigured()) await getMediaService();
					}
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
