import { categories, getTool, tools } from "@qbtools/registry";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@qbtools/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@qbtools/ui/dialog";
import { setThemeMode } from "@qbtools/ui/theme";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock, Monitor, Moon, Sun } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { categoryTone, iconFor } from "#/lib/icons";
import { recentTools } from "#/lib/local-store";
import { searchIndex } from "#/lib/search";

const PaletteContext = createContext<{ open: () => void }>({ open: () => {} });
export const useCommandPalette = () => useContext(PaletteContext);

const isTypingTarget = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	(target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const navigate = useNavigate();
	const recent = recentTools.use();

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((v) => !v);
			} else if (event.key === "/" && !isTypingTarget(event.target)) {
				event.preventDefault();
				setOpen(true);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const results = useMemo(() => searchIndex.search(query, 12), [query]);
	const go = useCallback(
		(href: string) => {
			setOpen(false);
			setQuery("");
			void navigate({ href });
		},
		[navigate],
	);

	const recentDefs = recent.map(getTool).filter((t) => t !== undefined);

	return (
		<PaletteContext.Provider value={{ open: () => setOpen(true) }}>
			{children}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="overflow-hidden p-0" aria-describedby="palette-desc">
					<DialogTitle className="sr-only">Search tools</DialogTitle>
					<DialogDescription id="palette-desc" className="sr-only">
						Type to find a tool, then press Enter to open it.
					</DialogDescription>
					<Command shouldFilter={false} label="Search tools">
						<CommandInput
							value={query}
							onValueChange={setQuery}
							placeholder="What do you want to do?"
						/>
						<CommandList>
							<CommandEmpty>No tools found. Try “compress” or “pdf”.</CommandEmpty>
							{query.trim() === "" ? (
								<>
									{recentDefs.length > 0 && (
										<CommandGroup heading="Recent">
											{recentDefs.slice(0, 5).map((tool) => (
												<CommandItem
													key={tool.slug}
													value={`recent-${tool.slug}`}
													onSelect={() => go(`/tools/${tool.slug}`)}
												>
													<Clock className="size-5 text-muted-foreground" />
													{tool.name}
												</CommandItem>
											))}
										</CommandGroup>
									)}
									<CommandGroup heading="Categories">
										{categories.map((category) => {
											const Icon = iconFor(category.icon);
											return (
												<CommandItem
													key={category.id}
													value={category.id}
													onSelect={() => go(`/categories/${category.id}`)}
												>
													<span
														className={`grid size-8 place-items-center ${categoryTone[category.id]}`}
													>
														<Icon className="size-4" />
													</span>
													{category.name}
													<span className="ml-auto text-sm text-muted-foreground">
														{tools.filter((t) => t.category === category.id).length} tools
													</span>
												</CommandItem>
											);
										})}
									</CommandGroup>
									<CommandGroup heading="Theme">
										<CommandItem value="theme-light" onSelect={() => setThemeMode("light")}>
											<Sun className="size-5" /> Light mode
										</CommandItem>
										<CommandItem value="theme-dark" onSelect={() => setThemeMode("dark")}>
											<Moon className="size-5" /> Dark mode
										</CommandItem>
										<CommandItem value="theme-system" onSelect={() => setThemeMode("system")}>
											<Monitor className="size-5" /> Match my device
										</CommandItem>
									</CommandGroup>
								</>
							) : (
								<CommandGroup heading="Tools">
									{results.map((result) => {
										const Icon = iconFor(result.tool.icon);
										return (
											<CommandItem
												key={result.href}
												value={result.href}
												onSelect={() => go(result.href)}
											>
												<span
													className={`grid size-8 place-items-center ${categoryTone[result.tool.category]}`}
												>
													<Icon className="size-4" />
												</span>
												<span className="flex min-w-0 flex-col">
													<span className="truncate font-medium">{result.title}</span>
													<span className="truncate text-sm text-muted-foreground">
														{result.subtitle}
													</span>
												</span>
												<ArrowRight className="ml-auto size-4 text-muted-foreground" />
											</CommandItem>
										);
									})}
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</DialogContent>
			</Dialog>
		</PaletteContext.Provider>
	);
}
