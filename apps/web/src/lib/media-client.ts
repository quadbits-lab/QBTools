import { api } from "./api-client";
import { FILE_LIMIT, type MediaAsset } from "./media-contract";

async function makePreview(blob: Blob) {
	if (!/^image\/(png|jpeg|webp|avif|gif)$/.test(blob.type) || blob.size > 10_000_000) return null;
	try {
		const image = await createImageBitmap(blob, { resizeWidth: 256, resizeQuality: "high" });
		const scale = Math.min(1, 256 / image.width, 256 / image.height);
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(image.width * scale));
		canvas.height = Math.max(1, Math.round(image.height * scale));
		canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
		image.close();
		const preview = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/png"),
		);
		return preview && preview.size <= 256_000 ? preview : null;
	} catch {
		return null;
	}
}
function putBlob(path: string, blob: Blob, signal: AbortSignal, onProgress: (n: number) => void) {
	return new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const abort = () => xhr.abort();
		xhr.open("PUT", path);
		xhr.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
		xhr.upload.onprogress = (event) => onProgress(event.loaded);
		xhr.onload = () => {
			signal.removeEventListener("abort", abort);
			if (xhr.status >= 200 && xhr.status < 300) resolve();
			else {
				let message = "Upload failed. Try again.";
				try {
					message = JSON.parse(xhr.responseText).message ?? message;
				} catch {
					/* proxy error */
				}
				reject(new Error(message));
			}
		};
		xhr.onerror = () => {
			signal.removeEventListener("abort", abort);
			reject(new Error("Upload connection failed. Try again."));
		};
		xhr.onabort = () => {
			signal.removeEventListener("abort", abort);
			reject(new DOMException("Upload cancelled", "AbortError"));
		};
		signal.addEventListener("abort", abort, { once: true });
		if (signal.aborted) {
			reject(new DOMException("Upload cancelled", "AbortError"));
			return;
		}
		xhr.send(blob);
	});
}
export async function saveAsset(
	blob: Blob,
	name: string,
	options: {
		signal: AbortSignal;
		sourceTool?: string;
		onProgress?: (percent: number | null) => void;
	},
) {
	if (!blob.size || blob.size > FILE_LIMIT)
		throw new Error("Choose a non-empty file up to 100 MB.");
	const preview = await makePreview(blob);
	options.signal.throwIfAborted();
	const upload = await api<{ id: string }>("/api/media/uploads", {
		method: "POST",
		body: JSON.stringify({
			requestKey: crypto.randomUUID(),
			name,
			mime: blob.type,
			bytes: blob.size,
			previewBytes: preview?.size ?? 0,
			sourceTool: options.sourceTool,
		}),
	});
	try {
		options.signal.throwIfAborted();
		await putBlob(`/api/media/uploads/${upload.id}/content`, blob, options.signal, (n) =>
			options.onProgress?.(n / (blob.size + (preview?.size ?? 0))),
		);
		if (preview)
			await putBlob(`/api/media/uploads/${upload.id}/preview`, preview, options.signal, (n) =>
				options.onProgress?.((blob.size + n) / (blob.size + preview.size)),
			);
		options.signal.throwIfAborted();
		options.onProgress?.(null);
		return await api<{ id: string; name: string }>(`/api/media/uploads/${upload.id}/complete`, {
			method: "POST",
		});
	} catch (error) {
		await api(`/api/media/uploads/${upload.id}`, { method: "DELETE" }).catch(() => {});
		throw error;
	}
}
export async function readMediaFile(asset: MediaAsset) {
	const response = await fetch(`/api/media/${asset.id}/content`, { credentials: "same-origin" });
	if (!response.ok) throw new Error("The file could not be loaded. Try signing in again.");
	return new File([await response.blob()], asset.name, { type: asset.mime });
}
