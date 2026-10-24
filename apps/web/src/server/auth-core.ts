import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import * as schema from "@qbtools/db/user-schema";
import type { UserDb } from "@qbtools/db/users";
import { betterAuth, type BetterAuthPlugin } from "better-auth";

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
		socialProviders: { github: { clientId: options.clientId, clientSecret: options.clientSecret, scope: ["read:user", "user:email"] } },
		session: { expiresIn: 604800, updateAge: 86400, cookieCache: { enabled: false } },
		account: { encryptOAuthTokens: true, storeStateStrategy: "database", accountLinking: { enabled: false } },
		rateLimit: { enabled: true, storage: "memory", window: 60, max: 60 },
		advanced: { useSecureCookies: options.baseURL.startsWith("https:") },
		telemetry: { enabled: false },
		onAPIError: { errorURL: `${options.baseURL}/login` },
		plugins: options.plugins ?? [],
	});
}
