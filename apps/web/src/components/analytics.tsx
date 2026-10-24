/**
 * Optional privacy-friendly, cookieless analytics (Plausible or Umami).
 * Set VITE_ANALYTICS_SRC plus VITE_ANALYTICS_DOMAIN (Plausible) or
 * VITE_ANALYTICS_WEBSITE_ID (Umami). Nothing loads when unset.
 */
export function analyticsScripts() {
	const src = import.meta.env.VITE_ANALYTICS_SRC;
	if (!src) return [];
	const domain = import.meta.env.VITE_ANALYTICS_DOMAIN;
	const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
	return [
		{
			src,
			defer: true,
			...(domain ? { "data-domain": domain } : {}),
			...(websiteId ? { "data-website-id": websiteId } : {}),
		},
	];
}
