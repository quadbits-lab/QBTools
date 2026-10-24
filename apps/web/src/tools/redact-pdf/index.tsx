import { suffixFilename } from "@qbtools/engines/files";
import type { RedactedPdf } from "@qbtools/engines/pdf-redact";
import { normalizeBox, type RedactionBox } from "@qbtools/engines/pdf-redact-boxes";
import { loadPdf } from "@qbtools/engines/pdf-render";
import { LIMITS } from "@qbtools/engines/processing";
import { Button } from "@qbtools/ui/button";
import { Segmented } from "@qbtools/ui/segmented";
import { formatBytes } from "@qbtools/ui/utils";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";
import { TaskProgress } from "#/components/kit/task-progress";
import { useTask } from "#/lib/processing/use-task";

type PdfTask = Awaited<ReturnType<typeof loadPdf>>;
type PdfDocument = Awaited<PdfTask["promise"]>;
type Point = { x: number; y: number };
/** Preview width in CSS pixels; the canvas is drawn at device resolution. */
const PREVIEW_WIDTH = 720;

function PagePreview({
	doc,
	index,
	boxes,
	drawing,
	onAdd,
	onRemove,
}: {
	doc: PdfDocument;
	index: number;
	boxes: { box: RedactionBox; id: number }[];
	drawing: boolean;
	onAdd: (box: RedactionBox) => void;
	onRemove: (id: number) => void;
}) {
	const holder = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const [ratio, setRatio] = useState(1.3);
	const [failed, setFailed] = useState(false);
	const [visible, setVisible] = useState(index === 0);
	const [start, setStart] = useState<Point | null>(null);
	const [draft, setDraft] = useState<RedactionBox | null>(null);
	useEffect(() => {
		const element = holder.current;
		if (!element || visible) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
			},
			{ rootMargin: "400px" },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [visible]);
	useEffect(() => {
		if (!visible) return;
		let cancelled = false;
		(async () => {
			try {
				const page = await doc.getPage(index + 1);
				const base = page.getViewport({ scale: 1 });
				const scale = (PREVIEW_WIDTH * Math.min(2, window.devicePixelRatio || 1)) / base.width;
				const viewport = page.getViewport({ scale });
				const target = canvas.current;
				if (!target || cancelled) return;
				target.width = Math.ceil(viewport.width);
				target.height = Math.ceil(viewport.height);
				setRatio(viewport.height / viewport.width);
				const ctx = target.getContext("2d");
				if (!ctx) throw new Error("Canvas isn't available.");
				ctx.fillStyle = "#fff";
				ctx.fillRect(0, 0, target.width, target.height);
				await page.render({ canvas: target, canvasContext: ctx, viewport }).promise;
				page.cleanup();
			} catch {
				if (!cancelled) setFailed(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [visible, doc, index]);
	const point = (event: React.PointerEvent): Point => {
		const rect = event.currentTarget.getBoundingClientRect();
		return {
			x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
			y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
		};
	};
	return (
		<div
			ref={holder}
			className="relative w-full max-w-[720px] border border-input bg-white"
			style={{ aspectRatio: `1 / ${ratio}` }}
		>
			<canvas
				ref={canvas}
				className="absolute inset-0 size-full"
				aria-label={`Page ${index + 1}`}
				role="img"
			/>
			{failed && <p className="absolute inset-0 grid place-items-center text-black">No preview.</p>}
			<div
				data-testid={`redact-page-${index + 1}`}
				className="absolute inset-0 select-none"
				style={{
					cursor: drawing ? "crosshair" : "default",
					touchAction: drawing ? "none" : "auto",
					pointerEvents: drawing ? "auto" : "none",
				}}
				onPointerDown={(event) => {
					if (!drawing || event.button !== 0) return;
					event.currentTarget.setPointerCapture(event.pointerId);
					const p = point(event);
					setStart(p);
					setDraft({ page: index, x: p.x, y: p.y, width: 0, height: 0 });
				}}
				onPointerMove={(event) => {
					if (!start) return;
					const p = point(event);
					setDraft({
						page: index,
						x: start.x,
						y: start.y,
						width: p.x - start.x,
						height: p.y - start.y,
					});
				}}
				onPointerUp={() => {
					const clean = draft && normalizeBox(draft);
					if (clean) onAdd(clean);
					setStart(null);
					setDraft(null);
				}}
				onPointerCancel={() => {
					setStart(null);
					setDraft(null);
				}}
			>
				{boxes.map(({ box, id }) => (
					<div
						key={id}
						className="absolute bg-black"
						style={{
							left: `${box.x * 100}%`,
							top: `${box.y * 100}%`,
							width: `${box.width * 100}%`,
							height: `${box.height * 100}%`,
						}}
					>
						<button
							type="button"
							aria-label={`Remove redaction on page ${index + 1}`}
							className="pointer-events-auto absolute -top-3 -right-3 grid size-6 cursor-pointer place-items-center rounded-full border border-white bg-critical text-white"
							style={{ pointerEvents: "auto" }}
							onPointerDown={(event) => event.stopPropagation()}
							onClick={() => onRemove(id)}
						>
							<X className="size-3" />
						</button>
					</div>
				))}
				{draft && (
					<div
						className="absolute border border-dashed border-white bg-black/60"
						style={{
							left: `${Math.min(draft.x, draft.x + draft.width) * 100}%`,
							top: `${Math.min(draft.y, draft.y + draft.height) * 100}%`,
							width: `${Math.abs(draft.width) * 100}%`,
							height: `${Math.abs(draft.height) * 100}%`,
						}}
					/>
				)}
			</div>
		</div>
	);
}

export default function RedactPdf() {
	const [file, setFile] = useState<File | null>(null);
	const [doc, setDoc] = useState<PdfDocument | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [boxes, setBoxes] = useState<{ box: RedactionBox; id: number }[]>([]);
	const [drawing, setDrawing] = useState(true);
	const nextId = useRef(1);
	const task = useTask<RedactedPdf>();
	useEffect(() => {
		setDoc(null);
		setBoxes([]);
		setLoadError(null);
		if (!file) return;
		let cancelled = false;
		let pending: PdfTask | null = null;
		(async () => {
			try {
				pending = await loadPdf(file);
				const loaded = await pending.promise;
				if (cancelled) return;
				if (loaded.numPages > LIMITS.redactPages) {
					setLoadError(
						`Redaction supports up to ${LIMITS.redactPages} pages. Split the PDF first.`,
					);
					return;
				}
				setDoc(loaded);
			} catch (error) {
				if (cancelled) return;
				setLoadError(
					(error as { name?: string })?.name === "PasswordException"
						? "This PDF is password-protected. Unlock it with the Protect PDF tool first."
						: "This PDF couldn't be opened. It may be damaged.",
				);
			}
		})();
		return () => {
			cancelled = true;
			void pending?.destroy();
		};
	}, [file]);
	const add = (box: RedactionBox) => {
		task.reset();
		setBoxes((current) => [...current, { box, id: nextId.current++ }]);
	};
	const redactedPages = new Set(boxes.map(({ box }) => box.page)).size;
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="application/pdf,.pdf"
				onFiles={(files) => {
					task.reset();
					setFile(files[0] ?? null);
				}}
				hint={`Choose a PDF · up to ${LIMITS.redactPages} pages`}
			/>
			{file && (
				<p>
					<strong>{file.name}</strong> · {formatBytes(file.size)}
				</p>
			)}
			{loadError && <Notice tone="critical">{loadError}</Notice>}
			{doc && (
				<>
					<Notice tone="caution">
						Pages with boxes are rebuilt as images, so the covered text is removed for good. Other
						pages are unchanged. Bookmarks and document properties are not kept. Open the result and
						check every page before sharing it.
					</Notice>
					<div className="flex flex-wrap items-center gap-3">
						<Segmented
							label="Pointer mode"
							value={drawing ? "draw" : "scroll"}
							onChange={(value) => setDrawing(value === "draw")}
							options={[
								{ value: "draw", label: "Draw boxes" },
								{ value: "scroll", label: "Scroll" },
							]}
						/>
						<span className="text-sm text-muted-foreground" aria-live="polite">
							{boxes.length} {boxes.length === 1 ? "box" : "boxes"} on {redactedPages}{" "}
							{redactedPages === 1 ? "page" : "pages"}
						</span>
						{boxes.length > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									task.reset();
									setBoxes([]);
								}}
							>
								Clear all
							</Button>
						)}
					</div>
					<div className="flex flex-col items-center gap-6">
						{Array.from({ length: doc.numPages }, (_, index) => (
							<div
								key={`${file?.name}-${index}`}
								className="flex w-full flex-col items-center gap-2"
							>
								<div className="flex w-full max-w-[720px] items-center justify-between text-sm">
									<span>
										Page {index + 1} of {doc.numPages}
									</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => add({ page: index, x: 0, y: 0, width: 1, height: 1 })}
									>
										Redact whole page
									</Button>
								</div>
								<PagePreview
									doc={doc}
									index={index}
									drawing={drawing}
									boxes={boxes.filter(({ box }) => box.page === index)}
									onAdd={add}
									onRemove={(id) => {
										task.reset();
										setBoxes((current) => current.filter((item) => item.id !== id));
									}}
								/>
							</div>
						))}
					</div>
					<Button
						disabled={boxes.length === 0 || task.busy}
						onClick={() => {
							if (!file) return;
							const list = boxes.map(({ box }) => box);
							void task.run(async (options) => {
								const { redactPdf } = await import("@qbtools/engines/pdf-redact");
								return redactPdf(file, list, options);
							});
						}}
					>
						Redact {redactedPages || ""} {redactedPages === 1 ? "page" : "pages"}
					</Button>
				</>
			)}
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.status === "cancelled" && <p>PDF processing cancelled.</p>}
			{task.result && file && (
				<ResultDownload
					blob={task.result.blob}
					name={suffixFilename(file.name, "redacted")}
					before={file.size}
					title={`Redacted ${task.result.redactedPages} of ${task.result.pageCount} pages`}
				/>
			)}
			<PrivacyNote />
		</div>
	);
}
