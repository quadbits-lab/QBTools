import { categories } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useCommandPalette } from "./command-palette";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
	{ to: "/tools", label: "All tools" },
	{ to: "/guides", label: "Guides" },
	{ to: "/services", label: "Services" },
	{ to: "/premium", label: "Premium" },
] as const;

export function SiteHeader() {
	const { open } = useCommandPalette();
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className="sticky top-0 z-30 border-b border-border bg-veil backdrop-blur-md">
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-surface focus:p-3"
			>
				Skip to content
			</a>
			<div className="container-page flex h-16 items-center gap-6">
				<Logo />
				<nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
					{NAV.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className="text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground"
							activeProps={{ className: "!text-foreground" }}
						>
							{item.label}
						</Link>
					))}
				</nav>
				<div className="ml-auto flex items-center gap-2">
					<button
						type="button"
						onClick={open}
						className="hidden h-10 w-56 cursor-pointer items-center gap-2.5 border border-input px-3 text-muted-foreground transition-colors hover:border-foreground md:flex"
					>
						<Search className="size-4" strokeWidth={1.5} />
						<span className="text-sm">Search tools</span>
						<kbd className="ml-auto font-mono text-[0.6875rem] text-subtle">⌘K</kbd>
					</button>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={open}
						aria-label="Search tools"
						className="md:hidden"
					>
						<Search strokeWidth={1.5} />
					</Button>
					<ThemeToggle />
					<Button asChild size="sm" arrow className="hidden xl:inline-flex">
						<Link to="/contact" search={{ tab: "suggest" }}>
							Suggest a tool
						</Link>
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						className="lg:hidden"
						aria-label={menuOpen ? "Close menu" : "Open menu"}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((v) => !v)}
					>
						{menuOpen ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
					</Button>
				</div>
			</div>
			<div
				className={cn(
					"border-t border-border bg-background lg:hidden",
					menuOpen ? "block" : "hidden",
				)}
			>
				<nav aria-label="Mobile" className="container-page flex flex-col py-4">
					{NAV.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							onClick={() => setMenuOpen(false)}
							className="border-b border-border py-3.5 text-lg"
						>
							{item.label}
						</Link>
					))}
					<p className="label-mono mt-6 mb-2">Categories</p>
					<div className="grid grid-cols-2">
						{categories.map((category) => (
							<Link
								key={category.id}
								to="/categories/$category"
								params={{ category: category.id }}
								onClick={() => setMenuOpen(false)}
								className="py-2.5 text-muted-foreground hover:text-foreground"
							>
								{category.name}
							</Link>
						))}
					</div>
				</nav>
			</div>
		</header>
	);
}
