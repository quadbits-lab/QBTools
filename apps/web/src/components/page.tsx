import { cn } from "@qbtools/ui/utils";

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
		<header className={cn("border-b border-border bg-surface", className)}>
			<div className="container-page py-12 sm:py-16">
				{eyebrow && <p className="font-semibold text-primary">{eyebrow}</p>}
				<h1 className="mt-1 max-w-3xl text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
					{title}
				</h1>
				{description && (
					<div className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</div>
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
			<PageHero title={title} description={<p>Last updated: {updated}</p>} />
			<article className="container-page py-10">
				<div className="prose-qb">{children}</div>
			</article>
		</>
	);
}
