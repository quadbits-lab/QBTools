import { categoryById, type ToolDef } from "@qbtools/registry";
import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Star } from "lucide-react";
import { categoryShortName, categoryStyles, iconFor } from "#/lib/icons";
import { favoriteTools, toggleFavorite } from "#/lib/local-store";
import { useAccount } from "./account-provider";
import { CategoryBadge, ToolFlags } from "./tool-flags";

const TILE_SIZE = {
	sm: "size-9 rounded-md [&_svg]:size-[18px]",
	md: "size-10 rounded-md [&_svg]:size-5",
	xl: "size-12 rounded-lg [&_svg]:size-6",
	lg: "size-[72px] rounded-xl [&_svg]:size-9",
} as const;

/** Category-colored icon tile: soft accent fill, hairline, accent icon. */
export function ToolIcon({
	tool,
	size = "md",
}: {
	tool: Pick<ToolDef, "icon" | "category">;
	size?: keyof typeof TILE_SIZE;
}) {
	const Icon = iconFor(tool.icon);
	return (
		<span
			className={cn(
				"grid shrink-0 place-items-center border transition-transform duration-200 group-hover:scale-105",
				categoryStyles[tool.category].tile,
				TILE_SIZE[size],
			)}
		>
			<Icon strokeWidth={2} />
		</span>
	);
}

/** Boxed "go" arrow at the end of a card; fills on card hover. */
function GoCell() {
	return (
		<span
			aria-hidden="true"
			className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-foreground transition-colors duration-150 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
		>
			<ArrowRight className="size-4" />
		</span>
	);
}

export function FavoriteButton({ tool, className }: { tool: ToolDef; className?: string }) {
	const { user } = useAccount();
	const favorites = favoriteTools.use();
	if (!user) return null;
	const isFavorite = favorites.includes(tool.slug);
	return (
		<button
			type="button"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				toggleFavorite(tool.slug);
			}}
			aria-label={
				isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`
			}
			aria-pressed={isFavorite}
			className={cn(
				"grid size-8 shrink-0 cursor-pointer place-items-center rounded-md transition-colors hover:bg-accent",
				isFavorite ? "text-cat-amber-icon" : "text-muted-foreground hover:text-foreground",
				className,
			)}
		>
			<Star className={cn("size-4", isFavorite && "fill-current")} />
		</button>
	);
}

/** Tool card. `default` is the directory card; `compact` is a single row. */
export function ToolCard({
	tool,
	variant = "default",
	className,
}: {
	tool: ToolDef;
	/** Kept so older callers compile; the card no longer shows an index. */
	index?: number;
	/** `tile` is the narrow two-up card used by the mobile directory grid. */
	variant?: "default" | "compact" | "tile";
	className?: string;
}) {
	const category = categoryById[tool.category];
	const style = categoryStyles[tool.category];

	if (variant === "tile") {
		return (
			<article className={cn("group relative h-full min-w-0", className)}>
				<Link
					to="/tools/$slug"
					params={{ slug: tool.slug }}
					className={cn(
						"flex h-full flex-col rounded-xl border border-border bg-card p-2.5 transition-[border-color,box-shadow] duration-150 hover:shadow-hover",
						style.borderHover,
					)}
				>
					<ToolIcon tool={tool} size="sm" />
					<span className="mt-4 line-clamp-2 text-sm leading-5 font-medium text-foreground">
						{tool.name}
					</span>
					<span className="mt-2 line-clamp-2 text-xs leading-4 text-muted-foreground">
						{tool.tagline}
					</span>
				</Link>
				<FavoriteButton tool={tool} className="absolute top-2 right-2 size-7" />
			</article>
		);
	}

	if (variant === "compact") {
		return (
			<Link
				to="/tools/$slug"
				params={{ slug: tool.slug }}
				className={cn(
					"@container group relative flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-[border-color,box-shadow] duration-150 hover:shadow-hover",
					style.borderHover,
					className,
				)}
			>
				<ToolIcon tool={tool} size="sm" />
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-sm font-medium text-foreground">{tool.name}</span>
					<span className="truncate text-sm text-muted-foreground">{tool.tagline}</span>
				</span>
				<ToolFlags tool={tool} className="hidden @md:flex" />
				<FavoriteButton tool={tool} />
				<GoCell />
			</Link>
		);
	}

	return (
		<Link
			to="/tools/$slug"
			params={{ slug: tool.slug }}
			className={cn(
				"group relative flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-[border-color,box-shadow] duration-150 hover:shadow-hover",
				style.borderHover,
				className,
			)}
		>
			<span className="flex items-center justify-between gap-2">
				<ToolIcon tool={tool} />
				<span className="flex items-center gap-2">
					<ToolFlags tool={tool} />
					<FavoriteButton tool={tool} />
				</span>
			</span>
			<span className="text-xl leading-7 font-semibold tracking-[-0.025em] text-foreground">
				{tool.name}
			</span>
			<span className="line-clamp-2 flex-1 text-sm leading-5 text-muted-foreground">
				{tool.tagline}
			</span>
			<span className="flex items-center justify-between gap-2">
				<CategoryBadge
					category={tool.category}
					icon={category.icon}
					label={categoryShortName(category.name)}
				/>
				<GoCell />
			</span>
		</Link>
	);
}
