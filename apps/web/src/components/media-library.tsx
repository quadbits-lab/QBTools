import { Button } from "@qbtools/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@qbtools/ui/dialog";
import { Input } from "@qbtools/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
import { toast } from "@qbtools/ui/toaster";
import {
	ChevronLeft,
	ChevronRight,
	CloudUpload,
	Download,
	File,
	FolderOpen,
	LayoutGrid,
	List,
	Loader2,
	Trash2,
	X,
} from "lucide-react";
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
	const total = used + reserved;
	const percent = Math.min(100, Math.round((total / STORAGE_LIMIT) * 100));
	return (
		<section
			className="flex flex-col gap-2 rounded-lg bg-muted/50 px-4 py-3"
			aria-label="Storage usage"
		>
			<div className="flex items-baseline justify-between gap-3">
				<span className="text-sm text-muted-foreground">Private Media Storage</span>
				<span className="font-mono text-xs text-muted-foreground">
					{decimalBytes(used)}
					{reserved ? ` + ${decimalBytes(reserved)} reserved` : ""} · {percent}% of 10 GB
				</span>
			</div>
			<div
				role="progressbar"
				aria-label="Storage used and reserved"
				aria-valuemin={0}
				aria-valuemax={STORAGE_LIMIT}
				aria-valuenow={total}
				className="h-1.5 w-full overflow-hidden rounded-full bg-border"
			>
				<div
					className="h-full rounded-full bg-primary transition-[width] duration-300"
					style={{ width: `${percent}%` }}
				/>
			</div>
			<p className="text-xs text-muted-foreground">100 MB per file. Files stay private.</p>
		</section>
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
	const visible = assets.filter(matches);
	return (
		<div className="flex flex-col gap-4">
			<StorageMeter />

			{/* Toolbar ------------------------------------------------ */}
			<div className="flex flex-wrap items-center gap-2">
				<Input
					aria-label="Search media"
					placeholder="Search your files…"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					className="h-9 min-w-44 flex-1"
				/>
				<Select
					value={kind}
					onValueChange={(value) => {
						setKind(value);
						setPage(0);
					}}
				>
					<SelectTrigger aria-label="Filter media" className="h-9 w-32">
						<SelectValue placeholder="All kinds" />
					</SelectTrigger>
					<SelectContent>
						{["all", "image", "audio", "video", "document"].map((value) => (
							<SelectItem key={value} value={value}>
								{value}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={sort} onValueChange={(value) => void changePreference("media_sort", value)}>
					<SelectTrigger aria-label="Sort media" className="h-9 w-32">
						<SelectValue placeholder="Sort media" />
					</SelectTrigger>
					<SelectContent>
						{["newest", "oldest", "name", "size"].map((value) => (
							<SelectItem key={value} value={value}>
								{value}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					variant="outline"
					size="icon"
					aria-label={view === "grid" ? "Switch to list view" : "Switch to grid view"}
					title={view === "grid" ? "List view" : "Grid view"}
					onClick={() => void changePreference("media_view", view === "grid" ? "list" : "grid")}
				>
					{view === "grid" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
				</Button>
			</div>

			{/* Upload row (library mode only) -------------------------- */}
			{!onPick && (
				<div className="flex flex-wrap items-center gap-3">
					<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
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
					{uploadLabel ? (
						<span role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="size-3.5 animate-spin" />
							{uploadLabel}
						</span>
					) : null}
					{uploadLabel && (
						<Button variant="ghost" size="sm" onClick={() => upload.current?.abort()}>
							Cancel upload
						</Button>
					)}
				</div>
			)}

			{/* Content -------------------------------------------------- */}
			{loading ? (
				<div
					className={view === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3"}
					aria-busy="true"
				>
					{[0, 1, 2].map((i) => (
						<div key={i} className="animate-pulse rounded-lg border border-border p-3">
							<div className="h-28 rounded-md bg-muted" />
							<div className="mt-3 h-3.5 w-3/4 rounded bg-muted" />
							<div className="mt-2 h-3 w-1/3 rounded bg-muted" />
						</div>
					))}
				</div>
			) : error ? (
				<div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
					<p className="text-sm text-muted-foreground">{error}</p>
					<Button variant="secondary" size="sm" onClick={() => setRevision((n) => n + 1)}>
						Try again
					</Button>
				</div>
			) : visible.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-14 text-center">
					<span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
						<FolderOpen className="size-5" aria-hidden="true" />
					</span>
					<p className="text-sm font-medium">No matching files yet</p>
					<p className="max-w-xs text-xs text-muted-foreground">
						{query || kind !== "all"
							? "Try a different search or filter."
							: "Files you save to Media Storage will appear here."}
					</p>
				</div>
			) : (
				<>
					<div
						className={
							view === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"
						}
					>
						{visible.map((asset) =>
							view === "grid" ? (
								<article
									key={asset.id}
									className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/25"
								>
									<button
										type="button"
										aria-label={`Preview ${asset.name}`}
										className="grid h-32 place-items-center overflow-hidden bg-muted/60"
										onClick={() => setPreview(asset)}
									>
										{Number(asset.preview_bytes) ? (
											<img
												src={`/api/media/${asset.id}/preview`}
												alt=""
												loading="lazy"
												className="max-h-32 w-full object-contain p-2"
											/>
										) : (
											<File className="size-8 text-muted-foreground" />
										)}
									</button>
									<div className="flex flex-col gap-2 p-3">
										<div className="min-w-0">
											<p className="truncate text-sm font-medium" title={asset.name}>
												{asset.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{decimalBytes(Number(asset.bytes))}
												{asset.source_tool ? ` · ${asset.source_tool}` : ""}
											</p>
										</div>
										{onPick ? (
											<Button size="sm" onClick={() => onPick(asset)}>
												Use this file
											</Button>
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
														const name = window.prompt(
															"Rename file (keep its extension)",
															asset.name,
														);
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
									</div>
								</article>
							) : (
								<article
									key={asset.id}
									className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-foreground/25"
								>
									<button
										type="button"
										aria-label={`Preview ${asset.name}`}
										className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted/60"
										onClick={() => setPreview(asset)}
									>
										{Number(asset.preview_bytes) ? (
											<img
												src={`/api/media/${asset.id}/preview`}
												alt=""
												loading="lazy"
												className="size-full object-cover"
											/>
										) : (
											<File className="size-4 text-muted-foreground" />
										)}
									</button>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium" title={asset.name}>
											{asset.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{decimalBytes(Number(asset.bytes))}
											{asset.source_tool ? ` · ${asset.source_tool}` : ""}
										</p>
									</div>
									{onPick ? (
										<Button size="sm" onClick={() => onPick(asset)}>
											Use
										</Button>
									) : (
										<div className="flex shrink-0 gap-1">
											<Button
												asChild
												variant="ghost"
												size="icon-sm"
												aria-label={`Download ${asset.name}`}
											>
												<a href={`/api/media/${asset.id}/content?download=1`}>
													<Download className="size-4" />
												</a>
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
							),
						)}
					</div>
					<div className="flex items-center justify-between">
						<Button
							variant="outline"
							size="sm"
							disabled={page === 0}
							onClick={() => setPage((n) => n - 1)}
						>
							<ChevronLeft /> Previous
						</Button>
						<span className="font-mono text-xs text-muted-foreground">page {page + 1}</span>
						<Button
							variant="outline"
							size="sm"
							disabled={!more}
							onClick={() => setPage((n) => n + 1)}
						>
							Next <ChevronRight />
						</Button>
					</div>
				</>
			)}

			{/* Preview dialog ------------------------------------------- */}
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
						<div className="flex flex-col gap-4">
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
									className="max-h-[60vh] w-full rounded-lg bg-muted/60 object-contain"
								/>
							) : preview.mime.startsWith("audio/") ? (
								<audio controls src={`/api/media/${preview.id}/content`}>
									<track kind="captions" />
								</audio>
							) : preview.mime.startsWith("video/") ? (
								<video
									controls
									src={`/api/media/${preview.id}/content`}
									className="max-h-[60vh] rounded-lg bg-muted/60"
								>
									<track kind="captions" />
								</video>
							) : (
								<p className="text-sm text-muted-foreground">
									This file is available as a download.
								</p>
							)}
							<Button asChild className="self-start">
								<a href={`/api/media/${preview.id}/content?download=1`}>
									<Download /> Download file
								</a>
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
