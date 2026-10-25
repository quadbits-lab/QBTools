import { Button } from "@qbtools/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@qbtools/ui/dialog";
import { toast } from "@qbtools/ui/toaster";
import { FolderOpen, Loader2, X } from "lucide-react";
import { useState } from "react";
import { readMediaFile } from "#/lib/media-client";
import { useAccount } from "../account-provider";
import { MediaLibrary } from "../media-library";
export function ChooseMedia({
	accept,
	onFiles,
}: {
	accept: string;
	onFiles: (files: File[]) => void;
}) {
	const { user } = useAccount();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	if (!user) return null;
	return (
		<>
			<Button variant="secondary" className="self-start" onClick={() => setOpen(true)}>
				<FolderOpen className="size-4" />
				Choose from Media
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					aria-describedby={undefined}
					className="max-h-[85dvh] gap-0 overflow-y-auto p-0 sm:max-w-4xl"
				>
					<div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card/95 px-5 py-4 backdrop-blur-sm">
						<div className="min-w-0">
							<DialogTitle>Choose from your Media Storage</DialogTitle>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Pick a file to load it into this tool.
							</p>
						</div>
						<DialogClose
							className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Close media picker"
						>
							<X className="size-4" />
						</DialogClose>
					</div>
					<div className="p-5">
						{loading ? (
							<p
								role="status"
								className="flex items-center gap-2 py-10 text-sm text-muted-foreground"
							>
								<Loader2 className="size-4 animate-spin" /> Loading file into this tool…
							</p>
						) : (
							<MediaLibrary
								accept={accept}
								onPick={async (asset) => {
									setLoading(true);
									try {
										onFiles([await readMediaFile(asset)]);
										setOpen(false);
									} catch (error) {
										toast.error(error instanceof Error ? error.message : "Could not load file.");
									} finally {
										setLoading(false);
									}
								}}
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
