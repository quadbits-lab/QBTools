import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
	return (
		<nav aria-label="Breadcrumb" className="mb-4 text-sm">
			<ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
				{items.map((item, index) => (
					<li key={item.name} className="flex items-center gap-1">
						{index > 0 && <ChevronRight className="size-4" />}
						{item.href ? (
							<Link to={item.href} className="hover:text-foreground hover:underline">
								{item.name}
							</Link>
						) : (
							<span aria-current="page" className="font-medium text-foreground">
								{item.name}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
