import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { cn } from "@qbtools/ui/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, CheckCircle2, Crown } from "lucide-react";
import { HONEYPOT_PROPS, useFormSubmit } from "#/components/kit/use-form-submit";
import { PageHero } from "#/components/page";
import { waitlistSchema } from "#/lib/form-schemas";
import { seo } from "#/lib/seo";
import { joinWaitlist } from "#/server/forms.functions";

export const Route = createFileRoute("/premium")({
	head: () =>
		seo({
			title: "QBTools Premium — Bulk Processing, No Ads",
			description:
				"QBTools stays free. Premium adds bulk processing, no ads, bigger files and priority AI. Join the waitlist for early-bird pricing.",
			path: "/premium",
		}),
	component: PremiumPage,
});

const PLANS = [
	{
		name: "Free",
		price: "$0",
		note: "forever",
		features: ["All 24 tools", "Files processed on your device", "No signup", "Fair-use AI helper"],
		highlight: false,
	},
	{
		name: "Premium",
		price: "$4",
		note: "per month (early bird)",
		features: [
			"No ads, anywhere",
			"Bulk mode: 100s of files at once",
			"Bigger files & longer videos",
			"Priority AI with longer texts",
			"Saved presets & history across devices",
		],
		highlight: true,
	},
	{
		name: "Business",
		price: "Custom",
		note: "for teams",
		features: [
			"Everything in Premium",
			"Team seats & invoices",
			"API access",
			"Your branding on tools",
		],
		highlight: false,
	},
];

function PremiumPage() {
	const { errors, pending, done, onSubmit } = useFormSubmit(
		waitlistSchema,
		useServerFn(joinWaitlist),
	);
	return (
		<>
			<PageHero
				eyebrow="Coming soon"
				title="QBTools Premium"
				description={
					<p>
						Every tool stays free. Premium is for people who process a lot of files and want zero
						ads.
					</p>
				}
			/>
			<div className="container-page py-12">
				<div className="grid gap-5 lg:grid-cols-3">
					{PLANS.map((plan) => (
						<div
							key={plan.name}
							className={cn(
								"flex flex-col border bg-surface p-7",
								plan.highlight ? "border-primary" : "border-border",
							)}
						>
							<h2 className="flex items-center gap-2 text-xl font-medium">
								{plan.highlight && <Crown className="size-5 text-foreground" />}
								{plan.name}
							</h2>
							<p className="mt-4">
								<span className="text-4xl font-medium">{plan.price}</span>{" "}
								<span className="text-muted-foreground">{plan.note}</span>
							</p>
							<ul className="mt-6 flex flex-col gap-3">
								{plan.features.map((f) => (
									<li key={f} className="flex gap-2.5">
										<Check className="mt-1 size-4 shrink-0 text-positive" />
										{f}
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<section
					aria-labelledby="waitlist"
					className="mx-auto mt-14 max-w-2xl bg-muted p-6 text-center sm:p-10"
				>
					<h2 id="waitlist" className="text-2xl font-medium tracking-[-0.035em]">
						Join the waitlist
					</h2>
					<p className="mt-2 text-muted-foreground">
						Be first in line and lock in early-bird pricing. No spam, ever.
					</p>
					{done ? (
						<p className="mt-6 flex items-center justify-center gap-2 text-lg font-medium text-positive">
							<CheckCircle2 /> {done}
						</p>
					) : (
						<form
							onSubmit={onSubmit}
							noValidate
							className="relative mx-auto mt-6 flex max-w-lg flex-col gap-3 sm:flex-row"
						>
							<input {...HONEYPOT_PROPS} />
							<label htmlFor="w-email" className="sr-only">
								Email
							</label>
							<Input
								id="w-email"
								name="email"
								type="email"
								placeholder="you@example.com"
								autoComplete="email"
								aria-invalid={Boolean(errors.email)}
								className="flex-1"
							/>
							<input type="hidden" name="interest" value="premium" />
							<Button type="submit" size="md" disabled={pending}>
								{pending ? "Joining…" : "Join waitlist"}
							</Button>
						</form>
					)}
					{errors.email && (
						<p role="alert" className="mt-2 text-sm text-critical">
							{errors.email}
						</p>
					)}
				</section>
			</div>
		</>
	);
}
