import { absoluteUrl, SITE_NAME } from "./site";

type JsonLd = Record<string, unknown>;

export interface SeoInput {
	title: string;
	description: string;
	path: string;
	/** Already-suffixed titles skip " | QBTools". */
	rawTitle?: boolean;
	noindex?: boolean;
	jsonLd?: JsonLd[];
	ogType?: "website" | "article";
}

/** Route head() payload: title, meta, canonical, OG/Twitter and JSON-LD. */
export function seo({ title, description, path, rawTitle, noindex, jsonLd = [], ogType = "website" }: SeoInput) {
	const fullTitle = rawTitle ? title : `${title} | ${SITE_NAME}`;
	const url = absoluteUrl(path);
	const image = absoluteUrl("/og-default.png");
	return {
		meta: [
			{ title: fullTitle },
			{ name: "description", content: description },
			...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
			{ property: "og:type", content: ogType },
			{ property: "og:site_name", content: SITE_NAME },
			{ property: "og:title", content: fullTitle },
			{ property: "og:description", content: description },
			{ property: "og:url", content: url },
			{ property: "og:image", content: image },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: fullTitle },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: image },
		],
		links: [{ rel: "canonical", href: url }],
		scripts: jsonLd.map((data) => ({
			type: "application/ld+json",
			children: JSON.stringify(data).replace(/</g, "\\u003c"),
		})),
	};
}

export function breadcrumbLd(items: { name: string; path: string }[]): JsonLd {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.path),
		})),
	};
}

export function faqLd(faqs: { q: string; a: string }[]): JsonLd {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.q,
			acceptedAnswer: { "@type": "Answer", text: faq.a },
		})),
	};
}

export function webAppLd(input: { name: string; description: string; path: string; category: string }): JsonLd {
	return {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: input.name,
		description: input.description,
		url: absoluteUrl(input.path),
		applicationCategory: input.category,
		operatingSystem: "Any (web browser)",
		isAccessibleForFree: true,
		offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
		provider: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
	};
}
