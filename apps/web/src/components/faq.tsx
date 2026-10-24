import type { Faq } from "@qbtools/registry";
import { ChevronDown } from "lucide-react";

/** Native <details>: answers are in the HTML for search engines and work without JS. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
	return (
		<div className="flex flex-col gap-3">
			{faqs.map((faq) => (
				<details
					key={faq.q}
					className="group rounded-2xl border border-border bg-surface open:border-primary/40"
				>
					<summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[1.05rem] font-semibold [&::-webkit-details-marker]:hidden">
						{faq.q}
						<ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
					</summary>
					<p className="px-5 pb-5 leading-relaxed text-muted-foreground">{faq.a}</p>
				</details>
			))}
		</div>
	);
}
