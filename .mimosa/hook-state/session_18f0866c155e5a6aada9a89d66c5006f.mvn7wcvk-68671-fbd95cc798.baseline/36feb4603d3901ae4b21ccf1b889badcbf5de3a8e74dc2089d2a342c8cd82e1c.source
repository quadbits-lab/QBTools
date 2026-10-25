/**
 * Preview stage for the App Icon Generator: a large hero preview, real iOS
 * Dark/Tinted variant renders, Android launcher shapes with the adaptive
 * safe-zone guide, and a macOS rounded-square preview.
 */
import type { DesignWarning } from "@qbtools/engines/graphic";
import { Switch } from "@qbtools/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qbtools/ui/tabs";
import { cn } from "@qbtools/ui/utils";
import { Apple, Loader2, Monitor, Smartphone } from "lucide-react";

const ANDROID_SHAPES = [
	{ value: "circle", radius: "rounded-full" },
	{ value: "squircle", radius: "rounded-[28%]" },
	{ value: "rounded-square", radius: "rounded-xl" },
	{ value: "square", radius: "" },
] as const;

function PreviewTile({
	src,
	alt,
	busy,
	className,
}: {
	src?: string;
	alt: string;
	busy?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"relative size-20 overflow-hidden bg-surface-2 shadow-card outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 sm:size-24",
				className,
			)}
		>
			{src ? (
				<img src={src} alt={alt} className="size-full" />
			) : (
				<span className="label-mono grid size-full place-items-center text-subtle">
					{busy ? <Loader2 className="size-4 animate-spin" /> : "—"}
				</span>
			)}
		</div>
	);
}

