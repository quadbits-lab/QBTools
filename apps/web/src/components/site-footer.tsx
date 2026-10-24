import { categories, toolsInCategory } from "@qbtools/registry";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { SITE_NAME } from "#/lib/site";
import { reopenConsent } from "./consent";
import { Logo } from "./logo";

const LEGAL = [
	{ to: "/privacy", label: "Privacy Policy" },
	{ to: "/terms", label: "Terms of Use" },
	{ to: "/disclaimer", label: "Disclaimer" },
	{ to: "/cookies", label: "Cookie Notice" },
] as const;

const COMPANY = [
	{ to: "/about", label: "About" },
	{ to: "/contact", label: "Contact" },
	{ to: "/contact", label: "Suggest a tool", search: { tab: "suggest" } },
	{ to: "/services", label: "Services" },
	{ to: "/premium", label: "Premium" },
	{ to: "/guides", label: "Guides" },
] as const;

export function SiteFooter() {
	return (
		<footer className="mt-24 border-t border-border bg-surface">
			<div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_3fr]">
				<div className="flex flex-col gap-4">
					<Logo />
					<p className="max-w-xs text-muted-foreground">
						Free tools that just work. No signup, no clutter — and your files stay on your device.
					</p>
					<p className="flex items-center gap-2 text-sm font-semibold text-positive">
						<ShieldCheck className="size-5" /> Files processed in your browser
					</p>
				</div>
				<div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
					{categories.map((category) => (
						<div key={category.id}>
							<h2 className="mb-3 font-bold">
								<Link
									to="/categories/$category"
									params={{ category: category.id }}
									className="hover:text-primary"
								>
									{category.name}
								</Link>
							</h2>
							<ul className="flex flex-col gap-2">
								{toolsInCategory(category.id).map((tool) => (
									<li key={tool.slug}>
										<Link
											to="/tools/$slug"
											params={{ slug: tool.slug }}
											className="text-muted-foreground hover:text-foreground"
										>
											{tool.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
					<div>
						<h2 className="mb-3 font-bold">QBTools</h2>
						<ul className="flex flex-col gap-2">
							{COMPANY.map((item) => (
								<li key={item.label}>
									<Link
										to={item.to}
										search={"search" in item ? item.search : undefined}
										className="text-muted-foreground hover:text-foreground"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
					<div>
						<h2 className="mb-3 font-bold">Legal</h2>
						<ul className="flex flex-col gap-2">
							{LEGAL.map((item) => (
								<li key={item.to}>
									<Link to={item.to} className="text-muted-foreground hover:text-foreground">
										{item.label}
									</Link>
								</li>
							))}
							<li>
								<button
									type="button"
									onClick={reopenConsent}
									className="cursor-pointer text-left text-muted-foreground hover:text-foreground"
								>
									Cookie settings
								</button>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<div className="border-t border-border">
				<div className="container-page flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
					<p>
						© {new Date().getFullYear()} {SITE_NAME}. All tools are free to use.
					</p>
					<p>Made for students, parents, freelancers and everyone in between.</p>
				</div>
			</div>
		</footer>
	);
}
