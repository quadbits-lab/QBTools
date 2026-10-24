import { Button } from "@qbtools/ui/button";
import { Input, Select, Textarea } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Code2, Layers, Megaphone, Palette, Send } from "lucide-react";
import { HONEYPOT_PROPS, useFormSubmit } from "#/components/kit/use-form-submit";
import { PageHero } from "#/components/page";
import { BUDGETS, leadSchema, SERVICES } from "#/lib/form-schemas";
import { seo } from "#/lib/seo";
import { submitLead } from "#/server/forms.functions";

export const Route = createFileRoute("/services")({
	head: () =>
		seo({
			title: "Services — Custom Tools, Websites, Design & SEO",
			description:
				"Hire the QBTools team to build custom calculators, websites, designs and SEO content for your business. Free quote within 2 days.",
			path: "/services",
		}),
	component: ServicesPage,
});

const OFFERS = [
	{
		icon: Code2,
		title: "Custom tools & calculators",
		text: "Loan calculators, quote builders, converters — embedded on your own website and branded to match.",
	},
	{
		icon: Layers,
		title: "Websites & web apps",
		text: "Fast, mobile-first websites that are easy to update. From landing pages to full web apps.",
	},
	{
		icon: Palette,
		title: "Design & branding",
		text: "Logos, social media kits, YouTube thumbnails and presentation templates.",
	},
	{
		icon: Megaphone,
		title: "SEO & content",
		text: "Pages and articles built to rank, plus technical SEO audits for existing sites.",
	},
];

function ServicesPage() {
	const { errors, pending, done, onSubmit, reset } = useFormSubmit(
		leadSchema,
		useServerFn(submitLead),
	);
	return (
		<>
			<PageHero
				eyebrow="QBTools Services"
				title="We build the tools and websites your business needs"
				description={
					<p>
						The same team that makes QBTools fast and simple can build for you. Tell us what you
						need — the quote is free.
					</p>
				}
			/>
			<div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_1.1fr]">
				<div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
					{OFFERS.map((offer) => (
						<div
							key={offer.title}
							className="flex gap-4 rounded-2xl border border-border bg-surface p-5"
						>
							<span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
								<offer.icon className="size-6" />
							</span>
							<div>
								<h2 className="font-bold">{offer.title}</h2>
								<p className="mt-1 text-muted-foreground">{offer.text}</p>
							</div>
						</div>
					))}
				</div>
				<section
					aria-labelledby="quote"
					className="rounded-3xl border border-border bg-surface p-5 sm:p-8"
				>
					<h2 id="quote" className="text-2xl font-extrabold tracking-tight">
						Get a free quote
					</h2>
					{done ? (
						<div className="flex flex-col items-center gap-4 py-10 text-center">
							<CheckCircle2 className="size-14 text-positive" />
							<p className="text-lg font-semibold">{done}</p>
							<Button variant="secondary" onClick={reset}>
								Send another request
							</Button>
						</div>
					) : (
						<form
							onSubmit={onSubmit}
							noValidate
							className="relative mt-6 grid gap-5 sm:grid-cols-2"
						>
							<input {...HONEYPOT_PROPS} />
							<Field label="Your name" htmlFor="l-name" error={errors.name}>
								<Input
									id="l-name"
									name="name"
									autoComplete="name"
									aria-invalid={Boolean(errors.name)}
								/>
							</Field>
							<Field label="Email" htmlFor="l-email" error={errors.email}>
								<Input
									id="l-email"
									name="email"
									type="email"
									autoComplete="email"
									aria-invalid={Boolean(errors.email)}
								/>
							</Field>
							<Field label="Company (optional)" htmlFor="l-company">
								<Input id="l-company" name="company" autoComplete="organization" />
							</Field>
							<Field label="What do you need?" htmlFor="l-service" error={errors.service}>
								<Select id="l-service" name="service" defaultValue={SERVICES[0]}>
									{SERVICES.map((s) => (
										<option key={s}>{s}</option>
									))}
								</Select>
							</Field>
							<Field label="Budget (optional)" htmlFor="l-budget" className="sm:col-span-2">
								<Select id="l-budget" name="budget" defaultValue="">
									<option value="">Prefer not to say</option>
									{BUDGETS.map((b) => (
										<option key={b}>{b}</option>
									))}
								</Select>
							</Field>
							<Field
								label="About your project"
								htmlFor="l-message"
								error={errors.message}
								className="sm:col-span-2"
							>
								<Textarea
									id="l-message"
									name="message"
									rows={5}
									aria-invalid={Boolean(errors.message)}
								/>
							</Field>
							<div className="sm:col-span-2">
								<Button type="submit" size="lg" disabled={pending}>
									<Send /> {pending ? "Sending…" : "Request a quote"}
								</Button>
							</div>
						</form>
					)}
				</section>
			</div>
		</>
	);
}
