import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "#/components/page";
import { seo } from "#/lib/seo";
import { CONTACT_EMAIL, SITE_NAME } from "#/lib/site";

export const Route = createFileRoute("/terms")({
	head: () => seo({ title: "Terms of Use", description: `The rules for using ${SITE_NAME}'s free online tools.`, path: "/terms" }),
	component: () => (
		<LegalPage title="Terms of Use" updated="24 October 2026">
			<p>By using {SITE_NAME}, you agree to these terms. If you don't agree, please don't use the site.</p>
			<h2>1. Using the tools</h2>
			<p>
				You may use our tools for free, for personal and commercial purposes. You are responsible for the files and text you process and must have the right to
				use them.
			</p>
			<h2>2. Acceptable use</h2>
			<ul>
				<li>Don't use {SITE_NAME} for anything illegal, harmful or that infringes other people's rights.</li>
				<li>Don't try to disrupt, overload or attack the website, or scrape it automatically at scale.</li>
				<li>Don't use the AI helpers to create spam, plagiarism, or misleading content.</li>
			</ul>
			<h2>3. Your content</h2>
			<p>
				You keep all rights to your files and text. Because most tools run on your device, we never receive your files. Content you send through forms is handled
				under our <Link to="/privacy">Privacy Policy</Link>.
			</p>
			<h2>4. No warranty</h2>
			<p>
				Tools are provided “as is”. We work hard to make them accurate, but we can't guarantee results will be error-free. Always keep your original files and check
				important results. See our <Link to="/disclaimer">Disclaimer</Link>.
			</p>
			<h2>5. Limitation of liability</h2>
			<p>
				To the fullest extent allowed by law, {SITE_NAME} is not liable for any indirect or consequential loss, or for loss of data, arising from your use of the
				site.
			</p>
			<h2>6. Changes</h2>
			<p>We may change these terms or the tools at any time. Continuing to use the site means you accept the updated terms.</p>
			<h2>7. Contact</h2>
			<p>
				Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
			</p>
		</LegalPage>
	),
});
