import { Link } from "@tanstack/react-router";
import { cn } from "@qbtools/ui/utils";

export function LogoMark({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
			<rect width="32" height="32" rx="9" className="fill-primary" />
			<path
				d="M10 9h6.5a6.5 6.5 0 0 1 4.6 11.1l2.4 2.4-2 2-2.6-2.6A6.5 6.5 0 1 1 10 9Zm6.5 3.4a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Z"
				className="fill-primary-foreground"
			/>
			<circle cx="24.5" cy="8.5" r="2.5" className="fill-accent" />
		</svg>
	);
}

export function Logo({ className }: { className?: string }) {
	return (
		<Link to="/" className={cn("flex items-center gap-2.5 font-extrabold text-xl tracking-tight", className)} aria-label="QBTools home">
			<LogoMark />
			<span>
				QB<span className="text-primary">Tools</span>
			</span>
		</Link>
	);
}
