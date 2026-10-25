import { cn } from "@qbtools/ui/utils";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { categoryStyles, iconFor } from "#/lib/icons";
import { searchIndex } from "#/lib/search";

/**
 * Big hero search with instant suggestions (ARIA combobox).
 * Enter opens the highlighted tool, or /tools?q= when nothing is highlighted.
 */
export function SearchBox({
	size = "lg",
	autoFocus = false,
	placeholder = "What do you want to do? (e.g. compress, merge, pdf, qr...)",
	className,
}: {
	size?: "lg" | "md";
	autoFocus?: boolean;
	placeholder?: string;
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
						"pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground sm:left-4",
						size === "lg" ? "size-4 sm:size-5" : "size-4",
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
					placeholder={placeholder}
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
						"w-full rounded-lg border border-field-border bg-field pr-11 outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:pr-16 [&::-webkit-search-cancel-button]:hidden",
						size === "lg"
							? "h-12 pl-10 text-[0.9375rem] sm:h-14 sm:pl-12 sm:text-base"
							: "h-11 pl-10 text-sm sm:h-12 sm:pl-11",
					)}
				/>
				{query ? (
					<button
						type="button"
						onClick={() => {
							setQuery("");
							inputRef.current?.focus();
						}}
						aria-label="Clear search"
						className="absolute top-1/2 right-4 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						<X className="size-4" />
					</button>
				) : (
					<kbd className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-subtle sm:block">
						⌘K
					</kbd>
				)}
				<button type="submit" className="sr-only">
					Search
				</button>
			</form>
			{showList && (
				<div
					id={listId}
					role="listbox"
					className="absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-lg border border-border bg-popover p-1.5 text-left text-popover-foreground shadow-popover"
				>
					{results.length === 0 ? (
						<div className="px-3 py-3 text-sm text-muted-foreground">
							No matching tools — press Enter to search all tools.
						</div>
					) : (
						results.map((result, index) => {
							const Icon = iconFor(result.tool.icon);
							const style = categoryStyles[result.tool.category];
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
										"flex min-h-14 cursor-pointer items-center gap-3 rounded-md px-3 transition-colors",
										index === active ? "bg-accent text-foreground" : "hover:bg-accent/60",
									)}
								>
									<span
										className={cn(
											"grid size-9 shrink-0 place-items-center rounded-md border",
											style.tile,
										)}
									>
										<Icon className="size-[18px]" />
									</span>
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="truncate text-sm font-medium">{result.title}</span>
										<span className="truncate text-xs text-muted-foreground">
											{result.subtitle}
										</span>
									</span>
									<span
										className={cn(
											"rounded-full border px-2 py-0.5 text-xs capitalize",
											style.badge,
										)}
									>
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
