import { Button } from "@qbtools/ui/button";
import { toast } from "@qbtools/ui/toaster";
import { cn } from "@qbtools/ui/utils";
import { Check, Copy, FileCode2 } from "lucide-react";
import { useState } from "react";

export interface CodeBlockProps {
	code: string;
	filename?: string;
	language?: string;
	className?: string;
	maxHeight?: string;
}

export function CodeBlock({
	code,
	filename,
	language,
	className,
	maxHeight = "max-h-80",
}: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const onCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Couldn't copy — select the text and copy it manually.");
		}
	};

	return (
		<div
			className={cn(
				"relative flex flex-col overflow-hidden rounded-lg border border-border/80 bg-zinc-950 text-zinc-100 shadow-sm",
				className,
			)}
		>
			<div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs">
				<div className="flex items-center gap-2 font-mono text-zinc-400">
					<FileCode2 className="size-3.5 text-zinc-400" />
					<span className="font-medium text-zinc-200">{filename || "code"}</span>
					{language ? (
						<span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[0.6875rem] uppercase tracking-wider text-zinc-400">
							{language}
						</span>
					) : null}
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onCopy}
					className="h-7 cursor-pointer gap-1.5 px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
					aria-label="Copy code to clipboard"
				>
					{copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
					<span className={copied ? "text-emerald-400" : ""}>{copied ? "Copied!" : "Copy"}</span>
				</Button>
			</div>
			<pre
				className={cn(
					"overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-zinc-200 selection:bg-zinc-700",
					maxHeight,
				)}
			>
				<code>{code}</code>
			</pre>
		</div>
	);
}
