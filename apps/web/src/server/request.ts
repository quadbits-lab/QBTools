import "@tanstack/react-start/server-only";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Client IP for rate limiting. server.ts overwrites `x-qb-client-ip` with the
 * socket address (or the first X-Forwarded-For hop when TRUST_PROXY=true),
 * so clients can't spoof it.
 */
export function clientKey(): string {
	return getRequestHeader("x-qb-client-ip") ?? "local";
}
