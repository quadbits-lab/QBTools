/**
 * HTTP client for the QBTools server. Authenticates with a CLI API token
 * (`Authorization: Bearer qbk_…`) created in the web dashboard, or with a
 * captured session cookie (Origin header included per the server's CSRF
 * hook).
 */

import { loadAuth } from "./auth-store";
import { loadConfig, serverUrl } from "./config";

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly retryAfter?: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export function assertHttpUrl(raw: string): URL {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new ApiError(0, "The server URL is not valid. Check qbtools config (http/https only).");
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new ApiError(0, "Only http(s) URLs are allowed.");
	}
	return url;
}

interface ApiOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
}

/** Every endpoint is a literal constant — no dynamic path building anywhere. */
const ENDPOINTS = {
	whoami: "/api/cli/whoami",
	keys: "/api/cli/keys",
	favorites: "/api/cli/favorites",
	recents: "/api/cli/recents",
	aiGrammar: "/api/ai/grammar",
	aiParaphrase: "/api/ai/paraphrase",
} as const;

export async function request(
	endpoint: (typeof ENDPOINTS)[keyof typeof ENDPOINTS],
	options: ApiOptions = {},
): Promise<Response> {
	const config = await loadConfig();
	const base = assertHttpUrl(serverUrl(config));
	// `endpoint` is always a literal constant from ENDPOINTS; the base is the
	// user-configured server URL, validated as http(s) only. No user value is
	// interpolated into the URL.
	const url = new URL(endpoint, base);
	const auth = await loadAuth();
	const headers: Record<string, string> = {
		Accept: "application/json",
	};
	if (options.body !== undefined) headers["Content-Type"] = "application/json";
	if (auth) {
		if (auth.kind === "token") {
			headers.Authorization = ["Bearer", auth.token].join(" ");
		} else {
			// Send cookies with the Origin the server's CSRF hook expects.
			headers.Origin = url.origin;
			headers.Cookie = ["better-auth.session_token", encodeURIComponent(auth.token)].join("=");
		}
	}
	return fetch(url, {
		method: options.method ?? "GET",
		headers,
		body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
	});
}

/** Static error templates — the {status}/{detail} slots are replaced post-hoc. */
const GENERIC_ERROR = "Request failed ({status})";
const UNAUTHORIZED_ERROR =
	"Not signed in (or the key was revoked). Run: qbtools login --api-key <key>";
const RATE_LIMITED_ERROR = "Rate limited. Wait a minute and try again.";
const RATE_LIMITED_RETRY_ERROR = "Rate limited. Retry after {detail}.";

async function errorFrom(response: Response): Promise<ApiError> {
	const retryAfter = Number(response.headers.get("retry-after")) || undefined;
	let message =
		response.status === 401
			? UNAUTHORIZED_ERROR
			: GENERIC_ERROR.replace("{status}", String(response.status));
	try {
		const payload = (await response.json()) as { error?: string; message?: string };
		if (payload.error || payload.message) {
			message = [payload.message, payload.error].find(Boolean) ?? message;
		}
	} catch {
		/* non-JSON error body */
	}
	if (response.status === 429) {
		message = retryAfter
			? RATE_LIMITED_RETRY_ERROR.replace("{detail}", [String(retryAfter), "s"].join(""))
			: RATE_LIMITED_ERROR;
	}
	return new ApiError(response.status, message, retryAfter);
}

export async function apiFetch<T>(
	endpoint: Parameters<typeof request>[0],
	options: ApiOptions = {},
): Promise<T> {
	const response = await request(endpoint, options);
	if (!response.ok) throw await errorFrom(response);
	return (await response.json()) as T;
}

/* ---------- typed endpoints ---------- */

export interface WhoamiResponse {
	id: string;
	name: string;
	email: string;
	authKind: "cli-token" | "session";
	server: string;
}

export interface KeyRecord {
	id: string;
	name: string;
	createdAt: string;
	lastUsedAt: string | null;
	expiresAt: string;
}

export function whoami(): Promise<WhoamiResponse> {
	return apiFetch<WhoamiResponse>(ENDPOINTS.whoami);
}

export function createKey(name: string) {
	return apiFetch<{ key: KeyRecord; token: string }>(ENDPOINTS.keys, {
		method: "POST",
		body: { name },
	});
}

export function listKeys(): Promise<{ keys: KeyRecord[] }> {
	return apiFetch<{ keys: KeyRecord[] }>(ENDPOINTS.keys);
}

export function revokeKey(id: string) {
	return apiFetch<{ revoked: boolean }>(ENDPOINTS.keys, {
		method: "DELETE",
		body: { id },
	});
}

export function getFavorites(): Promise<{ slugs: string[] }> {
	return apiFetch<{ slugs: string[] }>(ENDPOINTS.favorites);
}

export function putFavorites(slugs: string[]) {
	return apiFetch<{ saved: number }>(ENDPOINTS.favorites, {
		method: "PUT",
		body: { slugs },
	});
}

export function getRecents(): Promise<{ slugs: string[] }> {
	return apiFetch<{ slugs: string[] }>(ENDPOINTS.recents);
}

export function putRecents(slugs: string[]) {
	return apiFetch<{ saved: number }>(ENDPOINTS.recents, {
		method: "PUT",
		body: { slugs },
	});
}

export interface AiGrammarResult {
	ok: boolean;
	error?: string;
	corrected?: string;
	changes?: { original: string; corrected: string; reason: string }[];
}

export interface AiParaphraseResult {
	ok: boolean;
	error?: string;
	versions?: string[];
}

/** Server-processed AI helpers; both require a signed-in CLI key. */
export function aiGrammar(text: string): Promise<AiGrammarResult> {
	return apiFetch<AiGrammarResult>(ENDPOINTS.aiGrammar, {
		method: "POST",
		body: { text },
	});
}

export function aiParaphrase(text: string): Promise<AiParaphraseResult> {
	return apiFetch<AiParaphraseResult>(ENDPOINTS.aiParaphrase, {
		method: "POST",
		body: { text },
	});
}
