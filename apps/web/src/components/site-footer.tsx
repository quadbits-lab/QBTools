import { categories } from "@qbtools/registry";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { SITE_NAME } from "#/lib/site";
import { reopenConsent } from "./consent";
import { Logo } from "./logo";
import { ToolTag } from "./tool-flags";

const LEGAL = [
	{ to: "/privacy", label: "Privacy Policy" },
	{ to: "/terms", label: "Terms of Use" },
	{ to: "/disclaimer", label: "Disclaimer" },
	{ to: "/cookies", label: "Cookie Notice" },
] as const;

const COMPANY = [
	{ to: "/about", label: "About" },
	{ to: "/contact", label: "Contact" },
	{ to: "/dashboard", label: "Dashboard" },
] as const;

const LINK = "text-sm text-foreground transition-colors hover:text-muted-foreground";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<h2 className="label-mono mb-4 !text-subtle">{title}</h2>
			<ul className="flex flex-col gap-3">{children}</ul>
		</div>
	);
}

export function SiteFooter() {
	const half = Math.ceil(categories.length / 2);
	const firstCategories = categories.slice(0, half);
	const moreCategories = categories.slice(half);

	return (
		<footer className="mt-24 border-t border-border bg-card">
			<div className="container-page grid gap-12 py-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
				<div className="flex flex-col items-start gap-3">
					<Logo />
					<p className="max-w-xs text-sm text-muted-foreground mt-2">
						Free tools that just work. Compress, convert, calculate and create — right in your
						browser.
					</p>
				</div>
				<FooterColumn title="Tools">
					{firstCategories.map((category) => (
						<li key={category.id}>
							<Link to="/categories/$category" params={{ category: category.id }} className={LINK}>
								{category.name}
							</Link>
						</li>
					))}
				</FooterColumn>
				<FooterColumn title="More tools">
					{moreCategories.map((category) => (
						<li key={category.id}>
							<Link to="/categories/$category" params={{ category: category.id }} className={LINK}>
								{category.name}
							</Link>
						</li>
					))}
					<li>
						<Link to="/tools" className={LINK}>
							All tools
						</Link>
					</li>
				</FooterColumn>
				<FooterColumn title="QBTools">
					{COMPANY.map((item) => (
						<li key={item.label}>
							<Link to={item.to} className={LINK}>
								{item.label}
							</Link>
						</li>
					))}
				</FooterColumn>
				<FooterColumn title="Legal">
					{LEGAL.map((item) => (
						<li key={item.to}>
							<Link to={item.to} className={LINK}>
								{item.label}
							</Link>
						</li>
					))}
					<li>
						<button
							type="button"
							onClick={reopenConsent}
							className={`cursor-pointer text-left ${LINK}`}
						>
							Cookie settings
						</button>
					</li>
				</FooterColumn>
			</div>
			<div className="border-t border-border">
				<div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
					<p>
						© {new Date().getFullYear()} {SITE_NAME}. All tools are free to use | Developed by {` `}
						<a href="https://lab.quadbits.io" target="_blank" rel="noopener noreferrer">
							<strong>Quadbits Lab</strong>
						</a>
					</p>
					<p className="flex items-center gap-1.5">
						<ShieldCheck className="size-3.5 text-success" /> Files processed in your browser
					</p>
				</div>
			</div>
		</footer>
	);
}
