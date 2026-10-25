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

/**
 * Every endpoint is a literal constant — no dynamic path building anywhere.
 * Endpoint params are typed to the constants; media ids ride in the request
 * body or via mediaRequest's purpose-built helpers.
 */
const ENDPOINTS = {
	whoami: "/api/cli/whoami",
	keys: "/api/cli/keys",
	favorites: "/api/cli/favorites",
	recents: "/api/cli/recents",
	aiGrammar: "/api/ai/grammar",
	aiParaphrase: "/api/ai/paraphrase",
	mediaList: "/api/media/list",
	mediaUploads: "/api/media/uploads",
} as const;

export async function request(endpoint: string, options: ApiOptions = {}): Promise<Response> {
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

/* ---------- media storage (auth required) ---------- */

const MEDIA = {
	list: "/api/media/list",
	uploads: "/api/media/uploads",
} as const;

export interface MediaAssetRow {
	id: string;
	name: string;
	mime: string;
	bytes: number;
	source_tool?: string | null;
	created_at: string;
}

export interface MediaListResponse {
	assets: MediaAssetRow[];
	more: boolean;
}

export function mediaList(
	options: { search?: string; kind?: string; page?: number } = {},
): Promise<MediaListResponse> {
	const params = new URLSearchParams();
	if (options.search) params.set("search", options.search);
	if (options.kind) params.set("kind", options.kind);
	if (options.page) params.set("page", String(options.page));
	const query = params.toString();
	return apiFetch<MediaListResponse>(query ? `${MEDIA.list}?${query}` : MEDIA.list);
}

async function mediaRequest(
	path: string,
	options: { method?: string; body?: BodyInit; contentType?: string },
): Promise<Response> {
	const config = await loadConfig();
	const base = assertHttpUrl(serverUrl(config));
	const url = new URL(path, base);
	const auth = await loadAuth();
	const headers: Record<string, string> = {};
	if (options.contentType) headers["Content-Type"] = options.contentType;
	if (auth?.kind === "token") {
		headers.Authorization = ["Bearer", auth.token].join(" ");
	} else if (auth) {
		headers.Origin = url.origin;
		headers.Cookie = ["better-auth.session_token", encodeURIComponent(auth.token)].join("=");
	}
	return fetch(url, { method: options.method ?? "GET", headers, body: options.body });
}

/** Download a stored asset's content into a Uint8Array. */
export async function mediaGetContent(id: string): Promise<Uint8Array> {
	const response = await mediaRequest(`/api/media/${id}/content`, {});
	if (!response.ok) throw await errorFromMedia(response);
	return new Uint8Array(await response.arrayBuffer());
}

function errorFromMedia(response: Response): Promise<ApiError> {
	return response
		.json()
		.then((payload) => {
			const info = payload as { error?: string; message?: string };
			return new ApiError(
				response.status,
				[info.message, info.error].find(Boolean) ?? "Media request failed.",
			);
		})
		.catch(() => new ApiError(response.status, "Media request failed."));
}

/** Full upload flow: reserve → PUT content → complete. Returns the asset id. */
export async function mediaPut(
	file: { name: string; bytes: Uint8Array },
	options: { sourceTool?: string } = {},
): Promise<{ id: string; name: string }> {
	const mime = guessMime(file.name);
	const reserve = await apiFetch<{ id: string }>(MEDIA.uploads, {
		method: "POST",
		body: {
			requestKey: crypto.randomUUID(),
			name: file.name.slice(0, 200),
			bytes: file.bytes.byteLength,
			mime,
			sourceTool: options.sourceTool,
		},
	});
	const put = await mediaRequest(`/api/media/${reserve.id}/content`, {
		method: "PUT",
		body: new Uint8Array(file.bytes),
		contentType: mime,
	});
	if (!put.ok) throw await errorFromMedia(put);
	return apiFetch<{ id: string; name: string }>(`/api/media/uploads/${reserve.id}/complete`, {
		method: "POST",
	});
}

function guessMime(name: string): string {
	const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
	const table: Record<string, string> = {
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		webp: "image/webp",
		gif: "image/gif",
		pdf: "application/pdf",
		mp4: "video/mp4",
		mp3: "audio/mpeg",
		txt: "text/plain",
		md: "text/markdown",
		json: "application/json",
		zip: "application/zip",
	};
	return table[ext] ?? "application/octet-stream";
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
