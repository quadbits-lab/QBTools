export const STORAGE_LIMIT = 10_000_000_000;
export const FILE_LIMIT = 100_000_000;
export const PREVIEW_LIMIT = 256_000;
export const MEDIA_ACCEPT =
	".png,.jpg,.jpeg,.webp,.avif,.gif,.heic,.heif,.svg,.ico,.mp3,.wav,.flac,.ogg,.m4a,.aac,.mp4,.webm,.mov,.pdf,.zip,.txt,.json,.enc";
export interface Preferences {
	theme: "dark" | "light" | "system";
	media_view: "grid" | "list";
	media_sort: "newest" | "oldest" | "name" | "size";
	track_recent: boolean;
	favorites_imported: boolean;
}
export interface MediaAsset {
	id: string;
	name: string;
	mime: string;
	bytes: number;
	preview_bytes: number;
	source_tool: string | null;
	created_at: string;
}
export interface PersonalData {
	preferences: Preferences;
	favorites: string[];
	recent: string[];
	storage: { used: number; reserved: number; limit: number; available: boolean };
}
/** Callback destinations must be local paths, never protocol-relative or encoded backslashes. */
export function safeReturnPath(value: unknown, fallback = "/dashboard") {
	if (
		typeof value !== "string" ||
		!value.startsWith("/") ||
		value.startsWith("//") ||
		/[\\\r\n]/.test(value)
	)
		return fallback;
	try {
		const decoded = decodeURIComponent(value);
		if (decoded.startsWith("//") || /[\\\r\n]/.test(decoded)) return fallback;
		const url = new URL(value, "https://qbtools.invalid");
		return url.origin === "https://qbtools.invalid" &&
			!url.pathname.startsWith("/api/") &&
			!url.pathname.startsWith("/login")
			? `${url.pathname}${url.search}${url.hash}`
			: fallback;
	} catch {
		return fallback;
	}
}
