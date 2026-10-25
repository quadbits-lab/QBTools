import {
	DEFAULT_HASH_ALGORITHMS,
	type DigestAlgorithm,
	HASH_ALGORITHMS,
	type Hashes,
} from "@qbtools/engines/hash";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { useEffect, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { TaskProgress } from "#/components/kit/task-progress";
import { useTask } from "#/lib/processing/use-task";
import { ProcessingWorker } from "#/lib/processing/worker-client";
export default function HashGenerator() {
	const [mode, setMode] = useState<"file" | "text">("file");
	const [file, setFile] = useState<File | null>(null);
	const [text, setText] = useState("");
	const [algorithms, setAlgorithms] = useState<DigestAlgorithm[]>(DEFAULT_HASH_ALGORITHMS);
	const [verify, setVerify] = useState("");
	const [copyMessage, setCopyMessage] = useState("");
	const [worker] = useState(() => new ProcessingWorker());
	const task = useTask<Hashes>();
	const { reset, run } = task;
	useEffect(() => () => worker.dispose(), [worker]);
	useEffect(() => {
		reset();
		setCopyMessage("");
		const input = mode === "file" ? file : text;
		if (input === null || !algorithms.length) return;
		const timer = setTimeout(
			() => void run((options) => worker.run<Hashes>("hash", { input, algorithms }, options)),
			mode === "text" ? 300 : 0,
		);
		return () => {
			clearTimeout(timer);
			reset();
		};
	}, [mode, file, text, algorithms, reset, run, worker]);
	const match =
		task.result &&
		Object.entries(task.result).find(([, hash]) => hash === verify.trim().toLowerCase())?.[0];
	return (
		<div className="flex flex-col gap-5">
			<div className="flex gap-2">
				<Button variant={mode === "file" ? "primary" : "outline"} onClick={() => setMode("file")}>
					File Checksum
				</Button>
				<Button variant={mode === "text" ? "primary" : "outline"} onClick={() => setMode("text")}>
					Text Hash
				</Button>
			</div>
			{mode === "file" ? (
				<>
					<FileDrop
						accept="*/*"
						title="Drop any file to calculate its hash"
						hint="Files are read in 4 MiB chunks · no upload"
						onFiles={(files) => setFile(files[0] ?? null)}
					/>
					{file && (
						<p>
							{file.name}{" "}
							<Button variant="ghost" onClick={() => setFile(null)}>
								Clear
							</Button>
						</p>
					)}
				</>
			) : (
				<label className="flex flex-col gap-2">
					Enter exact text to hash
					<textarea
						aria-label="Enter text to hash"
						value={text}
						onChange={(e) => setText(e.target.value)}
						rows={4}
						className="border border-input p-3 font-mono"
					/>
				</label>
			)}
			<fieldset className="flex flex-wrap gap-4">
				<legend className="mb-2">Algorithms</legend>
				{HASH_ALGORITHMS.map((algorithm) => (
					<label key={algorithm} className="flex gap-2">
						<input
							type="checkbox"
							checked={algorithms.includes(algorithm)}
							onChange={(e) =>
								setAlgorithms((list) =>
									e.target.checked ? [...list, algorithm] : list.filter((a) => a !== algorithm),
								)
							}
						/>
						{algorithm}
					</label>
				))}
			</fieldset>
			<TaskProgress busy={task.busy} progress={task.progress} cancel={task.cancel} />
			{task.error && <Notice tone="critical">{task.error}</Notice>}
			{task.status === "cancelled" && <p>Hashing cancelled.</p>}
			{task.result && (
				<div className="flex flex-col gap-4">
					{Object.entries(task.result).map(([algorithm, hash]) => (
						<div key={algorithm} className="border border-border p-3">
							<div className="flex justify-between gap-3">
								<strong>{algorithm}</strong>
								<Button
									variant="ghost"
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(hash ?? "");
											setCopyMessage(`${algorithm} copied`);
										} catch {
											setCopyMessage("Clipboard unavailable. Select and copy the hash.");
										}
									}}
								>
									Copy
								</Button>
							</div>
							<p className="break-all font-mono text-sm">{hash}</p>
						</div>
					))}
				</div>
			)}
			<p aria-live="polite">{copyMessage}</p>
			<label className="flex flex-col gap-2">
				Compare a checksum
				<Input
					value={verify}
					onChange={(e) => setVerify(e.target.value)}
					placeholder="Paste an expected checksum"
				/>
			</label>
			{verify.trim() && task.result && (
				<Notice tone={match ? "info" : "caution"}>
					{match ? `${match} Match` : "Mismatch — none of the selected algorithms match."}
				</Notice>
			)}
			<p className="text-sm text-muted-foreground">
				SHA-1 is provided for legacy checksum comparisons.
			</p>
			<PrivacyNote />
		</div>
	);
}