export function IconPreviewStage({
	previews,
	iosDark,
	iosTinted,
	warnings,
	previewBusy,
}: {
	/** Blob URLs per preview key: base, dark, tinted. */
	previews: {
		base?: string;
		dark?: string;
		tinted?: string;
		darkBusy: boolean;
		tintedBusy: boolean;
	};
	iosDark: boolean;
	iosTinted: boolean;
	warnings: DesignWarning[];
	previewBusy: boolean;
}) {
	return (
		<div className="flex min-w-0 flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-inset ring-border">
			{/* Hero preview --------------------------------------------- */}
			<div className="flex flex-wrap items-center gap-5">
				<div
					className={cn(
						"relative size-32 overflow-hidden rounded-[22.37%] bg-surface-2 shadow-card outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 sm:size-40",
					)}
				>
					{previews.base ? (
						<img src={previews.base} alt="Icon preview" className="size-full" />
					) : (
						<span className="grid size-full place-items-center">
							<Loader2 className="size-6 animate-spin text-subtle" />
						</span>
					)}
					{previewBusy && previews.base ? (
						<span className="absolute right-1.5 bottom-1.5 grid size-5 place-items-center rounded-full bg-background/80">
							<Loader2 className="size-3 animate-spin text-muted-foreground" />
						</span>
					) : null}
				</div>
				<div className="flex min-w-0 flex-col gap-1">
					<span className="label-mono text-subtle">Live preview · 512 px render</span>
					<p className="text-xs text-muted-foreground">
						Corners stay square in every export — each platform rounds them at runtime. Toggle the
						guides below to check how masks crop your artwork.
					</p>
				</div>
			</div>

			<Tabs defaultValue="ios">
				<TabsList>
					<TabsTrigger value="ios">
						<Apple className="size-3.5" /> iOS
					</TabsTrigger>
					<TabsTrigger value="android">
						<Smartphone className="size-3.5" /> Android
					</TabsTrigger>
					<TabsTrigger value="macos">
						<Monitor className="size-3.5" /> macOS
					</TabsTrigger>
				</TabsList>

				<TabsContent value="ios" className="flex flex-col gap-4">
					<div>
						<span className="label-mono text-subtle">Home screen appearances · real renders</span>
						<div className="mt-3 flex flex-wrap items-end gap-4 sm:gap-5">
							<div className="flex flex-col items-center gap-2">
								<PreviewTile
									src={previews.base}
									alt="Any / Light appearance"
									className="rounded-[22.37%]"
								/>
								<span className="label-mono text-subtle">Any / Light</span>
							</div>
							<div className="flex flex-col items-center gap-2">
								<PreviewTile
									src={iosDark ? previews.dark : undefined}
									busy={iosDark && previews.darkBusy}
									alt="Dark appearance"
									className="rounded-[22.37%]"
								/>
								<span className="label-mono text-subtle">{iosDark ? "Dark" : "Dark off"}</span>
							</div>
							<div className="flex flex-col items-center gap-2">
								<PreviewTile
									src={iosTinted ? previews.tinted : undefined}
									busy={iosTinted && previews.tintedBusy}
									alt="Tinted appearance"
									className="rounded-[22.37%]"
								/>
								<span className="label-mono text-subtle">
									{iosTinted ? "Tinted" : "Tinted off"}
								</span>
							</div>
						</div>
					</div>
					<p className="text-xs text-muted-foreground">
						The modern catalog exports 1024 px Any/Dark/Tinted images (Xcode 14+); a legacy slot
						matrix is included for older targets.
					</p>
				</TabsContent>

				<TabsContent value="android" className="flex flex-col gap-4">
					<div className="flex flex-wrap items-end gap-4 sm:gap-5">
						{ANDROID_SHAPES.map((shape) => (
							<div key={shape.value} className="flex flex-col items-center gap-2">
								<div className="relative size-20 sm:size-24">
									{previews.base ? (
										<img
											src={previews.base}
											alt={`${shape.value} appearance`}
											className={cn(
												"size-full bg-surface-2 shadow-card outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
												shape.radius,
											)}
										/>
									) : null}
									<span
										aria-hidden
										className={cn(
											"absolute inset-[16.5%] border-2 border-dashed border-amber-400/70",
											shape.value === "circle" && "rounded-full",
											shape.value === "squircle" && "rounded-[30%]",
											shape.value === "rounded-square" && "rounded-lg",
											shape.value === "square" && "rounded-xs",
										)}
									/>
								</div>
								<span className="label-mono text-subtle">{shape.value.replace("-", " ")}</span>
							</div>
						))}
					</div>
					<p className="text-xs text-muted-foreground">
						Inner outline = the 66 dp safe circle on the 108 dp adaptive canvas. Exported
						foregrounds are clamped inside it, so launcher masks never clip your artwork.
					</p>
				</TabsContent>

				<TabsContent value="macos" className="flex flex-col gap-4">
					<div className="flex flex-wrap items-end gap-4 sm:gap-5">
						<div className="flex flex-col items-center gap-2">
							<div className="relative size-20 sm:size-24">
								{previews.base ? (
									<img
										src={previews.base}
										alt="macOS rounded square"
										className="size-full rounded-[18%] bg-surface-2 shadow-card outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
									/>
								) : null}
							</div>
							<span className="label-mono text-subtle">Rounded square</span>
						</div>
						<div className="flex items-end gap-2">
							{[48, 32, 24].map((px) => (
								<div key={px} className="flex flex-col items-center gap-1.5">
									{previews.base ? (
										<img
											src={previews.base}
											alt={`${px}px dock size`}
											style={{ width: px, height: px }}
											className="rounded-[18%] outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
										/>
									) : null}
									<span className="label-mono text-subtle">{px}</span>
								</div>
							))}
						</div>
					</div>
					<p className="text-xs text-muted-foreground">
						Exports include the full 16–1024 px AppIcon.appiconset and a ready-made AppIcon.icns for
						Electron and manual bundles.
					</p>
				</TabsContent>
			</Tabs>

			{warnings.length > 0 ? (
				<details className="rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm">
					<summary className="label-mono cursor-pointer text-subtle select-none">
						{warnings.length} warning{warnings.length > 1 ? "s" : ""}
					</summary>
					<ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
						{warnings.map((w) => (
							<li key={w.message}>
								{w.message}
								{w.skipped ? " (this output is skipped)" : ""}
							</li>
						))}
					</ul>
				</details>
			) : null}
		</div>
	);
}

/** Platform toggle row shared by the export tab. */
export function PlatformToggle({
	label,
	hint,
	active,
	onToggle,
}: {
	label: string;
	hint?: string;
	active: boolean;
	onToggle: () => void;
}) {
	return (
		<div className="flex items-center justify-between rounded-lg border border-input px-3 py-2.5">
			<div className="flex min-w-0 flex-col">
				<span className="text-sm">{label}</span>
				{hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
			</div>
			<Switch checked={active} onCheckedChange={onToggle} aria-label={`${label} platform`} />
		</div>
	);
}
