import {
	type Category,
	type CategoryId,
	categories,
	tools,
	toolsInCategory,
} from "@qbtools/registry";
import { Button } from "@qbtools/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@qbtools/ui/dialog";
import { Segmented } from "@qbtools/ui/segmented";
import { RotateCcw } from "lucide-react";
import { FilterChip } from "#/components/filter-chip";
import {
	DIRECTORY_SORT_OPTIONS,
	DIRECTORY_TAG_OPTIONS,
	type DirectorySort,
	type DirectoryTag,
} from "#/lib/directory-filters";
import { categoryShortName } from "#/lib/icons";

/** Disciplines that actually have tools, in registry order. */
const SHEET_CATEGORIES: ReadonlyArray<Category> = categories.filter(
	(c) => toolsInCategory(c.id).length > 0,
);

/**
 * Mobile-only filter sheet: discipline chips, tool type and sort, with live
 * filtering behind it. The primary footer button closes the sheet.
 */
export function MobileFilterSheet({
	open,
	onOpenChange,
	activeCategory,
	onCategoryChange,
	tagFilter,
	onTagFilterChange,
	sortBy,
	onSortChange,
	resultCount,
	onReset,
	hasActiveFilters,
	onAfterClose,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	activeCategory: CategoryId | "all";
	onCategoryChange: (category: CategoryId | "all") => void;
	tagFilter: DirectoryTag;
	onTagFilterChange: (tag: DirectoryTag) => void;
	sortBy: DirectorySort;
	onSortChange: (sort: DirectorySort) => void;
	resultCount: number;
	onReset: () => void;
	hasActiveFilters: boolean;
	/** Called after the sheet closes; used to return focus to its trigger. */
	onAfterClose?: () => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				variant="sheet"
				className="flex flex-col p-0"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					onAfterClose?.();
				}}
			>
				<DialogTitle className="sr-only">Filter tools</DialogTitle>
				<DialogDescription className="sr-only">
					Narrow the directory by discipline, tool type, or order.
				</DialogDescription>

				<div aria-hidden="true" className="flex justify-center pt-2 pb-1">
					<span className="h-1 w-10 rounded-full bg-border" />
				</div>

				<div className="flex items-baseline justify-between gap-3 px-5 pb-3">
					<p className="text-base font-semibold tracking-[-0.02em] text-foreground">Filters</p>
					<p className="font-mono text-xs text-muted-foreground" aria-live="polite">
						{resultCount} tool{resultCount === 1 ? "" : "s"}
					</p>
				</div>

				<div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-1">
					<fieldset>
						<legend className="label-mono !text-subtle">Discipline</legend>
						<div className="mt-2 flex flex-wrap gap-2">
							<FilterChip
								label="All"
								count={tools.length}
								active={activeCategory === "all"}
								onClick={() => onCategoryChange("all")}
								className="h-10"
							/>
							{SHEET_CATEGORIES.map((category) => (
								<FilterChip
									key={category.id}
									label={categoryShortName(category.name)}
									count={toolsInCategory(category.id).length}
									category={category.id}
									active={activeCategory === category.id}
									onClick={() => onCategoryChange(category.id)}
									className="h-10"
								/>
							))}
						</div>
					</fieldset>

					<fieldset className="mt-5">
						<legend className="label-mono !text-subtle">Show</legend>
						<Segmented
							size="toolbar"
							label="Filter tools by type"
							value={tagFilter}
							onChange={onTagFilterChange}
							options={DIRECTORY_TAG_OPTIONS}
							className="mt-2 w-full"
						/>
					</fieldset>

					<fieldset className="mt-5">
						<legend className="label-mono !text-subtle">Sort</legend>
						<Segmented
							size="toolbar"
							label="Sort tools"
							value={sortBy}
							onChange={onSortChange}
							options={DIRECTORY_SORT_OPTIONS}
							className="mt-2 w-full"
						/>
					</fieldset>
				</div>

				<div className="mt-3 flex items-center gap-2 border-t border-border/70 px-5 py-3">
					<Button
						type="button"
						variant="ghost"
						size="md"
						onClick={onReset}
						disabled={!hasActiveFilters}
					>
						<RotateCcw className="size-4" /> Reset
					</Button>
					<Button
						type="button"
						size="md"
						className="ml-auto flex-1"
						onClick={() => onOpenChange(false)}
						disabled={resultCount === 0}
					>
						{resultCount === 0 ? "No tools match" : `Show ${resultCount} tools`}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
