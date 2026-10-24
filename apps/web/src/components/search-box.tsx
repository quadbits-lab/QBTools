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
export function SearchBox({
	size = "lg",
	autoFocus = false,
	className,
}: {
	size?: "lg" | "md";
	autoFocus?: boolean;
	className?: string;
}) {
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
				<Search
					className={cn(
						"pointer-events-none absolute top-1/2 left-4.5 -translate-y-1/2 text-subtle",
						size === "lg" ? "size-6" : "size-5",
					)}
				/>
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
					placeholder="What do you want to do? (e.g. compress, merge, pdf, qr...)"
					onChange={(event) => {
						setQuery(event.target.value);
						setActive(-1);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => setTimeout(() => setOpen(false), 140)}
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
						"w-full border border-input bg-surface/70 backdrop-blur-sm pr-24 pl-13 sm:pr-36 outline-none transition-all placeholder:text-subtle focus:border-foreground focus:bg-surface [&::-webkit-search-cancel-button]:hidden shadow-sm",
						size === "lg" ? "h-16 text-lg" : "h-14 text-base",
					)}
				/>
				{query && (
					<button
						type="button"
						onClick={() => {
							setQuery("");
							inputRef.current?.focus();
						}}
						aria-label="Clear search"
						className="absolute top-1/2 right-20 sm:right-32 -translate-y-1/2 p-1 text-subtle hover:text-foreground cursor-pointer"
					>
						<span className="font-mono text-xs">✕</span>
					</button>
				)}
				<button
					type="submit"
					className={cn(
						"absolute inset-y-0 right-0 flex cursor-pointer items-center gap-2.5 border border-primary bg-primary px-4 sm:px-6 font-mono text-xs uppercase tracking-[0.12em] text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]",
						size === "lg" && "sm:px-6",
					)}
				>
					<span className="sr-only sm:not-sr-only">Search</span> <span aria-hidden="true">→</span>
				</button>
			</form>
			{showList && (
				<div
					id={listId}
					role="listbox"
					className="glass-card absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden border border-border shadow-2xl p-2 text-left"
				>
					{results.length === 0 ? (
						<div className="px-4 py-3 text-muted-foreground text-sm">
							No matching tools — press Enter to search all tools.
						</div>
					) : (
						results.map((result, index) => {
							const Icon = iconFor(result.tool.icon);
							return (
								// biome-ignore lint/a11y/useFocusableInteractive: combobox pattern — focus stays in the input via aria-activedescendant
								<div
									key={result.href}
									id={`${listId}-${index}`}
									role="option"
									aria-selected={index === active}
									onMouseDown={(event) => {
										event.preventDefault();
										go(result.href);
									}}
									onMouseEnter={() => setActive(index)}
									className={cn(
										"flex min-h-14 cursor-pointer items-center gap-3 px-3 transition-colors",
										index === active ? "bg-muted text-foreground" : "hover:bg-muted/60",
									)}
								>
									<span
										className={cn(
											"grid size-10 shrink-0 place-items-center",
											categoryTone[result.tool.category],
										)}
									>
										<Icon className="size-5" />
									</span>
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="truncate font-medium">{result.title}</span>
										<span className="truncate text-xs text-muted-foreground">
											{result.subtitle}
										</span>
									</span>
									<span className="font-mono text-[0.625rem] uppercase text-subtle border border-border px-1.5 py-0.5">
										{result.tool.category}
									</span>
								</div>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}
