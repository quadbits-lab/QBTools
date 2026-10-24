import { cn } from "@qbtools/ui/utils";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { categoryTone, iconFor } from "#/lib/icons";
import { searchIndex } from "#/lib/search";

/**
 * Big hero search with instant suggestions (ARIA combobox).
 * Enter opens the highlighted tool, or /tools?q= when nothing is highlighted.
 */
export function SearchBox({ size = "lg", autoFocus = false, className }: { size?: "lg" | "md"; autoFocus?: boolean; className?: string }) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(-1);
	const navigate = useNavigate();
	const listId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const results = useMemo(() => searchIndex.search(query, 6), [query]);

	const go = (href: string) => {
		setOpen(false);
		setQuery("");
		inputRef.current?.blur();
		void navigate({ href });
	};

	const submit = () => {
		const pick = results[active] ?? (results.length === 1 ? results[0] : undefined);
		if (pick) go(pick.href);
		else if (query.trim()) void navigate({ to: "/tools", search: { q: query.trim() } });
	};

	const showList = open && query.trim().length > 0;

	return (
		<div className={cn("relative w-full", className)}>
			<form
				role="search"
				onSubmit={(event) => {
					event.preventDefault();
					submit();
				}}
			>
				<label htmlFor={`${listId}-input`} className="sr-only">
					Search tools
				</label>
				<Search className={cn("pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-muted-foreground", size === "lg" ? "size-6" : "size-5")} />
				<input
					ref={inputRef}
					id={`${listId}-input`}
					type="search"
					role="combobox"
					aria-expanded={showList}
					aria-controls={listId}
					aria-autocomplete="list"
					aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
					autoComplete="off"
					// biome-ignore lint/a11y/noAutofocus: opt-in on the 404 page only
					autoFocus={autoFocus}
					value={query}
					placeholder="Try “compress image to 100kb” or “merge pdf”"
					onChange={(event) => {
						setQuery(event.target.value);
						setActive(-1);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => setTimeout(() => setOpen(false), 120)}
					onKeyDown={(event) => {
						if (event.key === "ArrowDown") {
							event.preventDefault();
							setActive((i) => Math.min(i + 1, results.length - 1));
						} else if (event.key === "ArrowUp") {
							event.preventDefault();
							setActive((i) => Math.max(i - 1, -1));
						} else if (event.key === "Escape") {
							setOpen(false);
						}
					}}
					className={cn(
						"w-full rounded-2xl border-2 border-border bg-surface pr-32 pl-14 shadow-sm outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary",
						size === "lg" ? "h-16 text-lg sm:h-[4.5rem] sm:text-xl" : "h-14 text-base",
					)}
				/>
				<button
					type="submit"
					className={cn(
						"absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90",
						size === "lg" ? "h-12 sm:h-14 sm:px-6 sm:text-lg" : "h-10",
					)}
				>
					Search
				</button>
			</form>
			{showList && (
				<ul
					id={listId}
					role="listbox"
					className="absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-2xl border border-border bg-surface p-2 text-left shadow-xl"
				>
					{results.length === 0 ? (
						<li className="px-4 py-3 text-muted-foreground">No matching tools — press Enter to search all tools.</li>
					) : (
						results.map((result, index) => {
							const Icon = iconFor(result.tool.icon);
							return (
								<li
									key={result.href}
									id={`${listId}-${index}`}
									role="option"
									aria-selected={index === active}
									onMouseDown={(event) => {
										event.preventDefault();
										go(result.href);
									}}
									onMouseEnter={() => setActive(index)}
									className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-3", index === active && "bg-muted")}
								>
									<span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", categoryTone[result.tool.category])}>
										<Icon className="size-5" />
									</span>
									<span className="flex min-w-0 flex-col">
										<span className="truncate font-semibold">{result.title}</span>
										<span className="truncate text-sm text-muted-foreground">{result.subtitle}</span>
									</span>
								</li>
							);
						})
					)}
				</ul>
			)}
		</div>
	);
}
