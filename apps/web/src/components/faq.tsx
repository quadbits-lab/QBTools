import type { Faq } from "@qbtools/registry";
import { Plus } from "lucide-react";

/**
 * Nina FAQ accordion: hairline rows, + that turns to ×. Native <details> so
 * answers are in the HTML for search engines and work without JS.
 */
export function FaqList({ faqs }: { faqs: Faq[] }) {
	return (
		<div className="flex flex-col border-t border-border">
			{faqs.map((faq) => (
				<details key={faq.q} className="group border-b border-border">
					<summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg leading-snug [&::-webkit-details-marker]:hidden">
						{faq.q}
						<Plus
							aria-hidden="true"
							strokeWidth={1.5}
							className="size-5 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-45"
						/>
					</summary>
					<p className="max-w-3xl pb-6 text-[0.9375rem] leading-relaxed text-muted-foreground">
						{faq.a}
					</p>
				</details>
			))}
		</div>
	);
}
