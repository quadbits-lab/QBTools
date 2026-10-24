import { Button } from "@qbtools/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { GitHubIcon } from "#/components/github-icon";
import { authClient } from "#/lib/auth-client";
import { safeReturnPath } from "#/lib/media-contract";
import { seo } from "#/lib/seo";
import { sessionFn } from "#/server/auth.functions";
export const Route = createFileRoute("/login")({
	validateSearch: z.object({ redirect: z.string().optional(), error: z.string().optional() }),
	loader: () => sessionFn(),
	head: () =>
		seo({
			title: "Sign in",
			description: "Your QBTools dashboard and private media library.",
			path: "/login",
			noindex: true,
		}),
	component: LoginPage,
});
function LoginPage() {
	const { enabled } = Route.useLoaderData();
	const search = Route.useSearch();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(
		search.error ? "GitHub sign-in was cancelled or could not be completed. Please try again." : "",
	);
	return (
		<div className="container-page flex justify-center py-20">
			<section className="grid w-full max-w-lg gap-6 border border-input bg-surface p-8">
				<GitHubIcon className="size-10" />
				<h1 className="text-3xl">Your tools. Your workspace.</h1>
				<p className="text-muted-foreground">
					Save favorite tools, continue across devices, and keep up to 10 GB of assets in your
					private Media Storage.
				</p>
				<Button
					disabled={pending || !enabled}
					onClick={async () => {
						setPending(true);
						setError("");
						try {
							const result = await authClient.signIn.social({
								provider: "github",
								callbackURL: safeReturnPath(search.redirect),
								errorCallbackURL: "/login?error=oauth",
							});
							if (result.error) throw new Error("GitHub sign-in could not start. Try again.");
						} catch (reason) {
							setError(reason instanceof Error ? reason.message : "Try again.");
							setPending(false);
						}
					}}
				>
					<GitHubIcon />
					{pending ? "Connecting to GitHub…" : "Sign in with GitHub"}
				</Button>
				{!enabled && (
					<p role="status" className="text-sm text-muted-foreground">
						GitHub sign-in is being configured. Public tools remain available.
					</p>
				)}
				{error && (
					<p role="alert" className="text-critical">
						{error}
					</p>
				)}
				<p className="flex gap-2 text-sm text-muted-foreground">
					<ShieldCheck className="size-5 shrink-0" />
					Tool processing stays on your device. Files upload only when you choose to save them.
				</p>
			</section>
		</div>
	);
}
