import { Button } from "@qbtools/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@qbtools/ui/dialog";
import { Input, Select } from "@qbtools/ui/input";
import { toast } from "@qbtools/ui/toaster";
import { CloudUpload, Download, File, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "#/lib/api-client";
import { saveAsset } from "#/lib/media-client";
import { MEDIA_ACCEPT, type MediaAsset, STORAGE_LIMIT } from "#/lib/media-contract";
import { useAccount } from "./account-provider";

export const decimalBytes = (n: number) =>
	n >= 1e9
		? `${(n / 1e9).toFixed(2)} GB`
		: n >= 1e6
			? `${(n / 1e6).toFixed(1)} MB`
			: `${Math.ceil(n / 1000)} KB`;
export function StorageMeter() {
	const { data } = useAccount();
	const used = data?.storage.used ?? 0;
	const reserved = data?.storage.reserved ?? 0;
	return (
		<div className="grid gap-2 rounded-lg border border-border p-4">
			<div className="flex justify-between text-sm">
				<span>Private Media Storage</span>
				<strong>{decimalBytes(used)} / 10 GB</strong>
			</div>
			<progress
				aria-label="Storage used and reserved"
				className="h-2 w-full rounded-full accent-primary"
				value={used + reserved}
				max={STORAGE_LIMIT}
			/>
			<p className="text-xs text-muted-foreground">
				{reserved ? `${decimalBytes(reserved)} reserved for pending uploads. ` : ""}100 MB per file.
				Files stay private.
			</p>
		</div>
	);
}
export function MediaLibrary({
	onPick,
	accept,
}: {
	onPick?: (asset: MediaAsset) => void;
	accept?: string;
}) {
	const { data, refresh } = useAccount();
	const [assets, setAssets] = useState<MediaAsset[]>([]);
	const [search, setSearch] = useState("");
	const [query, setQuery] = useState("");
	const [kind, setKind] = useState("all");
	const [page, setPage] = useState(0);
	const [more, setMore] = useState(false);
	const [revision, setRevision] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [uploadLabel, setUploadLabel] = useState("");
	const [preview, setPreview] = useState<MediaAsset | null>(null);
	const upload = useRef<AbortController | null>(null);
	const sort = data?.preferences.media_sort ?? "newest";
	const view = data?.preferences.media_view ?? "grid";
	useEffect(() => {
		const timer = setTimeout(() => {
			setQuery(search);
			setPage(0);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);
	useEffect(() => () => upload.current?.abort(), []);
	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);
		setError("");
		void api<{ assets: MediaAsset[]; more: boolean }>(
			`/api/media/list?${new URLSearchParams({ search: query, kind, sort, page: String(page), revision: String(revision) })}`,
			{ signal: controller.signal },
		)
			.then((result) => {
				setAssets(result.assets);
				setMore(result.more);
			})
			.catch((reason) => {
				if (!controller.signal.aborted) setError(reason.message);
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [query, kind, sort, page, revision]);
	const changePreference = async (key: string, value: string) => {
		try {
			await api("/api/account/preferences", {
				method: "PATCH",
				body: JSON.stringify({ [key]: value }),
			});
			await refresh();
		} catch (reason) {
			toast.error(String(reason));
		}
	};
	const matches = (asset: MediaAsset) =>
		!accept ||
		accept.split(",").some((rule) => {
			const value = rule.trim().toLowerCase();
			return (
				value === "*/*" ||
				(value.startsWith(".")
					? asset.name.toLowerCase().endsWith(value)
					: value.endsWith("/*")
						? asset.mime.startsWith(value.slice(0, -1))
						: value === asset.mime)
			);
		});
	return (
		<div className="grid gap-5">
			<StorageMeter />
			{!onPick && (
				<div className="flex flex-wrap items-center gap-3">
					<label className="inline-flex cursor-pointer items-center gap-2 border border-input px-4 py-3 hover:bg-muted">
						<CloudUpload className="size-4" />
						Upload files
						<input
							aria-label="Upload files"
							className="sr-only"
							type="file"
							accept={MEDIA_ACCEPT}
							multiple
							disabled={!data || Boolean(uploadLabel)}
							onChange={async (event) => {
								const files = Array.from(event.target.files ?? []);
								event.target.value = "";
								const run = new AbortController();
								upload.current = run;
								for (const file of files) {
									if (run.signal.aborted) break;
									setUploadLabel(`Preparing ${file.name}…`);
									try {
										await saveAsset(file, file.name, {
											signal: run.signal,
											onProgress: (n) =>
												setUploadLabel(
													n === null
														? `Verifying ${file.name}…`
														: `${file.name} · ${Math.round(n * 100)}%`,
												),
										});
									} catch (reason) {
										if (!run.signal.aborted)
											toast.error(reason instanceof Error ? reason.message : "Upload failed.");
									}
								}
								setUploadLabel("");
								upload.current = null;
								setRevision((n) => n + 1);
								await refresh();
							}}
						/>
					</label>
					<span role="status" className="text-sm">
						{uploadLabel || "Upload media, PDFs, ZIPs, text, JSON projects, or QBTools .enc files."}
					</span>
					{uploadLabel && (
						<Button variant="ghost" onClick={() => upload.current?.abort()}>
							Cancel upload
						</Button>
					)}
				</div>
			)}
			<div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
				<Input
					aria-label="Search media"
					placeholder="Search your files…"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
				<Select
					aria-label="Filter media"
					value={kind}
					onChange={(event) => {
						setKind(event.target.value);
						setPage(0);
					}}
				>
					{["all", "image", "audio", "video", "document"].map((value) => (
						<option key={value} value={value}>
							{value}
						</option>
					))}
				</Select>
				<Select
					aria-label="Sort media"
					value={sort}
					onChange={(event) => void changePreference("media_sort", event.target.value)}
				>
					{["newest", "oldest", "name", "size"].map((value) => (
						<option key={value} value={value}>
							{value}
						</option>
					))}
				</Select>
				<Button
					variant="secondary"
					onClick={() => void changePreference("media_view", view === "grid" ? "list" : "grid")}
				>
					{view === "grid" ? "List view" : "Grid view"}
				</Button>
			</div>
			{loading ? (
				<p role="status">Loading your files…</p>
			) : error ? (
				<div role="alert">
					<p>{error}</p>
					<Button variant="secondary" onClick={() => setRevision((n) => n + 1)}>
						Try again
					</Button>
				</div>
			) : (
				<>
					<div
						className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3"}
					>
						{assets.filter(matches).map((asset) => (
							<article key={asset.id} className="grid gap-3 border border-input p-4">
								<button
									type="button"
									aria-label={`Preview ${asset.name}`}
									className="grid h-28 place-items-center overflow-hidden bg-muted"
									onClick={() => setPreview(asset)}
								>
									{Number(asset.preview_bytes) ? (
										<img
											src={`/api/media/${asset.id}/preview`}
											alt=""
											loading="lazy"
											className="max-h-28 max-w-full object-contain"
										/>
									) : (
										<File className="size-8" />
									)}
								</button>
								<div>
									<p className="truncate font-medium" title={asset.name}>
										{asset.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{decimalBytes(Number(asset.bytes))}
										{asset.source_tool ? ` · ${asset.source_tool}` : ""}
									</p>
								</div>
								{onPick ? (
									<Button onClick={() => onPick(asset)}>Use this file</Button>
								) : (
									<div className="flex flex-wrap gap-1">
										<Button asChild variant="secondary" size="sm">
											<a href={`/api/media/${asset.id}/content?download=1`}>
												<Download className="size-4" />
												Download
											</a>
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={async () => {
												const name = window.prompt("Rename file (keep its extension)", asset.name);
												if (!name || name === asset.name) return;
												try {
													await api(`/api/media/${asset.id}`, {
														method: "PATCH",
														body: JSON.stringify({ name }),
													});
													setRevision((n) => n + 1);
												} catch (reason) {
													toast.error(String(reason));
												}
											}}
										>
											Rename
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Delete ${asset.name}`}
											onClick={async () => {
												if (!window.confirm(`Delete ${asset.name} from Media Storage?`)) return;
												try {
													await api(`/api/media/${asset.id}`, { method: "DELETE" });
													setRevision((n) => n + 1);
													await refresh();
												} catch (reason) {
													toast.error(String(reason));
												}
											}}
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								)}
							</article>
						))}
					</div>
					{assets.filter(matches).length === 0 && (
						<p className="py-10 text-center text-muted-foreground">No matching files yet.</p>
					)}
					<div className="flex justify-between">
						<Button variant="secondary" disabled={page === 0} onClick={() => setPage((n) => n - 1)}>
							Previous
						</Button>
						<Button variant="secondary" disabled={!more} onClick={() => setPage((n) => n + 1)}>
							Next
						</Button>
					</div>
				</>
			)}
			{preview && (
				<Dialog
					open
					onOpenChange={(open) => {
						if (!open) setPreview(null);
					}}
				>
					<DialogContent
						aria-describedby={undefined}
						className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl"
					>
						<section className="grid w-full max-w-3xl gap-4 border border-input bg-background p-5">
							<div className="flex items-center justify-between gap-4">
								<DialogTitle className="truncate">{preview.name}</DialogTitle>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Close preview"
									onClick={() => setPreview(null)}
								>
									<X />
								</Button>
							</div>
							{/^image\/(png|jpeg|webp|gif|avif)$/.test(preview.mime) ? (
								<img
									src={`/api/media/${preview.id}/content`}
									alt={preview.name}
									className="max-h-[65vh] w-full object-contain"
								/>
							) : preview.mime.startsWith("audio/") ? (
								<audio controls src={`/api/media/${preview.id}/content`}>
									<track kind="captions" />
								</audio>
							) : preview.mime.startsWith("video/") ? (
								<video controls src={`/api/media/${preview.id}/content`} className="max-h-[65vh]">
									<track kind="captions" />
								</video>
							) : (
								<p>This file is available as a download.</p>
							)}
							<Button asChild>
								<a href={`/api/media/${preview.id}/content?download=1`}>Download file</a>
							</Button>
						</section>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
