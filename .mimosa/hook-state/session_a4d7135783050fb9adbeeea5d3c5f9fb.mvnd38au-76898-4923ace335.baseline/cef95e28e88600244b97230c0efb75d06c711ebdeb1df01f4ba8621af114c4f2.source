/** Canvas sizing and background controls for the OG Banner Maker inspector. */
import type { OgDesign } from "@qbtools/engines/graphic";
import { GRADIENTS, OG_CANVAS_PRESETS, SOLIDS } from "@qbtools/engines/graphic";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
import { Slider } from "@qbtools/ui/slider";
import { cn } from "@qbtools/ui/utils";
import { ColorField } from "#/components/kit/color-field";
import { Section } from "#/components/kit/section";

export type DesignChange = {
	commit: (next: OgDesign) => void;
	update: (mutate: (draft: OgDesign) => OgDesign) => void;
};

export function CanvasSection({
	design,
	commit,
	update,
}: {
	design: OgDesign;
	commit: DesignChange["commit"];
	update: DesignChange["update"];
}) {
	const presetValue = OG_CANVAS_PRESETS.some(
		(p) => `${p.width}x${p.height}` === `${design.canvas.width}x${design.canvas.height}`,
	)
		? `${design.canvas.width}x${design.canvas.height}`
		: "custom";
	return (
		<Section title="Canvas size" eyebrow={`${design.canvas.width} × ${design.canvas.height} px`}>
			<Select
				value={presetValue}
				onValueChange={(val) => {
					const found = OG_CANVAS_PRESETS.find((p) => `${p.width}x${p.height}` === val);
					if (found) commit({ ...design, canvas: { width: found.width, height: found.height } });
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{OG_CANVAS_PRESETS.map((p) => (
						<SelectItem key={p.slug} value={`${p.width}x${p.height}`}>
							{p.label}
						</SelectItem>
					))}
					<SelectItem value="custom">Custom…</SelectItem>
				</SelectContent>
			</Select>
			<div className="grid grid-cols-2 gap-3">
				<Field label="Width (px)">
					<Input
						type="number"
						value={design.canvas.width}
						min={50}
						max={4096}
						onChange={(e) =>
							update((d) => ({
								...d,
								canvas: {
									...d.canvas,
									width: Math.min(4096, Math.max(50, Number(e.target.value) || 1200)),
								},
							}))
						}
					/>
				</Field>
				<Field label="Height (px)">
					<Input
						type="number"
						value={design.canvas.height}
						min={50}
						max={4096}
						onChange={(e) =>
							update((d) => ({
								...d,
								canvas: {
									...d.canvas,
									height: Math.min(4096, Math.max(50, Number(e.target.value) || 630)),
								},
							}))
						}
					/>
				</Field>
			</div>
		</Section>
	);
}

function SwatchButton({
	active,
	label,
	onClick,
	children,
}: {
	active: boolean;
	label: string;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				"size-8 cursor-pointer overflow-hidden rounded-md transition-[box-shadow,transform] duration-150 ease-out [-webkit-tap-highlight-color:transparent] motion-safe:enabled:active:scale-[0.96]",
				active
					? "ring-2 ring-emerald-500"
					: "ring-1 ring-border ring-inset hover:ring-foreground/40",
			)}
		>
			{children}
		</button>
	);
}

export function BackgroundSection({
	design,
	commit,
	update,
}: {
	design: OgDesign;
	commit: DesignChange["commit"];
	update: DesignChange["update"];
}) {
	const bg = design.background;
	const isGradient = (g: { from: string; to: string }) =>
		bg.type === "gradient" &&
		bg.from.toLowerCase() === g.from.toLowerCase() &&
		bg.to.toLowerCase() === g.to.toLowerCase();
	return (
		<Section title="Background">
			<Segmented
				label="Background"
				value={bg.type === "none" ? "none" : bg.type}
				onChange={(type) => {
					if (type === "none") commit({ ...design, background: { type: "none" } });
					else if (type === "color") {
						commit({
							...design,
							background: bg.type === "color" ? bg : { type: "color", color: "#0f172a" },
						});
					} else {
						commit({
							...design,
							background:
								bg.type === "gradient"
									? bg
									: { type: "gradient", from: "#4f46e5", to: "#9333ea", angle: 135 },
						});
					}
				}}
				options={[
					{ value: "color", label: "Color" },
					{ value: "gradient", label: "Gradient" },
					{ value: "none", label: "None" },
				]}
			/>
			{bg.type === "color" ? (
				<div className="flex flex-wrap items-center gap-2">
					{SOLIDS.map((s) => (
						<SwatchButton
							key={s.name}
							label={s.name}
							active={bg.color.toLowerCase() === s.color.toLowerCase()}
							onClick={() => commit({ ...design, background: { type: "color", color: s.color } })}
						>
							<span className="block size-full" style={{ backgroundColor: s.color }} />
						</SwatchButton>
					))}
					<ColorField
						label="Custom color"
						value={bg.color}
						onChange={(color) => commit({ ...design, background: { type: "color", color } })}
					/>
				</div>
			) : null}
			{bg.type === "gradient" ? (
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center gap-2">
						{GRADIENTS.map((g) => (
							<SwatchButton
								key={g.name}
								label={`${g.name} gradient`}
								active={isGradient(g)}
								onClick={() => commit({ ...design, background: { type: "gradient", ...g } })}
							>
								<span
									className="block size-full"
									style={{
										background: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`,
									}}
								/>
							</SwatchButton>
						))}
					</div>
					<div className="grid gap-3 sm:grid-cols-3">
						<ColorField
							label="From"
							value={bg.from}
							onChange={(from) => update((d) => ({ ...d, background: { ...bg, from } }))}
						/>
						<ColorField
							label="To"
							value={bg.to}
							onChange={(to) => update((d) => ({ ...d, background: { ...bg, to } }))}
						/>
						<Slider
							label="Angle"
							value={bg.angle}
							min={0}
							max={360}
							step={5}
							valueLabel={`${bg.angle}°`}
							onChange={(e) =>
								update((d) => ({ ...d, background: { ...bg, angle: Number(e.target.value) } }))
							}
						/>
					</div>
				</div>
			) : null}
			<Slider
				label="Canvas padding"
				value={design.padding}
				min={0.02}
				max={0.18}
				step={0.01}
				valueLabel={`${Math.round(design.padding * 100)}%`}
				onChange={(e) => update((d) => ({ ...d, padding: Number(e.target.value) }))}
			/>
		</Section>
	);
}
