import { toast } from "@qbtools/ui/toaster";
import { useState } from "react";
import type { z } from "zod";
import { fieldErrors } from "#/lib/form-schemas";

type Result = { ok: true; message: string } | { ok: false; error: string };

/**
 * Validates FormData against a zod schema in the browser (instant feedback),
 * then calls the server function, which validates again.
 */
export function useFormSubmit<S extends z.ZodType>(
	schema: S,
	action: (input: { data: z.input<S> }) => Promise<Result>,
) {
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [pending, setPending] = useState(false);
	const [done, setDone] = useState<string | null>(null);

	const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		const raw = Object.fromEntries(new FormData(form).entries());
		const parsed = schema.safeParse(raw);
		if (!parsed.success) {
			setErrors(fieldErrors(parsed.error));
			return;
		}
		setErrors({});
		setPending(true);
		try {
			const result = await action({ data: raw as z.input<S> });
			if (result.ok) {
				setDone(result.message);
				form.reset();
				toast.success(result.message);
			} else {
				toast.error(result.error);
			}
		} catch {
			toast.error("Something went wrong. Please check your connection and try again.");
		} finally {
			setPending(false);
		}
	};

	return { errors, pending, done, onSubmit, reset: () => setDone(null) };
}

/** Hidden field bots love to fill. */
export const HONEYPOT_PROPS = {
	name: "website",
	type: "text",
	tabIndex: -1,
	autoComplete: "off",
	"aria-hidden": true,
	className: "absolute -left-[9999px] h-0 w-0 opacity-0",
} as const;
