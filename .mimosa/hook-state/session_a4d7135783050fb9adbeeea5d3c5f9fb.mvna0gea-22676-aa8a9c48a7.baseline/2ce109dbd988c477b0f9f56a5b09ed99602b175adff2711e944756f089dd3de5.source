import type { CategoryId, ToolDef } from "@qbtools/registry";
import { cn } from "@qbtools/ui/utils";
import { type LucideIcon, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { categoryStyles, iconFor } from "#/lib/icons";

/** A tool is "Top" when it ranks in the three most popular. */
export const isTopTool = (tool: Pick<ToolDef, "popular">) =>
	tool.popular !== undefined && tool.popular <= 3;
/** Browser tools never upload files; server-ai tools send content for AI processing. */
export const isPrivateTool = (tool: Pick<ToolDef, "runtime">) => tool.runtime === "browser";

type TagType = "top" | "private" | "ai" | "new";

const TAGS: Record<TagType, { label: string; icon: LucideIcon; tone: string }> = {
	top: {
		label: "Top",
		icon: Star,
		tone: "border-cat-amber-border bg-cat-amber-bg text-cat-amber-fg [&_svg]:text-cat-amber-icon",
	},
	private: {
		label: "Private",
		icon: ShieldCheck,
		tone: "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-fg [&_svg]:text-cat-emerald-icon",
	},
	ai: {
		label: "AI",
		icon: Sparkles,
		tone: "border-cat-violet-border bg-cat-violet-bg text-cat-violet-fg [&_svg]:text-cat-violet-icon",
	},
	new: {
		label: "New",
		icon: Zap,
		tone: "border-cat-sky-border bg-cat-sky-bg text-cat-sky-fg [&_svg]:text-cat-sky-icon",
	},
};

/** Pill flag: always an icon plus a label, never color alone. */
export function ToolTag({ type, className }: { type: TagType; className?: string }) {
	const { label, icon: Icon, tone } = TAGS[type];
	return (
		<span
			className={cn(
				"inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-xs leading-none",
				tone,
				className,
			)}
		>
			<Icon className="size-3" aria-hidden="true" />
			{label}
		</span>
	);
}

/** Top / Private / AI / New flags for a tool. */
export function ToolFlags({
	tool,
	className,
}: {
	tool: Pick<ToolDef, "popular" | "runtime" | "isNew">;
	className?: string;
}) {
	return (
		<span className={cn("flex items-center gap-1.5", className)}>
			{isTopTool(tool) && <ToolTag type="top" />}
			{isPrivateTool(tool) ? <ToolTag type="private" /> : <ToolTag type="ai" />}
			{tool.isNew && <ToolTag type="new" />}
		</span>
	);
}

/** Category pill: category icon, soft accent fill, short label. */
export function CategoryBadge({
	category,
	icon,
	label,
	className,
}: {
	category: CategoryId;
	icon: string;
	label: string;
	className?: string;
}) {
	const Icon = iconFor(icon);
	return (
		<span
			className={cn(
				"inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-xs leading-none",
				categoryStyles[category].badge,
				className,
			)}
		>
			<Icon className="size-3" aria-hidden="true" />
			{label}
		</span>
	);
}
