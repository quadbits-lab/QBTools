import { cn } from "@qbtools/ui/utils";
import { Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Big drop zone: drag & drop, tap to pick, or paste (Ctrl/⌘+V) while the
 * tool is on screen. Files never leave the browser.
 */
export function FileDrop({
	accept,
	multiple = false,
	onFiles,
	title,
	hint,
	compact = false,
	className,
}: {
	accept: string;
	multiple?: boolean;
	onFiles: (files: File[]) => void;
	title?: string;
	hint?: string;
	compact?: boolean;
	className?: string;
}) {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);

	const matches = (file: File) => {
		const rules = accept.split(",").map((r) => r.trim().toLowerCase());
		const name = file.name.toLowerCase();
		const type = file.type.toLowerCase();
		return rules.some((rule) =>
			rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule,
		);
	};

	const take = (list: FileList | File[] | null) => {
		const files = Array.from(list ?? []).filter(matches);
		if (files.length) onFiles(multiple ? files : files.slice(0, 1));
	};

	useEffect(() => {
		const onPaste = (event: ClipboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
			const files = Array.from(event.clipboardData?.files ?? []);
			if (files.length) {
				event.preventDefault();
				take(files);
			}
		};
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	});

	return (
		<label
			htmlFor={inputId}
			onDragOver={(event) => {
				event.preventDefault();
				setDragging(true);
			}}
			onDragLeave={() => setDragging(false)}
			onDrop={(event) => {
				event.preventDefault();
				setDragging(false);
				take(event.dataTransfer.files);
			}}
			className={cn(
				"flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-input bg-surface-2 text-center transition-colors hover:border-primary hover:bg-primary-soft/40",
				dragging && "border-primary bg-primary-soft/60",
				compact ? "px-4 py-6" : "min-h-64 px-6 py-10",
				className,
			)}
		>
			<span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
				<Upload className="size-7" />
			</span>
			<span className="text-lg font-bold">{title ?? (multiple ? "Choose files or drop them here" : "Choose a file or drop it here")}</span>
			{hint ? <span className="text-sm text-muted-foreground">{hint}</span> : null}
			<span className="hidden text-xs text-muted-foreground sm:block">You can also paste with Ctrl+V / ⌘V</span>
			<input
				ref={inputRef}
				id={inputId}
				type="file"
				accept={accept}
				multiple={multiple}
				className="sr-only"
				onChange={(event) => {
					take(event.target.files);
					event.target.value = "";
				}}
			/>
		</label>
	);
}
