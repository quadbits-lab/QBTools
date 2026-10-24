/** Browser file helpers shared by every file-based tool. */

export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.rel = "noopener";
	document.body.appendChild(link);
	link.click();
	link.remove();
	// Give the browser a moment to start the download before revoking.
	setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** "holiday photo.HEIC" + "jpg" → "holiday photo.jpg" */
export function replaceExtension(filename: string, extension: string): string {
	const base = filename.replace(/\.[^./\\]+$/, "") || "file";
	return `${base}.${extension}`;
}

/** "report.pdf" + "compressed" → "report-compressed.pdf" */
export function suffixFilename(filename: string, suffix: string, extension?: string): string {
	const match = /^(.*?)(\.[^./\\]+)?$/.exec(filename);
	const base = match?.[1] || "file";
	const ext = extension ? `.${extension}` : (match?.[2] ?? "");
	return `${base}-${suffix}${ext}`;
}

/** Bundle several outputs into one ZIP download (streamed, no compression). */
export async function zipFiles(files: { name: string; blob: Blob }[]): Promise<Blob> {
	const { downloadZip } = await import("client-zip");
	const seen = new Map<string, number>();
	const entries = files.map(({ name, blob }) => {
		const count = seen.get(name) ?? 0;
		seen.set(name, count + 1);
		return { name: count ? suffixFilename(name, String(count + 1)) : name, input: blob };
	});
	return downloadZip(entries).blob();
}

export function isImageFile(file: File) {
	return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}

export function isHeic(file: File) {
	return /image\/hei[cf]/.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}
