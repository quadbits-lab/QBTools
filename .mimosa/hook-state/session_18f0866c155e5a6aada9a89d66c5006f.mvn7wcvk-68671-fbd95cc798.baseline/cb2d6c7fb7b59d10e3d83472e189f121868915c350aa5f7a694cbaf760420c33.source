/** Typography and appearance controls for title/subtitle text blocks. */
import type { TextStyle } from "@qbtools/engines/graphic";
import { TEXT_FONTS } from "@qbtools/engines/graphic";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
import { Slider } from "@qbtools/ui/slider";
import { Switch } from "@qbtools/ui/switch";
import { ColorField } from "#/components/kit/color-field";
import { Section } from "#/components/kit/section";

export function TextControls({
	label,
	style,
	onChange,
}: {
	label: string;
	style: TextStyle;
	onChange: (next: TextStyle) => void;
}) {
	const outline = style.outline ?? { color: "#000000", width: 0 };
	return (
		<div className="flex flex-col gap-4">
			<Section title={label}>
				<div className="flex items-center justify-between rounded-lg border border-input px-3 py-2.5">
					<span className="text-sm">Show on banner</span>
					<Switch
						checked={style.show !== false}
						onCheckedChange={(show) => onChange({ ...style, show })}
						aria-label={`Show ${label}`}
					/>
				</div>
				<Field label="Text">
					<Input
						value={style.text}
						onChange={(e) => onChange({ ...style, text: e.target.value })}
						placeholder={`Your ${label.toLowerCase()}`}
					/>
				</Field>
			</Section>

			<Section title="Typography">
				<div className="grid grid-cols-2 gap-3">
					<Field label="Font">
						<Select
							value={style.font}
							onValueChange={(val) => onChange({ ...style, font: val as TextStyle["font"] })}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TEXT_FONTS.map((font) => (
									<SelectItem key={font} value={font}>
										{font}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
					<Field label="Weight">
						<Select
							value={String(style.fontWeight)}
							onValueChange={(val) => onChange({ ...style, fontWeight: Number(val) })}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="400">Regular</SelectItem>
								<SelectItem value="700">Bold</SelectItem>
							</SelectContent>
						</Select>
					</Field>
				</div>
				<Slider
					label="Font size"
					value={style.size}
					min={12}
					max={260}
					step={1}
					valueLabel={`${Math.round(style.size)}px`}
					onChange={(e) => onChange({ ...style, size: Number(e.target.value) })}
				/>
				<Slider
					label="Line height"
					value={style.lineHeight}
					min={0.9}
					max={2}
					step={0.05}
					valueLabel={style.lineHeight.toFixed(2)}
					onChange={(e) => onChange({ ...style, lineHeight: Number(e.target.value) })}
				/>
				<Slider
					label="Letter spacing"
					value={style.letterSpacing}
					min={-2}
					max={10}
					step={0.5}
					valueLabel={`${style.letterSpacing}px`}
					onChange={(e) => onChange({ ...style, letterSpacing: Number(e.target.value) })}
				/>
			</Section>

			<Section title="Appearance">
				<ColorField
					label="Text color"
					value={style.color}
					onChange={(color) => onChange({ ...style, color })}
				/>
				<Slider
					label="Opacity"
					value={style.opacity ?? 1}
					min={0.1}
					max={1}
					step={0.05}
					valueLabel={`${Math.round((style.opacity ?? 1) * 100)}%`}
					onChange={(e) => onChange({ ...style, opacity: Number(e.target.value) })}
				/>
				<Field label="Alignment">
					<Segmented
						label="Alignment"
						value={style.align}
						onChange={(align) => onChange({ ...style, align })}
						options={[
							{ value: "left", label: "Left" },
							{ value: "center", label: "Center" },
							{ value: "right", label: "Right" },
						]}
					/>
				</Field>
				<div className="flex flex-col gap-3 rounded-lg border border-input p-3">
					<div className="flex items-center justify-between">
						<span className="text-sm">Text outline</span>
						<Switch
							checked={outline.width > 0}
							onCheckedChange={(on) =>
								onChange({ ...style, outline: on ? { color: outline.color, width: 6 } : null })
							}
							aria-label="Text outline"
						/>
					</div>
					{outline.width > 0 ? (
						<>
							<ColorField
								label="Outline color"
								value={outline.color}
								onChange={(color) => onChange({ ...style, outline: { ...outline, color } })}
							/>
							<Slider
								label="Outline width"
								value={outline.width}
								min={1}
								max={24}
								step={1}
								valueLabel={`${outline.width}px`}
								onChange={(e) =>
									onChange({ ...style, outline: { ...outline, width: Number(e.target.value) } })
								}
							/>
						</>
					) : null}
				</div>
			</Section>

			<Section title="Layout">
				<Slider
					label="Block width"
					value={style.width}
					min={0.2}
					max={1}
					step={0.01}
					valueLabel={`${Math.round(style.width * 100)}%`}
					onChange={(e) => onChange({ ...style, width: Number(e.target.value) })}
				/>
				<div className="grid grid-cols-2 gap-3">
					<Slider
						label="X position"
						value={style.x}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(style.x * 100)}%`}
						onChange={(e) => onChange({ ...style, x: Number(e.target.value) })}
					/>
					<Slider
						label="Y position"
						value={style.y}
						min={0}
						max={1}
						step={0.01}
						valueLabel={`${Math.round(style.y * 100)}%`}
						onChange={(e) => onChange({ ...style, y: Number(e.target.value) })}
					/>
				</div>
			</Section>
		</div>
	);
}
