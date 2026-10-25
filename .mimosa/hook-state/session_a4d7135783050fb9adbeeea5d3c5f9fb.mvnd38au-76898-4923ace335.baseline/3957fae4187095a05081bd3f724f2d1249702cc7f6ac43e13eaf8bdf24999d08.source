import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "#/components/page";
import { seo } from "#/lib/seo";
import { CONTACT_EMAIL, SITE_NAME } from "#/lib/site";

export const Route = createFileRoute("/privacy")({
	head: () =>
		seo({
			title: "Privacy Policy",
			description: `How ${SITE_NAME} handles your data: local processing, optional private Media Storage, and your choices.`,
			path: "/privacy",
		}),
	component: () => (
		<LegalPage title="Privacy Policy" updated="24 October 2026">
			<p>
				This policy explains what information {SITE_NAME} (“we”, “us”) collects when you use our
				website, and how we use it. The short version:{" "}
				<strong>processing stays on your device; uploading to your account is optional.</strong>
			</p>
			<h2>1. Files you process</h2>
			<p>
				Our image, PDF, media, calculator and generator tools run entirely in your web browser.
				Files you choose are processed by your device. Choosing Upload or Save to Media sends the
				selected file to our private object storage; it remains in your account until you delete it.
				Local processing inputs are not automatically uploaded.
			</p>
			<h2>Accounts and Media Storage</h2>
			<p>
				GitHub sign-in provides your name, email, avatar, and provider identifier. We store your
				account and sessions in PGlite and selected assets in private RustFS storage. Storage is
				limited to 10 GB per account and 100 MB per file. Tool input contents, passwords, and hashes
				are not added to recent history. You can clear history, delete saved assets, and revoke
				sessions in your dashboard. Deletion retries may temporarily retain files and quota while
				storage is unavailable. Backups follow the site operator’s retention schedule. Contact us to
				request account deletion.
			</p>
			<h2>2. AI text helpers</h2>
			<p>
				The Grammar Helper and Paraphrase Helper send the text you submit to our AI provider
				(Anthropic) so it can be checked or rewritten. We do not store this text, and our provider
				does not use it to train models under its commercial terms. Don't submit sensitive personal
				information to these tools.
			</p>
			<h2>3. Information you send us</h2>
			<p>
				When you use the contact form, request a quote or join the Premium waitlist, we store the
				details you enter (such as your name, email and message) so we can reply. We keep messages
				for up to 24 months and never sell them.
			</p>
			<h2>4. Information stored on your device</h2>
			<p>
				We use your browser's local storage for features you control: your theme choice, recently
				used and saved tools, invoice drafts and your cookie choice. When signed in, favorites,
				recent tool names, and preferences sync to your account. Anonymous settings remain on this
				device. You can clear it at any time in your browser settings.
			</p>
			<h2>5. Analytics</h2>
			<p>
				We may use privacy-friendly, cookieless analytics that count page views without identifying
				you or tracking you across websites. We also keep short-lived server logs (such as IP
				address and pages requested) for security and to prevent abuse.
			</p>
			<h2>6. Advertising</h2>
			<p>
				We may show ads from Google AdSense to keep {SITE_NAME} free. Only if you accept advertising
				cookies, third-party vendors including Google use cookies to serve ads based on your prior
				visits to this and other websites. Google's use of advertising cookies enables it and its
				partners to serve ads based on your visits. You can opt out of personalised advertising in{" "}
				<a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">
					Google Ads Settings
				</a>{" "}
				or at{" "}
				<a href="https://www.aboutads.info/choices" rel="noopener noreferrer" target="_blank">
					aboutads.info
				</a>
				. Learn more in{" "}
				<a
					href="https://policies.google.com/technologies/ads"
					rel="noopener noreferrer"
					target="_blank"
				>
					how Google uses information from sites that use its services
				</a>
				. See our <Link to="/cookies">Cookie Notice</Link> to change your choice.
			</p>
			<h2>7. Children</h2>
			<p>
				{SITE_NAME} is designed to be safe for everyone, including students. We do not knowingly
				collect personal information from children under 13. If you believe a child has sent us
				personal information, contact us and we will delete it.
			</p>
			<h2>8. Your rights</h2>
			<p>
				Depending on where you live (for example under the GDPR or CCPA), you may have the right to
				access, correct or delete the personal information we hold about you. Email{" "}
				<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will respond within 30 days.
			</p>
			<h2>9. Changes</h2>
			<p>We may update this policy. The date at the top shows when it last changed.</p>
		</LegalPage>
	),
});
