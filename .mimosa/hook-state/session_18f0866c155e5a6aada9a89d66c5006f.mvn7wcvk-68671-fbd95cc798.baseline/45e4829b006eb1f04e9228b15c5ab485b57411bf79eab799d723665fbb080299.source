import { Link } from "@tanstack/react-router";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
	return (
		<nav aria-label="Breadcrumb" className="mb-6">
			<ol className="label-mono flex flex-wrap items-center gap-x-2 gap-y-1">
				{items.map((item, index) => (
					<li key={item.name} className="flex items-center gap-2">
						{index > 0 && (
							<span aria-hidden="true" className="text-subtle">
								/
							</span>
						)}
						{item.href ? (
							<Link to={item.href} className="hover:text-foreground">
								{item.name}
							</Link>
						) : (
							<span aria-current="page" className="text-foreground">
								{item.name}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
