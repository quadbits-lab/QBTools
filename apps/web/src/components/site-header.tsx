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
		<header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-lg focus:bg-surface focus:p-3"
			>
				Skip to content
			</a>
			<div className="container-page flex h-16 items-center gap-3">
				<Logo />
				<nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
					{NAV.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className="rounded-lg px-3 py-2 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
							activeProps={{ className: "!text-foreground bg-muted" }}
						>
							{item.label}
						</Link>
					))}
				</nav>
				<div className="ml-auto flex items-center gap-1">
					<button
						type="button"
						onClick={open}
						className="hidden h-11 w-64 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 text-muted-foreground hover:border-input md:flex"
					>
						<Search className="size-4" />
						<span className="text-sm">Search tools…</span>
						<kbd className="ml-auto rounded-md border border-border bg-muted px-1.5 font-mono text-xs">
							⌘K
						</kbd>
					</button>
					<Button
						variant="ghost"
						size="icon"
						onClick={open}
						aria-label="Search tools"
						className="md:hidden"
					>
						<Search />
					</Button>
					<ThemeToggle />
					<Button
						variant="ghost"
						size="icon"
						className="lg:hidden"
						aria-label={menuOpen ? "Close menu" : "Open menu"}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((v) => !v)}
					>
						{menuOpen ? <X /> : <Menu />}
					</Button>
				</div>
			</div>
			<div
				className={cn(
					"border-t border-border bg-background lg:hidden",
					menuOpen ? "block" : "hidden",
				)}
			>
				<nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-3">
					{NAV.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							onClick={() => setMenuOpen(false)}
							className="rounded-xl px-3 py-3 text-lg font-semibold hover:bg-muted"
						>
							{item.label}
						</Link>
					))}
					<div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
						{categories.map((category) => (
							<Link
								key={category.id}
								to="/categories/$category"
								params={{ category: category.id }}
								onClick={() => setMenuOpen(false)}
								className="rounded-xl px-3 py-2.5 font-medium text-muted-foreground hover:bg-muted"
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
