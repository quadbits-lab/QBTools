import { cn } from "@qbtools/ui/utils";
import { useEffect, useRef } from "react";
import { consentStore } from "./consent";

declare global {
	interface Window {
		adsbygoogle?: unknown[];
	}
}

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;
const SLOTS = {
	top: import.meta.env.VITE_ADSENSE_SLOT_TOP,
	bottom: import.meta.env.VITE_ADSENSE_SLOT_BOTTOM,
} as const;

let scriptRequested = false;
function loadAdsense(client: string) {
	if (scriptRequested) return;
	scriptRequested = true;
	const script = document.createElement("script");
	script.async = true;
	script.crossOrigin = "anonymous";
	script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
	document.head.appendChild(script);
}

/**
 * Reserved ad space (fixed min-height, so no layout shift). Renders nothing
 * until AdSense is configured, and shows ads only after the visitor accepts.
 */
export function AdSlot({ position, className }: { position: keyof typeof SLOTS; className?: string }) {
	const consent = consentStore.use();
	const ref = useRef<HTMLModElement>(null);
	const slot = SLOTS[position];
	const enabled = Boolean(CLIENT && slot) && consent === "granted";

	useEffect(() => {
		if (!enabled || !CLIENT || !ref.current || ref.current.dataset.loaded) return;
		loadAdsense(CLIENT);
		ref.current.dataset.loaded = "1";
		try {
			window.adsbygoogle = window.adsbygoogle ?? [];
			window.adsbygoogle.push({});
		} catch {
			// Ad blockers throw here; the reserved space simply stays empty.
		}
	}, [enabled]);

	if (!CLIENT || !slot) return null;
	return (
		<aside aria-label="Advertisement" className={cn("my-8 flex min-h-[100px] flex-col items-center justify-center", className)}>
			<span className="mb-1 text-[0.7rem] tracking-wide text-muted-foreground uppercase">Advertisement</span>
			{enabled ? (
				<ins
					ref={ref}
					className="adsbygoogle block w-full"
					data-ad-client={CLIENT}
					data-ad-slot={slot}
					data-ad-format="auto"
					data-full-width-responsive="true"
				/>
			) : (
				<div className="h-[90px] w-full rounded-xl bg-muted/50" />
			)}
		</aside>
	);
}
