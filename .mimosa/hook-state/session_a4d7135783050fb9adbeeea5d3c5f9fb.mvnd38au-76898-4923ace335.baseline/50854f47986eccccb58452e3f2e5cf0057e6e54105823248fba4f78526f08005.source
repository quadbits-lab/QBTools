export async function api<T = { ok: boolean }>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, {
		...init,
		headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
		credentials: "same-origin",
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.message ?? "The request failed. Please try again.");
	return data as T;
}
