import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { cn, formatBytes } from "@qbtools/ui/utils";
import {
	Check,
	CheckCircle2,
	Copy,
	FileText,
	Hash,
	RotateCcw,
	ShieldCheck,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { PrivacyNote } from "#/components/kit/privacy-note";

export default function HashGenerator() {
	const [inputMode, setInputMode] = useState<"file" | "text">("file");
	const [file, setFile] = useState<File | null>(null);
	const [text, setText] = useState("");
	const [hashes, setHashes] = useState<{
		sha256: string;
		sha512: string;
		sha1: string;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [verifyHash, setVerifyHash] = useState("");
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	const copyToClipboard = async (val: string, key: string) => {
		try {
			await navigator.clipboard.writeText(val);
			setCopiedKey(key);
			setTimeout(() => setCopiedKey(null), 1500);
		} catch {
			// Clipboard API blocked
		}
	};

	// Calculate hashes for file
	useEffect(() => {
		if (inputMode !== "file" || !file) return;
		let active = true;
		setLoading(true);

		void import("@qbtools/engines/crypto").then(async (cryptoEngine) => {
			try {
				const res = await cryptoEngine.computeAllHashes(file);
				if (active) setHashes(res);
			} catch {
				if (active) setHashes(null);
			} finally {
				if (active) setLoading(false);
			}
		});

		return () => {
			active = false;
		};
	}, [file, inputMode]);

	// Calculate hashes for text
	useEffect(() => {
		if (inputMode !== "text") return;
		if (!text.trim()) {
			setHashes(null);
			return;
		}

		let active = true;
		void import("@qbtools/engines/crypto").then(async (cryptoEngine) => {
			try {
				const [sha256, sha512, sha1] = await Promise.all([
					cryptoEngine.computeFileHash(text, "SHA-256"),
					cryptoEngine.computeFileHash(text, "SHA-512"),
					cryptoEngine.computeFileHash(text, "SHA-1"),
				]);
				if (active) setHashes({ sha256, sha512, sha1 });
			} catch {
				if (active) setHashes(null);
			}
		});

		return () => {
			active = false;
		};
	}, [text, inputMode]);

	const cleanVerify = verifyHash.trim().toLowerCase();
	const matchAlgorithm = hashes
		? cleanVerify === hashes.sha256.toLowerCase()
			? "SHA-256"
			: cleanVerify === hashes.sha512.toLowerCase()
				? "SHA-512"
				: cleanVerify === hashes.sha1.toLowerCase()
					? "SHA-1"
					: null
		: null;

	const isMismatch = cleanVerify.length >= 8 && hashes && !matchAlgorithm;

	return (
		<div className="flex flex-col gap-6">
			{/* Mode Switcher */}
			<div className="flex border border-border bg-surface p-1">
				<button
					type="button"
					onClick={() => {
						setInputMode("file");
						setHashes(null);
					}}
					className={cn(
						"flex flex-1 cursor-pointer items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider transition-all",
						inputMode === "file"
							? "bg-foreground text-background font-semibold shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Hash className="size-3.5" />
					<span>File Checksum</span>
				</button>
				<button
					type="button"
					onClick={() => {
						setInputMode("text");
						setHashes(null);
					}}
					className={cn(
						"flex flex-1 cursor-pointer items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider transition-all",
						inputMode === "text"
							? "bg-foreground text-background font-semibold shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<FileText className="size-3.5" />
					<span>Text Hash</span>
				</button>
			</div>

			{inputMode === "file" ? (
				!file ? (
					<FileDrop
						accept="*/*"
						title="Drop any file to calculate its hash"
						hint="Installers, archives, documents, images — zero upload"
						onFiles={(files) => setFile(files[0] ?? null)}
					/>
				) : (
					<div className="flex items-center justify-between border border-border bg-surface p-4">
						<div className="flex items-center gap-3">
							<span className="grid size-10 place-items-center border border-teal-500/30 bg-teal-500/10 text-teal-400">
								<Hash className="size-5" />
							</span>
							<div>
								<p className="font-medium text-foreground">{file.name}</p>
								<p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setFile(null);
								setHashes(null);
							}}
						>
							<RotateCcw className="size-3.5" />
							<span>Change</span>
						</Button>
					</div>
				)
			) : (
				<div className="flex flex-col gap-2">
					<label htmlFor="hash-text-input" className="label-mono">Enter text to hash</label>
					<textarea
						id="hash-text-input"
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Paste or type any string, token, or secret..."
						rows={4}
						className="w-full border border-input bg-surface p-3 font-mono text-sm outline-none focus:border-foreground"
					/>
				</div>
			)}

			{/* Hashes Display Panel */}
			{hashes && (
				<div className="flex flex-col gap-4 border border-border bg-surface p-6">
					<div className="flex items-center justify-between border-b border-border pb-3">
						<h3 className="font-medium text-base">Cryptographic Digests</h3>
						<span className="font-mono text-[0.6875rem] uppercase text-subtle">
							{loading ? "Computing..." : "Computed locally"}
						</span>
					</div>

					{/* SHA-256 */}
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between text-xs font-mono text-subtle">
							<span className="font-semibold text-foreground">SHA-256 (Industry Standard)</span>
							<button
								type="button"
								onClick={() => copyToClipboard(hashes.sha256, "sha256")}
								className="flex items-center gap-1 hover:text-foreground cursor-pointer"
							>
								{copiedKey === "sha256" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
								<span>{copiedKey === "sha256" ? "Copied" : "Copy"}</span>
							</button>
						</div>
						<div className="break-all border border-input bg-background/80 p-2.5 font-mono text-xs select-all">
							{hashes.sha256}
						</div>
					</div>

					{/* SHA-512 */}
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between text-xs font-mono text-subtle">
							<span className="font-semibold text-foreground">SHA-512 (High Security)</span>
							<button
								type="button"
								onClick={() => copyToClipboard(hashes.sha512, "sha512")}
								className="flex items-center gap-1 hover:text-foreground cursor-pointer"
							>
								{copiedKey === "sha512" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
								<span>{copiedKey === "sha512" ? "Copied" : "Copy"}</span>
							</button>
						</div>
						<div className="break-all border border-input bg-background/80 p-2.5 font-mono text-xs select-all">
							{hashes.sha512}
						</div>
					</div>

					{/* SHA-1 */}
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between text-xs font-mono text-subtle">
							<span className="font-semibold text-foreground">SHA-1 (Legacy / Git)</span>
							<button
								type="button"
								onClick={() => copyToClipboard(hashes.sha1, "sha1")}
								className="flex items-center gap-1 hover:text-foreground cursor-pointer"
							>
								{copiedKey === "sha1" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
								<span>{copiedKey === "sha1" ? "Copied" : "Copy"}</span>
							</button>
						</div>
						<div className="break-all border border-input bg-background/80 p-2.5 font-mono text-xs select-all">
							{hashes.sha1}
						</div>
					</div>

					{/* Checksum Comparison Box */}
					<div className="mt-4 border-t border-border pt-4">
						<label htmlFor="verify-checksum" className="label-mono block mb-2">
							Verify against expected checksum
						</label>
						<div className="relative">
							<Input
								id="verify-checksum"
								type="text"
								value={verifyHash}
								onChange={(e) => setVerifyHash(e.target.value)}
								placeholder="Paste expected SHA-256 or SHA-512 checksum to verify..."
								className={cn(
									"pr-24 font-mono text-xs",
									matchAlgorithm && "border-emerald-500 focus:border-emerald-500",
									isMismatch && "border-rose-500 focus:border-rose-500",
								)}
							/>
							{cleanVerify && (
								<div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1.5 text-xs font-mono">
									{matchAlgorithm ? (
										<span className="flex items-center gap-1 text-emerald-400 font-medium">
											<CheckCircle2 className="size-3.5" /> {matchAlgorithm} Match
										</span>
									) : isMismatch ? (
										<span className="flex items-center gap-1 text-rose-400 font-medium">
											<XCircle className="size-3.5" /> Mismatch
										</span>
									) : null}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			<PrivacyNote
				summary="Hardware-Accelerated Client Hashing"
				detail="Hash digests are calculated locally on your CPU using browser native SHA crypto algorithms. No files or strings are transmitted over the network."
			/>
		</div>
	);
}
