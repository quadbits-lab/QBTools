import { tools } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "#/components/page";
import { seo } from "#/lib/seo";
import { SITE_NAME } from "#/lib/site";

export const Route = createFileRoute("/about")({
	head: () =>
		seo({
			title: "About QBTools — Free Tools That Just Work",
			description:
				"QBTools makes simple, private, free online tools for everyday tasks. Learn who we are and how we keep your files safe.",
			path: "/about",
		}),
	component: AboutPage,
});

function AboutPage() {
	return (
		<>
			<PageHero
				eyebrow="About us"
				title="Small tools for everyday jobs"
				description={
					<p>
						{SITE_NAME} exists so anyone — a student, a parent, a shop owner or a grandparent — can
						finish a small task in seconds.
					</p>
				}
			/>
			<article className="container-page py-10">
				<div className="prose-qb">
					<h2>Why we built it</h2>
					<p>
						Most online tools ask you to sign up, upload your private files to unknown servers, sit
						through pop-ups, and then pay to remove a watermark. We thought that was backwards.{" "}
						{SITE_NAME} has {tools.length} tools today, and every one follows the same rules.
					</p>
					<h2>Our promises</h2>
					<ul>
						<li>
							<strong>Free.</strong> Every tool is free. Ads (once approved) keep the lights on; an
							optional Premium plan adds bulk features.
						</li>
						<li>
							<strong>No signup.</strong> Open a tool and use it. That's it.
						</li>
						<li>
							<strong>Private.</strong> Image, PDF, video and audio tools run inside your browser —
							files upload only when you explicitly save them to Media Storage. The AI text helpers
							send text to our AI provider, and we say so clearly on those pages.
						</li>
						<li>
							<strong>Simple.</strong> Plain words, big buttons, and pages that work on any phone.
						</li>
					</ul>
					<h2>Your workspace</h2>
					<p>
						Sign in with GitHub to sync favorite tools and save assets to private Media Storage.
					</p>
				</div>
				<Button asChild size="lg" className="mt-8">
					<Link to="/tools">Explore all tools</Link>
				</Button>
			</article>
		</>
	);
}
