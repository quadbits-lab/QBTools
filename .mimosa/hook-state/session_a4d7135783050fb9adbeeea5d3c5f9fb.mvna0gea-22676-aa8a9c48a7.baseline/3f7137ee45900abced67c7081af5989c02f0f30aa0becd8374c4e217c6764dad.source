import { Button } from "@qbtools/ui/button";
import { toast } from "@qbtools/ui/toaster";
import { Download, Share } from "lucide-react";
import { promptInstall, useInstallState } from "#/lib/pwa";

/**
 * Offers the app install. Chromium shows its native prompt through the
 * deferred `beforeinstallprompt` event; iOS Safari has no such event, so it
 * gets the manual "Add to Home Screen" instructions instead.
 *
 * Renders nothing once the app is already installed.
 */
export function PwaInstallButton({ className }: { className?: string }) {
	const { canInstall, installed, needsIosHint } = useInstallState();
	if (installed || (!canInstall && !needsIosHint)) return null;

	if (needsIosHint) {
		return (
			<Button
				variant="outline"
				size="icon-sm"
				className={className}
				aria-label="Add QBTools to your Home Screen"
				title="Add QBTools to your Home Screen"
				onClick={() =>
					toast("Add QBTools to your Home Screen", {
						description: "Tap the Share button in Safari, then choose “Add to Home Screen”.",
						duration: 8000,
					})
				}
			>
				<Share className="size-4" />
			</Button>
		);
	}

	return (
		<Button
			variant="outline"
			size="icon-sm"
			className={className}
			aria-label="Install QBTools"
			title="Install QBTools"
			onClick={() => void promptInstall()}
		>
			<Download className="size-4" />
		</Button>
	);
}
