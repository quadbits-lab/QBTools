import { categories } from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { cn } from "@qbtools/ui/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { categoryStyles, iconFor } from "#/lib/icons";
import { useCommandPalette } from "./command-palette";
import { GitHubRepoBadge } from "./github-repo-badge";
import { Logo } from "./logo";
import { PwaInstallButton } from "./pwa-install-button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function SiteHeader() {
	const { open } = useCommandPalette();
	const [menuOpen, setMenuOpen] = useState(false);
	const [catOpen, setCatOpen] = useState(false);
	const catRef = useRef<HTMLDivElement>(null);

	const pathname = useRouterState({ select: (s) => s.location.pathname });
	useEffect(() => {
		if (pathname) {
			setMenuOpen(false);
			setCatOpen(false);
		}
	}, [pathname]);

	useEffect(() => {
		if (!catOpen) return;
		function handleClickOutside(e: MouseEvent) {
			if (catRef.current && !catRef.current.contains(e.target as Node)) {
				setCatOpen(false);
			}
		}
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") setCatOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [catOpen]);

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 shadow-2xs backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-200 supports-[backdrop-filter]:bg-background/60">
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:p-3 focus:text-sm focus:font-medium focus:shadow-md"
			>
				Skip to content
			</a>

			<div className="container-page flex h-16 items-center justify-between gap-2 sm:gap-6">
				{/* Brand Logo & Desktop Nav */}
				<div className="flex items-center gap-3 md:gap-6 lg:gap-8">
					<Logo className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] [&_img]:h-[24px] [&_img]:md:h-[22px] max-sm:[&_img]:h-[clamp(15px,5vw,20px)] max-sm:[&_img]:max-w-[116px] max-sm:[&_img]:object-contain" />

					<nav aria-label="Main" className="hidden items-center gap-1.5 lg:flex">
						<Link
							to="/tools"
							className="rounded-md px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-muted/70 hover:text-foreground active:scale-95"
							activeProps={{ className: "!text-foreground !bg-muted/80 shadow-2xs font-semibold" }}
						>
							All tools
						</Link>

						{/* Categories Dropdown Popover */}
						<div ref={catRef} className="relative">
							<button
								type="button"
								onClick={() => setCatOpen((v) => !v)}
								aria-expanded={catOpen}
								aria-haspopup="true"
								className={cn(
									"flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-[background-color,color,scale] duration-150 hover:bg-muted/70 hover:text-foreground active:scale-95",
									catOpen
										? "bg-muted/80 font-semibold text-foreground shadow-2xs"
										: "text-muted-foreground",
								)}
							>
								<span>Categories</span>
								<ChevronDown
									className={cn(
										"size-3.5 text-muted-foreground transition-transform duration-200",
										catOpen && "rotate-180",
									)}
								/>
							</button>

							{catOpen && (
								<div className="absolute top-full left-0 z-50 mt-2.5 w-[560px] rounded-2xl border border-border/80 bg-popover/95 p-3 text-popover-foreground shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95">
									<div className="grid grid-cols-2 gap-1.5 p-1">
										{categories.map((cat) => {
											const CatIcon = iconFor(cat.icon);
											return (
												<Link
													key={cat.id}
													to="/categories/$category"
													params={{ category: cat.id }}
													onClick={() => setCatOpen(false)}
													className="group flex items-start gap-3 rounded-xl p-2.5 transition-all duration-150 hover:bg-muted/70 active:scale-[0.98]"
												>
													<div
														className={cn(
															"mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border",
															categoryStyles[cat.id]?.tile,
														)}
													>
														<CatIcon className="size-4" />
													</div>
													<div className="flex min-w-0 flex-col">
														<span className="text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
															{cat.name}
														</span>
														<span className="line-clamp-1 text-[11px] text-muted-foreground">
															{cat.tagline}
														</span>
													</div>
												</Link>
											);
										})}
									</div>

									<div className="mt-2 flex items-center justify-between rounded-b-xl border-t border-border/50 bg-muted/20 px-3.5 py-2.5">
										<Link
											to="/tools"
											onClick={() => setCatOpen(false)}
											className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
										>
											<span>Browse all tools</span>
											<ArrowRight className="size-3" />
										</Link>
										<Link
											to="/"
											hash="categories"
											onClick={() => setCatOpen(false)}
											className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
										>
											<span>View categories section</span>
											<ArrowRight className="size-3" />
										</Link>
									</div>
								</div>
							)}
						</div>

						<Link
							to="/privacy"
							className="rounded-md px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-muted/70 hover:text-foreground active:scale-95"
							activeProps={{ className: "!text-foreground !bg-muted/80 shadow-2xs font-semibold" }}
						>
							Privacy
						</Link>
					</nav>
				</div>

				{/* Right Side Actions */}
				<div className="flex items-center gap-1.5 sm:gap-2">
					{/* Glass field: translucent tint over the blurred header, distinct from the action buttons. */}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={open}
						className="group hidden w-44 justify-start gap-2.5 border-[color:var(--search-field-border)] bg-[color:var(--search-field-bg)] px-3 text-xs font-normal text-muted-foreground backdrop-blur-[4px] hover:border-[color:var(--search-field-border-hover)] hover:bg-[color:var(--search-field-bg-hover)] hover:text-foreground md:flex lg:w-52 xl:w-56"
					>
						<Search className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
						<span className="truncate">Search tools…</span>
						<kbd className="ml-auto inline-flex h-5 select-none items-center rounded border border-border/70 bg-background/90 px-1.5 font-mono text-[10px] font-medium text-subtle shadow-2xs transition-colors group-hover:border-border">
							⌘K
						</kbd>
					</Button>

					<Button
						variant="outline"
						size="icon-sm"
						onClick={open}
						aria-label="Search tools"
						className="md:hidden"
					>
						<Search className="size-4" />
					</Button>

					<GitHubRepoBadge collapseLabel className="hidden sm:inline-flex" />

					<ThemeToggle />

					{/* <PwaInstallButton /> */}

					<UserMenu />

					<Button
						variant="outline"
						size="icon-sm"
						className="lg:hidden"
						aria-label={menuOpen ? "Close menu" : "Open menu"}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((v) => !v)}
					>
						{menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
					</Button>
				</div>
			</div>

			{/* Mobile Navigation Drawer */}
			{menuOpen && (
				<div className="border-t border-border/60 bg-background/95 shadow-xl backdrop-blur-2xl duration-200 animate-in fade-in-0 slide-in-from-top-2 lg:hidden">
					<div className="container-page flex flex-col gap-4 py-4">
						{/* Quick Search */}
						<button
							type="button"
							onClick={() => {
								setMenuOpen(false);
								open();
							}}
							className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-md border border-[color:var(--search-field-border)] bg-[color:var(--search-field-bg)] px-3.5 text-sm text-muted-foreground backdrop-blur-[4px] control-raise transition-colors hover:border-[color:var(--search-field-border-hover)] hover:bg-[color:var(--search-field-bg-hover)] hover:text-foreground"
						>
							<Search className="size-4 text-muted-foreground" />
							<span>Search tools…</span>
							<kbd className="ml-auto rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[10px] text-subtle">
								⌘K
							</kbd>
						</button>

						{/* Primary Nav Links */}
						<div className="flex flex-col gap-1">
							<Link
								to="/tools"
								onClick={() => setMenuOpen(false)}
								className="flex items-center justify-between rounded-md px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
							>
								<span>All tools</span>
								<ArrowRight className="size-4 text-muted-foreground" />
							</Link>
							<Link
								to="/privacy"
								onClick={() => setMenuOpen(false)}
								className="flex items-center justify-between rounded-md px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
							>
								<span>Privacy</span>
								<ArrowRight className="size-4 text-muted-foreground" />
							</Link>
						</div>

						<GitHubRepoBadge className="self-start" onClick={() => setMenuOpen(false)} />

						{/* Categories Grid */}
						<div className="border-t border-border/50 pt-3">
							<div className="mb-2 flex items-center justify-between px-1">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Categories
								</p>
								<Link
									to="/"
									hash="categories"
									onClick={() => setMenuOpen(false)}
									className="text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									View on homepage
								</Link>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{categories.map((cat) => {
									const CatIcon = iconFor(cat.icon);
									return (
										<Link
											key={cat.id}
											to="/categories/$category"
											params={{ category: cat.id }}
											onClick={() => setMenuOpen(false)}
											className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/60 p-2.5 transition-colors hover:bg-muted/60"
										>
											<div
												className={cn(
													"flex size-7 shrink-0 items-center justify-center rounded-lg border",
													categoryStyles[cat.id]?.tile,
												)}
											>
												<CatIcon className="size-3.5" />
											</div>
											<span className="truncate text-xs font-medium text-foreground">
												{cat.name}
											</span>
										</Link>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}
		</header>
	);
}
