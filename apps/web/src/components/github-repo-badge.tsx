import { cn } from "@qbtools/ui/utils";
import type { ComponentProps } from "react";
import { GITHUB_REPO_SLUG, GITHUB_REPO_URL } from "#/lib/site";
import { GitHubIcon } from "./github-icon";

type GitHubRepoBadgeProps = ComponentProps<"a"> & {
	/**
	 * Hide the label below `xl`. The pill keeps its shape and shows the mark
	 * alone, which the header needs at 1024–1279px where the action row is full.
	 */
	collapseLabel?: boolean;
};

/**
 * Canonical GitHub link badge — the same pill, label, and colors in the header,
 * the mobile drawer, and the footer. Opens the repository in a new tab.
 */
export function GitHubRepoBadge({
	className,
	collapseLabel = false,
	...props
}: GitHubRepoBadgeProps) {
	return (
		<a
			{...props}
			href={GITHUB_REPO_URL}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={`GitHub repository: ${GITHUB_REPO_SLUG}`}
			title={`${GITHUB_REPO_SLUG} on GitHub`}
			className={cn(
				"group inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-field px-3 text-xs font-medium text-foreground control-raise transition-[background-color,border-color,color,transform] duration-150 hover:border-foreground/25 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97]",
				className,
			)}
		>
			<GitHubIcon className="size-4 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-foreground" />
			<span className={cn("truncate", collapseLabel && "max-xl:hidden")}>GitHub</span>
		</a>
	);
}
