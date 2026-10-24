import { cn } from "@qbtools/ui/utils";

/** Section kicker: mono label with an optional [01] index. */
export function Kicker({
	index,
	children,
	className,
}: {
	index?: number;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<p className={cn("label-mono flex items-center gap-3", className)}>
			{index !== undefined && (
				<span className="text-subtle">[{String(index).padStart(2, "0")}]</span>
			)}
			<span>{children}</span>
		</p>
	);
}

export function PageHero({
	eyebrow,
	title,
	description,
	className,
}: {
	eyebrow?: string;
	title: string;
	description?: React.ReactNode;
	className?: string;
}) {
	return (
		<header className={cn("border-b border-border", className)}>
			<div className="container-page py-16 sm:py-24">
				{eyebrow && <Kicker>{eyebrow}</Kicker>}
				<h1 className="display mt-5 max-w-4xl text-4xl text-balance sm:text-6xl">{title}</h1>
				{description && (
					<div className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{description}
					</div>
				)}
			</div>
		</header>
	);
}

export function LegalPage({
	title,
	updated,
	children,
}: {
	title: string;
	updated: string;
	children: React.ReactNode;
}) {
	return (
		<>
			<PageHero
				eyebrow="Legal"
				title={title}
				description={<p className="label-mono">Last updated · {updated}</p>}
			/>
			<article className="container-page py-12">
				<div className="prose-qb">{children}</div>
			</article>
		</>
	);
}
