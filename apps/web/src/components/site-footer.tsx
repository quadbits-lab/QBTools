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
] as const;

export function SiteFooter() {
	return (
		<footer className="mt-32 border-t border-border">
			<div className="container-page grid gap-12 py-16 md:grid-cols-[1.2fr_3fr]">
				<div className="flex flex-col gap-4">
					<Logo />
					<p className="max-w-xs text-muted-foreground">
						Free tools that just work. No signup, no clutter — with local processing and optional
						private storage.
					</p>
					<p className="label-mono flex items-center gap-2 text-foreground">
						<ShieldCheck className="size-4" strokeWidth={1.5} /> Files processed in your browser
					</p>
				</div>
				<div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
					{categories.map((category) => (
						<div key={category.id}>
							<h2 className="label-mono mb-4">
								<Link
									to="/categories/$category"
									params={{ category: category.id }}
									className="hover:text-foreground"
								>
									{category.name}
								</Link>
							</h2>
							<ul className="flex flex-col gap-2.5 text-[0.9375rem]">
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
						<h2 className="label-mono mb-4">QBTools</h2>
						<ul className="flex flex-col gap-2.5 text-[0.9375rem]">
							{COMPANY.map((item) => (
								<li key={item.label}>
									<Link to={item.to} className="text-muted-foreground hover:text-foreground">
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
					<div>
						<h2 className="label-mono mb-4">Legal</h2>
						<ul className="flex flex-col gap-2.5 text-[0.9375rem]">
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
