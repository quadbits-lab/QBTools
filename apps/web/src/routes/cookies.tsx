import { Button } from "@qbtools/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { consentStore, reopenConsent } from "#/components/consent";
import { LegalPage } from "#/components/page";
import { seo } from "#/lib/seo";
import { SITE_NAME } from "#/lib/site";

export const Route = createFileRoute("/cookies")({
	head: () => seo({ title: "Cookie Notice", description: `Which cookies and local storage ${SITE_NAME} uses, and how to change your choice.`, path: "/cookies" }),
	component: CookiesPage,
});

function CookiesPage() {
	const consent = consentStore.use();
	return (
		<LegalPage title="Cookie Notice" updated="24 October 2026">
			<p>We keep cookies to a minimum. Here's everything {SITE_NAME} stores in your browser.</p>
			<h2>Strictly necessary (always on)</h2>
			<ul>
				<li>
					<strong>Preferences</strong> (local storage): theme, recent and saved tools, invoice drafts, and your cookie choice. Stays on your device.
				</li>
				<li>
					<strong>Admin session</strong> (cookie, site owner only): keeps the site administrator signed in.
				</li>
			</ul>
			<h2>Advertising (only if you accept)</h2>
			<p>
				If you accept, Google AdSense and its partners may set cookies to show and measure ads, and may personalise ads based on your visits to other sites. If
				you decline, no advertising cookies are set. Read more in our <Link to="/privacy">Privacy Policy</Link>.
			</p>
			<h2>Analytics</h2>
			<p>Our optional analytics are cookieless and don't identify you.</p>
			<h2>Your choice</h2>
			<p>
				Current choice:{" "}
				<strong>{consent === "granted" ? "Advertising cookies accepted" : consent === "denied" ? "Advertising cookies declined" : "Not chosen yet"}</strong>
			</p>
			<div className="not-prose flex flex-wrap gap-3">
				<Button variant="secondary" onClick={() => consentStore.write("denied")}>
					Decline advertising cookies
				</Button>
				<Button onClick={() => consentStore.write("granted")}>Accept advertising cookies</Button>
				<Button variant="ghost" onClick={reopenConsent}>
					Show the banner again
				</Button>
			</div>
		</LegalPage>
	);
}
