import { Button } from "@qbtools/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@qbtools/ui/dialog";
import { toast } from "@qbtools/ui/toaster";
import { FolderOpen } from "lucide-react";
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
					className="max-h-[85dvh] overflow-y-auto sm:max-w-4xl"
				>
					<div className="p-4">
						<DialogTitle>Choose from your Media Storage</DialogTitle>
						<DialogClose className="absolute right-3 top-3 p-2" aria-label="Close media picker">
							×
						</DialogClose>
					</div>
					{loading ? (
						<p role="status">Loading file into this tool…</p>
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
				</DialogContent>
			</Dialog>
		</>
	);
}
