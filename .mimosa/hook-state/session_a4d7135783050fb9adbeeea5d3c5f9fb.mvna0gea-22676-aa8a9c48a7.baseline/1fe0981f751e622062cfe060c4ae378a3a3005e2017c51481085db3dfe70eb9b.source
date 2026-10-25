import { Button } from "@qbtools/ui/button";
import { toast } from "@qbtools/ui/toaster";
import { CloudUpload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { saveAsset } from "#/lib/media-client";
import { useAccount } from "../account-provider";
export function SaveToMedia({
	blob,
	name,
	sourceTool,
	prepare,
}: {
	blob?: Blob;
	name: string;
	sourceTool?: string;
	prepare?: () => Promise<Blob | null>;
}) {
	const { user, refresh } = useAccount();
	const controller = useRef<AbortController | null>(null);
	const [progress, setProgress] = useState<number | null | undefined>();
	const [saved, setSaved] = useState(false);
	const previousBlob = useRef(blob);
	useEffect(() => {
		if (previousBlob.current !== blob) {
			setSaved(false);
			previousBlob.current = blob;
		}
		return () => controller.current?.abort();
	}, [blob]);
	if (!user || (!blob && !prepare)) return null;
	const busy = progress !== undefined;
	return (
		<span className="flex items-center gap-1">
			<Button
				variant="secondary"
				disabled={busy || (saved && !prepare)}
				onClick={async () => {
					const run = new AbortController();
					controller.current = run;
					setProgress(0);
					try {
						const slug = sourceTool ?? /^\/tools\/([^/]+)/.exec(window.location.pathname)?.[1];
						const output = prepare ? await prepare() : blob;
						if (!output) throw new Error("Generate a file first.");
						await saveAsset(output, name, {
							signal: run.signal,
							sourceTool: slug,
							onProgress: setProgress,
						});
						setSaved(true);
						toast.success("Saved to your private Media Storage.");
						await refresh();
					} catch (error) {
						if (!(error instanceof Error && error.name === "AbortError"))
							toast.error(error instanceof Error ? error.message : "Could not save the file.");
					} finally {
						setProgress(undefined);
						controller.current = null;
					}
				}}
			>
				<CloudUpload className="size-4" />
				{saved
					? "Saved to Media"
					: progress === null
						? "Verifying…"
						: busy
							? `Uploading ${Math.round((progress ?? 0) * 100)}%`
							: "Save to Media"}
			</Button>
			{busy && (
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Cancel saving"
					onClick={() => controller.current?.abort()}
				>
					<X className="size-4" />
				</Button>
			)}
		</span>
	);
}
