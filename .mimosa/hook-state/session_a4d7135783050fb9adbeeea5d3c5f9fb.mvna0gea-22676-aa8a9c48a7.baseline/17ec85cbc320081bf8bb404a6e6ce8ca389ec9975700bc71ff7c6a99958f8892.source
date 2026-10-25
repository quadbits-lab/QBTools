import { suffixFilename } from "@qbtools/engines/files";
import { MAX_PASSWORD_BYTES, validatePassword } from "@qbtools/engines/pdf-protect";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { formatBytes } from "@qbtools/ui/utils";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { ResultDownload } from "#/components/kit/result-download";
import { TaskProgress } from "#/components/kit/task-progress";
import { useTask } from "#/lib/processing/use-task";
import { ProcessingWorker } from "#/lib/processing/worker-client";

type Mode = "protect" | "unlock";
export default function ProtectPdf() {
	const [file, setFile] = useState<File | null>(null);
	const [mode, setMode] = useState<Mode>("protect");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [show, setShow] = useState(false);
	const [worker] = useState(() => new ProcessingWorker());
	const task = useTask<Blob>();
	useEffect(() => () => worker.dispose(), [worker]);
	const mismatch = mode === "protect" && confirm !== "" && confirm !== password;
	const ready = Boolean(file && password && (mode === "unlock" || password === confirm));
	const run = () => {
		if (!file) return;
		try {
			validatePassword(password);
		} catch (error) {
			return void task.run(async () => {
				throw error;
			});
		}
		void task.run((options) => worker.run<Blob>("pdf-protect", { file, mode, password }, options));
	};
	return (
		<div className="flex flex-col gap-5">
			<FileDrop
				accept="application/pdf,.pdf"
				onFiles={(files) => {
					task.reset();
					setFile(files[0] ?? null);
				}}
				hint="Choose a PDF · up to 100 MiB"
			/>
			{file && (
				<p>
					<strong>{file.name}</strong> · {formatBytes(file.size)}
				</p>
			)}
			<Segmented
				label="Protect or unlock"
				value={mode}
				onChange={(value) => {
					task.reset();
					setMode(value);
				}}
				options={[
					{ value: "protect", label: "Protect with password" },
					{ value: "unlock", label: "Unlock" },
				]}
			/>
			<Field
				label={mode === "protect" ? "New password" : "Current password"}
				htmlFor="pdf-password"
			>
				<div className="relative">
					<Input
						id="pdf-password"
						type={show ? "text" : "password"}
						value={password}
						maxLength={MAX_PASSWORD_BYTES}
						autoComplete={mode === "protect" ? "new-password" : "current-password"}
						disabled={task.busy}
						className="pr-10"
						onChange={(e) => {
							task.reset();
							setPassword(e.target.value);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" && ready && !task.busy) run();
						}}
					/>
					<button
						type="button"
						aria-label={show ? "Hide password" : "Show password"}
						onClick={() => setShow((value) => !value)}
						className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-subtle hover:text-foreground"
					>
						{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
					</button>
				</div>
			</Field>
			{mode === "protect" && (
				<Field label="Confirm password" htmlFor="pdf-password-confirm">
					<Input
						id="pdf-password-confirm"
						type={show ? "text" : "password"}
						value={confirm}
						maxLength={MAX_PASSWORD_BYTES}
						autoComplete="new-password"
						disabled={task.busy}
						aria-invalid={mismatch}
						onChange={(e) => {
							task.reset();
							setConfirm(e.target.value);
						}}
					/>
					{mismatch && <p className="text-sm text-critical">Passwords don't match.</p>}
				</Field>
			)}
			{mode === "protect" ? (
				<Notice tone="caution">
					There is no password recovery. If you forget this password, the PDF cannot be opened.
				</Notice>
			) : (
				<p>Enter the current password to save a copy that opens without one.</p>
			)}
			<Button disabled={!ready || task.busy} onClick={run}>
				{mode === "protect" ? "Protect PDF" : "Unlock PDF"}
			</Button>
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.status === "cancelled" && <p>PDF processing cancelled.</p>}
			{task.result && file && (
				<ResultDownload
					blob={task.result}
					name={suffixFilename(file.name, mode === "protect" ? "protected" : "unlocked")}
					before={file.size}
					title={mode === "protect" ? "Your PDF is protected" : "Your PDF is unlocked"}
				/>
			)}
			<PrivacyNote text="Your PDF and password stay on your device and the password is never stored. Nothing uploads unless you choose Save to Media." />
		</div>
	);
}
