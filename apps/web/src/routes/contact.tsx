import { categories } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { Input, Select, Textarea } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qbtools/ui/tabs";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Lightbulb, Mail } from "lucide-react";
import { z } from "zod";
import { HONEYPOT_PROPS, useFormSubmit } from "#/components/kit/use-form-submit";
import { PageHero } from "#/components/page";
import { contactSchema, suggestionSchema } from "#/lib/form-schemas";
import { seo } from "#/lib/seo";
import { CONTACT_EMAIL } from "#/lib/site";
import { submitContact, submitSuggestion } from "#/server/forms.functions";

export const Route = createFileRoute("/contact")({
	validateSearch: z.object({ tab: z.enum(["contact", "suggest"]).optional().catch(undefined) }),
	head: () =>
		seo({
			title: "Contact Us & Suggest a Tool",
			description:
				"Questions, feedback or an idea for a new free tool? Send us a message or suggest a tool — we read everything.",
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
			<p className="max-w-md text-lg font-semibold">{message}</p>
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

function SuggestForm() {
	const { errors, pending, done, onSubmit, reset } = useFormSubmit(
		suggestionSchema,
		useServerFn(submitSuggestion),
	);
	if (done) return <Success message={done} onAgain={reset} again="Suggest another tool" />;
	return (
		<form onSubmit={onSubmit} noValidate className="relative grid gap-5 sm:grid-cols-2">
			<input {...HONEYPOT_PROPS} />
			<Field
				label="What tool should we build?"
				htmlFor="s-title"
				error={errors.title}
				hint="For example: “JSON formatter” or “Unit converter”"
				className="sm:col-span-2"
			>
				<Input id="s-title" name="title" required aria-invalid={Boolean(errors.title)} />
			</Field>
			<Field label="Category (optional)" htmlFor="s-category">
				<Select id="s-category" name="category" defaultValue="">
					<option value="">Not sure</option>
					{categories.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name}
						</option>
					))}
					<option value="developer">Developer tools</option>
					<option value="other">Something else</option>
				</Select>
			</Field>
			<Field
				label="Email (optional)"
				htmlFor="s-email"
				error={errors.email}
				hint="We'll tell you when it's ready."
			>
				<Input
					id="s-email"
					name="email"
					type="email"
					autoComplete="email"
					aria-invalid={Boolean(errors.email)}
				/>
			</Field>
			<Field label="How would you use it? (optional)" htmlFor="s-details" className="sm:col-span-2">
				<Textarea id="s-details" name="details" rows={4} />
			</Field>
			<div className="sm:col-span-2">
				<Button type="submit" size="lg" disabled={pending}>
					<Lightbulb /> {pending ? "Sending…" : "Suggest this tool"}
				</Button>
			</div>
		</form>
	);
}

function ContactPage() {
	const { tab = "contact" } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	return (
		<>
			<PageHero
				eyebrow="We read every message"
				title="Contact us & suggest a tool"
				description={
					<p>
						Found a bug, have a question, or want a new tool? Use the form below or email{" "}
						<a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary underline">
							{CONTACT_EMAIL}
						</a>
						.
					</p>
				}
			/>
			<div className="container-page py-10">
				<Tabs
					value={tab}
					onValueChange={(value) =>
						navigate({ search: { tab: value as "contact" | "suggest" }, replace: true })
					}
				>
					<TabsList>
						<TabsTrigger value="contact">Send a message</TabsTrigger>
						<TabsTrigger value="suggest">Suggest a tool</TabsTrigger>
					</TabsList>
					<div className="mt-6 max-w-3xl rounded-3xl border border-border bg-surface p-5 sm:p-8">
						<TabsContent value="contact" className="mt-0">
							<ContactForm />
						</TabsContent>
						<TabsContent value="suggest" className="mt-0">
							<SuggestForm />
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</>
	);
}
