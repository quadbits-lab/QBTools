let manifest: Promise<Record<string, string>> | null = null;
export async function assetBase(name: string): Promise<string> {
	manifest ??= fetch("/wasm/manifest.json")
		.then(async (response) => {
			if (!response.ok) throw new Error("Processing assets couldn't load. Please retry.");
			return response.json() as Promise<Record<string, string>>;
		})
		.catch((error) => {
			manifest = null;
			throw error;
		});
	const base = (await manifest)[name];
	if (!base) throw new Error(`Missing processing asset: ${name}`);
	return new URL(base, globalThis.location.origin).href;
}
