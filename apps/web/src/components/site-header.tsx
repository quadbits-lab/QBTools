import { categories } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useCommandPalette } from "./command-palette";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const NAV = [
	{ to: "/tools", label: "All tools" },
	{ to: "/", hash: "categories", label: "Categories" },
	{ to: "/privacy", label: "Privacy" },
	{ to: "/dashboard", label: "Dashboard" },
] as const;

export function SiteHeader() {
	const { open } = useCommandPalette();
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className="sticky top-0 z-30 border-b border-border bg-veil backdrop-blur-md">
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-card focus:p-3"
			>
				Skip to content
			</a>
			<div className="container-page flex h-16 items-center gap-2 sm:gap-6">
				<Logo className="max-sm:[&_img]:h-5 max-sm:[&_img]:max-w-28 max-sm:[&_img]:object-contain" />
				<nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
					{NAV.map((item) => (
						<Link
							key={item.label}
							to={item.to}
							hash={"hash" in item ? item.hash : undefined}
							className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
							activeProps={{ className: "!text-foreground" }}
							activeOptions={{ exact: item.to === "/" }}
						>
							{item.label}
						</Link>
					))}
				</nav>
				<div className="ml-auto flex items-center gap-2">
					<button
						type="button"
						onClick={open}
						className="hidden h-10 w-60 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-muted-foreground transition-colors hover:bg-accent md:flex"
					>
						<Search className="size-4" />
						<span className="text-sm">Search tools…</span>
						<kbd className="ml-auto rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-subtle">
							⌘K
						</kbd>
					</button>
					<Button
						variant="outline"
						size="icon-sm"
						onClick={open}
						aria-label="Search tools"
						className="md:hidden"
					>
						<Search />
					</Button>
					<ThemeToggle />
					<UserMenu />
					<Button
						variant="outline"
						size="icon-sm"
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
				<nav aria-label="Mobile" className="container-page flex flex-col py-4">
					{NAV.map((item) => (
						<Link
							key={item.label}
							to={item.to}
							hash={"hash" in item ? item.hash : undefined}
							onClick={() => setMenuOpen(false)}
							className="border-b border-border py-3.5 text-base font-medium"
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
								className="py-2.5 text-sm text-muted-foreground hover:text-foreground"
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
