import { Button } from "@qbtools/ui/button";
import { Input, Textarea } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Mail } from "lucide-react";
import { z } from "zod";
import { HONEYPOT_PROPS, useFormSubmit } from "#/components/kit/use-form-submit";
import { PageHero } from "#/components/page";
import { contactSchema } from "#/lib/form-schemas";
import { seo } from "#/lib/seo";
import { CONTACT_EMAIL } from "#/lib/site";
import { submitContact } from "#/server/forms.functions";

export const Route = createFileRoute("/contact")({
	validateSearch: z.object({}),
	head: () =>
		seo({
			title: "Contact Us",
			description: "Questions or feedback? Send us a message — we read everything.",
			path: "/contact",
		}),
	component: ContactPage,
});

function Success({
	message,
	onAgain,
	again,
}: {
	message: string;
	onAgain: () => void;
	again: string;
}) {
	return (
		<div className="flex flex-col items-center gap-4 py-10 text-center">
			<CheckCircle2 className="size-14 text-positive" />
			<p className="max-w-md text-lg font-medium">{message}</p>
			<Button variant="secondary" onClick={onAgain}>
				{again}
			</Button>
		</div>
	);
}

function ContactForm() {
	const { errors, pending, done, onSubmit, reset } = useFormSubmit(
		contactSchema,
		useServerFn(submitContact),
	);
	if (done) return <Success message={done} onAgain={reset} again="Send another message" />;
	return (
		<form onSubmit={onSubmit} noValidate className="relative grid gap-5 sm:grid-cols-2">
			<input {...HONEYPOT_PROPS} />
			<Field label="Your name" htmlFor="c-name" error={errors.name}>
				<Input
					id="c-name"
					name="name"
					autoComplete="name"
					required
					aria-invalid={Boolean(errors.name)}
				/>
			</Field>
			<Field label="Email" htmlFor="c-email" error={errors.email}>
				<Input
					id="c-email"
					name="email"
					type="email"
					autoComplete="email"
					required
					aria-invalid={Boolean(errors.email)}
				/>
			</Field>
			<Field label="Subject" htmlFor="c-subject" error={errors.subject} className="sm:col-span-2">
				<Input id="c-subject" name="subject" required aria-invalid={Boolean(errors.subject)} />
			</Field>
			<Field label="Message" htmlFor="c-message" error={errors.message} className="sm:col-span-2">
				<Textarea
					id="c-message"
					name="message"
					rows={6}
					required
					aria-invalid={Boolean(errors.message)}
				/>
			</Field>
			<div className="sm:col-span-2">
				<Button type="submit" size="lg" disabled={pending}>
					<Mail /> {pending ? "Sending…" : "Send message"}
				</Button>
			</div>
		</form>
	);
}

function ContactPage() {
	return (
		<>
			<PageHero
				eyebrow="We read every message"
				title="Contact us"
				description={
					<p>
						Found a bug or have a question? Send a message or email{" "}
						<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
					</p>
				}
			/>
			<div className="container-page py-10">
				<div className="max-w-3xl border border-border bg-surface p-5 sm:p-8">
					<ContactForm />
				</div>
			</div>
		</>
	);
}
