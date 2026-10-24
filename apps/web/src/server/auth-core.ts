import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import * as schema from "@qbtools/db/user-schema";
import type { UserDb } from "@qbtools/db/users";
import { type BetterAuthPlugin, betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";

export function createAuth(options: {
	database: UserDb;
	secret: string;
	baseURL: string;
	clientId: string;
	clientSecret: string;
	plugins?: BetterAuthPlugin[];
}) {
	return betterAuth({
		appName: "QBTools",
		baseURL: options.baseURL,
		secret: options.secret,
		database: drizzleAdapter(options.database.db, { provider: "pg", schema, transaction: true }),
		trustedOrigins: [new URL(options.baseURL).origin],
		emailAndPassword: { enabled: false },
		socialProviders: {
			github: {
				clientId: options.clientId,
				clientSecret: options.clientSecret,
				scope: ["read:user", "user:email"],
			},
		},
		session: { expiresIn: 604800, updateAge: 86400, cookieCache: { enabled: false } },
		account: {
			encryptOAuthTokens: true,
			storeStateStrategy: "database",
			accountLinking: { enabled: false },
		},
		rateLimit: { enabled: true, storage: "memory", window: 60, max: 60 },
		advanced: { useSecureCookies: options.baseURL.startsWith("https:") },
		hooks: {
			before: createAuthMiddleware(async (ctx) => {
				if (
					ctx.request &&
					!["GET", "HEAD"].includes(ctx.request.method) &&
					ctx.headers?.get("origin") !== new URL(options.baseURL).origin
				)
					throw new APIError("FORBIDDEN", { message: "Request origin is not allowed." });
			}),
		},
		telemetry: { enabled: false },
		logger: {
			log(level) {
				if (level === "error") console.error("[auth] authentication request failed");
			},
		},
		onAPIError: { errorURL: `${options.baseURL}/login` },
		plugins: options.plugins ?? [],
	});
}
