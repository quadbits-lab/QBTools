import { popularTools } from "@qbtools/registry";
import { Link } from "@tanstack/react-router";
import { SearchBox } from "./search-box";

export function NotFound() {
	return (
		<div className="container-page flex flex-col items-center py-20 text-center">
			<p className="font-mono text-6xl font-medium text-primary">404</p>
			<h1 className="mt-4 text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
				We couldn’t find that page
			</h1>
			<p className="mt-3 max-w-lg text-lg text-muted-foreground">
				The link may be old. Search for the tool you need instead:
			</p>
			<div className="mt-8 w-full max-w-2xl">
				<SearchBox autoFocus />
			</div>
			<div className="mt-10 flex flex-wrap justify-center gap-2">
				{popularTools(6).map((tool) => (
					<Link
						key={tool.slug}
						to="/tools/$slug"
						params={{ slug: tool.slug }}
						className="border border-border bg-surface px-4 py-2 font-medium hover:border-primary"
					>
						{tool.name}
					</Link>
				))}
			</div>
		</div>
	);
}
