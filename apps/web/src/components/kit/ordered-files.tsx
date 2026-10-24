import { Button } from "@qbtools/ui/button";
import { formatBytes } from "@qbtools/ui/utils";
import { ArrowDown, ArrowUp, FileText, X } from "lucide-react";
import { useObjectUrl } from "./use-object-url";

export interface OrderedFile {
	id: string;
	file: File;
	/** Optional preview (data URL) — e.g. PDF first page. */
	thumb?: string | null;
	meta?: string;
}

function Preview({ item }: { item: OrderedFile }) {
	const url = useObjectUrl(item.file.type.startsWith("image/") ? item.file : undefined);
	const src = item.thumb ?? url;
	return (
		<span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white">
			{src ? <img src={src} alt="" className="max-h-full max-w-full object-contain" /> : <FileText className="size-6 text-cat-pdf" />}
		</span>
	);
}

/** Reorderable list with big up/down buttons (works by touch and keyboard). */
export function OrderedFiles({ items, onChange }: { items: OrderedFile[]; onChange: (items: OrderedFile[]) => void }) {
	const move = (index: number, delta: number) => {
		const next = [...items];
		const [item] = next.splice(index, 1);
		if (item) next.splice(index + delta, 0, item);
		onChange(next);
	};
	return (
		<ol className="flex flex-col gap-2">
			{items.map((item, index) => (
				<li key={item.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5">
					<span className="w-6 text-center font-mono font-bold text-muted-foreground">{index + 1}</span>
					<Preview item={item} />
					<span className="min-w-0 flex-1">
						<span className="block truncate font-semibold">{item.file.name}</span>
						<span className="block text-sm text-muted-foreground">
							{formatBytes(item.file.size)}
							{item.meta ? ` · ${item.meta}` : ""}
						</span>
					</span>
					<Button variant="ghost" size="icon-sm" aria-label={`Move ${item.file.name} up`} disabled={index === 0} onClick={() => move(index, -1)}>
						<ArrowUp className="size-4" />
					</Button>
					<Button variant="ghost" size="icon-sm" aria-label={`Move ${item.file.name} down`} disabled={index === items.length - 1} onClick={() => move(index, 1)}>
						<ArrowDown className="size-4" />
					</Button>
					<Button variant="ghost" size="icon-sm" aria-label={`Remove ${item.file.name}`} onClick={() => onChange(items.filter((i) => i.id !== item.id))}>
						<X className="size-4" />
					</Button>
				</li>
			))}
		</ol>
	);
}

let counter = 0;
export const toOrdered = (file: File): OrderedFile => ({ id: `f-${++counter}`, file });
