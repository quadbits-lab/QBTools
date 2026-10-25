import { cn } from "@qbtools/ui/utils";
import { Link } from "@tanstack/react-router";

/** Brand wordmark (monochrome artwork, inverted for dark mode). */
export function Logo({ className }: { className?: string }) {
	return (
		<Link to="/" className={cn("flex shrink-0 items-center", className)} aria-label="QBTools home">
			<img
				src="/logo.png"
				alt="QBTools"
				width={1940}
				height={335}
				className="h-7 w-auto dark:invert"
			/>
		</Link>
	);
}
