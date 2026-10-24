import { downloadBlob } from "@qbtools/engines/files";
import {
	DEFAULT_SETTINGS,
	type FormatSettings,
	LANGUAGES,
	type LanguageId,
	languageForFilename,
	SQL_DIALECTS,
	type SqlDialect,
} from "@qbtools/engines/format";
import { Button } from "@qbtools/ui/button";
import { Textarea } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbtools/ui/select";
import { useState } from "react";
import { CopyButton } from "#/components/kit/copy-button";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { SaveToMedia } from "#/components/kit/save-to-media";
import { useTask } from "#/lib/processing/use-task";

const ACCEPT = LANGUAGES.flatMap((item) => item.extensions.map((ext) => `.${ext}`)).join(",");
const EXTENSION: Record<LanguageId, string> = {
	javascript: "js",
	typescript: "ts",
	json: "json",
	css: "css",
	scss: "scss",
	less: "less",
	html: "html",
	markdown: "md",
	yaml: "yaml",
	sql: "sql",
};

export default function CodeFormatter() {
	const [source, setSource] = useState("");
	const [settings, setSettings] = useState<FormatSettings>(DEFAULT_SETTINGS);
	const [filename, setFilename] = useState("");
	const task = useTask<string>();
	const update = (patch: Partial<FormatSettings>) => {
		task.reset();
		setSettings((current) => ({ ...current, ...patch }));
	};
	const output = task.result ?? "";
	const name = `${(filename.replace(/\.[^.]+$/, "") || "formatted").slice(0, 80)}.${EXTENSION[settings.language]}`;
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				compact
				accept={ACCEPT}
				title="Drop a code file, or paste below"
				hint="Up to 1,000,000 characters · nothing is uploaded"
				onFiles={async (files) => {
					const file = files[0];
					if (!file) return;
					if (file.size > 2_000_000) return void setSource("");
					task.reset();
					setSource(await file.text());
					setFilename(file.name);
					const language = languageForFilename(file.name);
					if (language) setSettings((current) => ({ ...current, language }));
				}}
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Language" htmlFor="fmt-language">
					<Select
						value={settings.language}
						onValueChange={(val) => update({ language: val as LanguageId })}
					>
						<SelectTrigger id="fmt-language" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGES.map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				{settings.language === "sql" ? (
					<Field label="SQL dialect" htmlFor="fmt-dialect">
						<Select
							value={settings.sqlDialect}
							onValueChange={(val) => update({ sqlDialect: val as SqlDialect })}
						>
							<SelectTrigger id="fmt-dialect" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SQL_DIALECTS.map((item) => (
									<SelectItem key={item.id} value={item.id}>
										{item.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				) : (
					<Field label="Line width" htmlFor="fmt-width">
						<Select
							value={String(settings.printWidth)}
							onValueChange={(val) => update({ printWidth: Number(val) })}
						>
							<SelectTrigger id="fmt-width" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[60, 80, 100, 120].map((width) => (
									<SelectItem key={width} value={String(width)}>
										{width} characters
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				)}
			</div>
			<div className="flex flex-wrap items-center gap-4">
				<Segmented
					label="Indent with"
					value={settings.indent}
					onChange={(indent) => update({ indent })}
					options={[
						{ value: "spaces", label: "Spaces" },
						{ value: "tabs", label: "Tabs" },
					]}
				/>
				<Segmented
					label="Indent size"
					value={String(settings.tabWidth)}
					onChange={(value) => update({ tabWidth: Number(value) })}
					options={[
						{ value: "2", label: "2" },
						{ value: "4", label: "4" },
					]}
				/>
				{settings.language !== "sql" && settings.language !== "json" && (
					<>
						<label className="flex gap-2">
							<input
								type="checkbox"
								checked={settings.semicolons}
								onChange={(e) => update({ semicolons: e.target.checked })}
							/>
							Semicolons
						</label>
						<label className="flex gap-2">
							<input
								type="checkbox"
								checked={settings.singleQuote}
								onChange={(e) => update({ singleQuote: e.target.checked })}
							/>
							Single quotes
						</label>
					</>
				)}
			</div>
			<Field label="Your code" htmlFor="fmt-source">
				<Textarea
					id="fmt-source"
					rows={12}
					spellCheck={false}
					className="font-mono text-sm"
					value={source}
					onChange={(e) => {
						task.reset();
						setSource(e.target.value);
					}}
				/>
			</Field>
			<div className="flex flex-wrap gap-3">
				<Button
					disabled={!source.trim() || task.busy}
					onClick={() =>
						void task.run(async () => {
							const { formatCode } = await import("@qbtools/engines/format");
							return formatCode(source, settings);
						})
					}
				>
					Format
				</Button>
				{settings.language === "json" && (
					<Button
						variant="secondary"
						disabled={!source.trim() || task.busy}
						onClick={() =>
							void task.run(async () => {
								const { minifyJson } = await import("@qbtools/engines/format");
								return minifyJson(source);
							})
						}
					>
						Minify JSON
					</Button>
				)}
				{output && (
					<Button variant="ghost" onClick={() => setSource(output)}>
						Use result as input
					</Button>
				)}
			</div>
			{task.error && (
				<Notice tone="critical">
					<span role="alert">{task.error}</span>
				</Notice>
			)}
			{task.result !== null && (
				<div className="flex flex-col gap-3">
					<Field label="Result" htmlFor="fmt-output">
						<Textarea
							id="fmt-output"
							rows={12}
							readOnly
							spellCheck={false}
							className="font-mono text-sm"
							value={output}
						/>
					</Field>
					<div className="flex flex-wrap gap-3">
						<CopyButton text={output} label="Copy result" />
						<Button
							variant="secondary"
							onClick={() => downloadBlob(new Blob([output], { type: "text/plain" }), name)}
						>
							Download
						</Button>
						<SaveToMedia
							name={name}
							sourceTool="code-formatter"
							prepare={async () => new Blob([output], { type: "text/plain" })}
						/>
					</div>
				</div>
			)}
			<PrivacyNote text="Your code is formatted on your device and is never sent to a server. Nothing uploads unless you choose Save to Media." />
		</div>
	);
}
