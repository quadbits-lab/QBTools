import {
	buildPlatformSnippets,
	type FaviconExportOptions,
	type PlatformSnippet,
} from "@qbtools/engines/graphic";
import { cn } from "@qbtools/ui/utils";
import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { CodeBlock } from "#/components/kit/code-block";

interface FaviconSnippetsProps {
	options: FaviconExportOptions;
}

export function FaviconSnippets({ options }: FaviconSnippetsProps) {
	const snippets = useMemo(() => buildPlatformSnippets(options), [options]);
	const [selectedId, setSelectedId] = useState<string>("vite");

	const activeSnippet: PlatformSnippet = snippets.find((s) => s.id === selectedId) ??
		snippets[0] ?? {
			id: "html",
			name: "HTML",
			file: "index.html",
			language: "html",
			description: "",
			code: "",
		};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<span className="label-mono text-subtle">Select platform</span>
				<div
					role="tablist"
					aria-label="Platform code snippets"
					className="flex flex-wrap gap-1.5 rounded-lg border border-border/60 bg-surface-2 p-1.5"
				>
					{snippets.map((item) => {
						const active = item.id === activeSnippet.id;
						return (
							<button
								key={item.id}
								type="button"
								role="tab"
								aria-selected={active}
								onClick={() => setSelectedId(item.id)}
								className={cn(
									"cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-[background-color,color,box-shadow,scale] duration-150 ease-out enabled:active:motion-safe:scale-[0.96]",
									active
										? "bg-primary text-primary-foreground shadow-sm"
										: "text-muted-foreground hover:bg-surface-3 hover:text-foreground",
								)}
							>
								{item.name}
							</button>
						);
					})}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between gap-2">
					<p className="text-xs text-muted-foreground">{activeSnippet.description}</p>
				</div>

				<CodeBlock
					code={activeSnippet.code}
					filename={activeSnippet.file}
					language={activeSnippet.language}
					maxHeight="max-h-80"
				/>
			</div>

			<div className="flex items-start gap-2 rounded-md border border-input/60 bg-surface-2/60 p-3 text-xs text-subtle">
				<Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<div className="flex flex-col gap-1 leading-relaxed">
					<span>
						Place the exported icon files into your static assets directory matching the path{" "}
						<code className="rounded bg-surface-3 px-1 py-0.5 font-mono text-foreground">
							{options.assetPath || "/"}
						</code>
						.
					</span>
					<span>
						You can adjust the deployment asset path and theme color in the{" "}
						<strong className="text-foreground">Names & colors</strong> tab, and the snippets will
						update automatically.
					</span>
				</div>
			</div>
		</div>
	);
}
