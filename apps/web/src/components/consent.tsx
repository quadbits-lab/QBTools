import { Button } from "@qbtools/ui/button";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { createLocalStore } from "#/lib/local-store";

export type ConsentState = "granted" | "denied" | null;

export const consentStore = createLocalStore<ConsentState>("qbtools.consent", null);
const REOPEN_EVENT = "qbtools:consent-reopen";

/** Ads are the only feature that needs consent; analytics is cookieless. */
export const consentRequired = Boolean(import.meta.env.VITE_ADSENSE_CLIENT);

export function reopenConsent() {
	window.dispatchEvent(new Event(REOPEN_EVENT));
}

export function ConsentBanner() {
	const consent = consentStore.use();
	const [forced, setForced] = useState(false);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
		const onReopen = () => setForced(true);
		window.addEventListener(REOPEN_EVENT, onReopen);
		return () => window.removeEventListener(REOPEN_EVENT, onReopen);
	}, []);

	if (!hydrated || !consentRequired || (consent !== null && !forced)) return null;

	const choose = (value: Exclude<ConsentState, null>) => {
		consentStore.write(value);
		setForced(false);
	};

	return (
		<section
			aria-label="Cookie consent"
			className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl border border-input bg-surface p-5 sm:inset-x-6 sm:bottom-6"
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<Cookie className="hidden size-7 shrink-0 sm:block" strokeWidth={1.5} />
				<p className="text-[0.95rem] leading-relaxed">
					Optional advertising cookies support QBTools. Essential sign-in cookies are separate. You
					can say no — every tool still works.{" "}
					<Link to="/cookies" className="text-foreground underline underline-offset-4">
						Learn more
					</Link>
				</p>
				<div className="flex shrink-0 gap-2">
					<Button variant="secondary" onClick={() => choose("denied")}>
						No thanks
					</Button>
					<Button onClick={() => choose("granted")}>Accept</Button>
				</div>
			</div>
		</section>
	);
}
