import { downloadBlob } from "@qbtools/engines/files";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Progress } from "@qbtools/ui/progress";
import { cn, formatBytes } from "@qbtools/ui/utils";
import {
	CheckCircle2,
	Download,
	Eye,
	EyeOff,
	FileDown,
	FileUp,
	Lock,
	RotateCcw,
	ShieldAlert,
	Unlock,
} from "lucide-react";
import { useState } from "react";
import { FileDrop } from "#/components/kit/file-drop";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { SaveToMedia } from "#/components/kit/save-to-media";

export default function FileEncryptor() {
	const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
	const [file, setFile] = useState<File | null>(null);
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<{ blob: Blob; filename: string; size: number } | null>(null);

	const handleFiles = (files: File[]) => {
		const f = files[0];
		if (!f) return;
		setFile(f);
		setResult(null);
		setError(null);
		// Auto-switch mode based on file extension
		if (f.name.toLowerCase().endsWith(".enc")) {
			setMode("decrypt");
		} else {
			setMode("encrypt");
		}
	};

	const reset = () => {
		setFile(null);
		setPassword("");
		setResult(null);
		setError(null);
		setProgress(null);
	};

	const run = async () => {
		if (!file) return;
		if (!password.trim()) {
			setError("Please enter a passphrase.");
			return;
		}

		setLoading(true);
		setError(null);
		setProgress(0.1);

		try {
			const cryptoEngine = await import("@qbtools/engines/crypto");
			if (mode === "encrypt") {
				const res = await cryptoEngine.encryptFile(file, password, (p) => setProgress(p));
				setResult({
					blob: res.blob,
					filename: res.filename,
					size: res.blob.size,
				});
			} else {
				const res = await cryptoEngine.decryptFile(file, password, (p) => setProgress(p));
				setResult({
					blob: res.blob,
					filename: res.filename,
					size: res.size,
				});
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Cryptographic operation failed.");
		} finally {
			setLoading(false);
			setProgress(null);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Mode Switcher Tabs */}
			<div className="flex border border-border bg-surface p-1">
				<button
					type="button"
					onClick={() => {
						setMode("encrypt");
						setResult(null);
						setError(null);
					}}
					className={cn(
						"flex flex-1 cursor-pointer items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider transition-all",
						mode === "encrypt"
							? "bg-foreground text-background font-semibold shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Lock className="size-3.5" />
					<span>Encrypt File</span>
				</button>
				<button
					type="button"
					onClick={() => {
						setMode("decrypt");
						setResult(null);
						setError(null);
					}}
					className={cn(
						"flex flex-1 cursor-pointer items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider transition-all",
						mode === "decrypt"
							? "bg-foreground text-background font-semibold shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Unlock className="size-3.5" />
					<span>Decrypt File</span>
				</button>
			</div>

			{!file ? (
				<FileDrop
					accept="*/*"
					title={mode === "encrypt" ? "Drop any file to encrypt" : "Drop an encrypted .enc file"}
					hint={
						mode === "encrypt"
							? "PDF, photos, ZIP, audio, documents — all files supported"
							: "Select the .enc file you previously encrypted with QBTools"
					}
					onFiles={handleFiles}
				/>
			) : (
				<div className="flex flex-col gap-5 border border-border bg-surface p-6">
					{/* Selected File Details */}
					<div className="flex items-center justify-between border-b border-border pb-4">
						<div className="flex items-center gap-3">
							<span className="grid size-10 place-items-center border border-border bg-muted/60 text-foreground">
								{mode === "encrypt" ? (
									<FileUp className="size-5" />
								) : (
									<FileDown className="size-5" />
								)}
							</span>
							<div>
								<p className="font-medium text-foreground">{file.name}</p>
								<p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
							</div>
						</div>
						<Button variant="ghost" size="sm" onClick={reset} disabled={loading}>
							<RotateCcw className="size-3.5" />
							<span>Change</span>
						</Button>
					</div>

					{/* Passphrase Input */}
					<div className="flex flex-col gap-2">
						<label
							htmlFor="passphrase"
							className="flex items-center justify-between font-mono text-xs uppercase text-subtle"
						>
							<span>
								{mode === "encrypt" ? "Set Encryption Passphrase" : "Enter Decryption Passphrase"}
							</span>
							{mode === "encrypt" && password.length > 0 && (
								<span
									className={cn(
										"text-[0.625rem]",
										password.length >= 12
											? "text-foreground font-semibold"
											: password.length >= 8
												? "text-muted-foreground"
												: "text-subtle",
									)}
								>
									{password.length >= 12 ? "Strong" : password.length >= 8 ? "Moderate" : "Weak"}
								</span>
							)}
						</label>

						<div className="relative">
							<Input
								id="passphrase"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter secret password..."
								disabled={loading}
								className="pr-10"
								onKeyDown={(e) => {
									if (e.key === "Enter" && !loading) void run();
								}}
							/>
							<button
								type="button"
								onClick={() => setShowPassword((v) => !v)}
								className="absolute top-1/2 right-3 -translate-y-1/2 text-subtle hover:text-foreground cursor-pointer"
								tabIndex={-1}
							>
								{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
							</button>
						</div>

						{mode === "encrypt" && (
							<p className="text-xs text-muted-foreground">
								⚠️ Remember this passphrase. There is no password recovery or backdoor.
							</p>
						)}
					</div>

					{/* Progress Indicator */}
					{progress !== null && (
						<Progress
							value={progress * 100}
							label={mode === "encrypt" ? "Encrypting file" : "Decrypting file"}
						/>
					)}

					{/* Error Alert */}
					{error && (
						<Notice tone="critical">
							<div className="flex items-center gap-2">
								<ShieldAlert className="size-4" />
								<span>{error}</span>
							</div>
						</Notice>
					)}

					{/* Action Buttons */}
					{!result && (
						<Button
							size="lg"
							onClick={run}
							disabled={loading || !password.trim()}
							className="mt-2 w-full font-mono text-xs uppercase tracking-wider"
						>
							{loading ? (
								"Processing..."
							) : mode === "encrypt" ? (
								<>
									<Lock className="size-4" /> Encrypt File (AES-256)
								</>
							) : (
								<>
									<Unlock className="size-4" /> Decrypt File
								</>
							)}
						</Button>
					)}

					{/* Result Download Panel */}
					{result && (
						<div className="mt-2 flex flex-col gap-4 border border-border bg-muted/40 p-5">
							<div className="flex items-center gap-2.5 text-foreground">
								<CheckCircle2 className="size-5" />
								<span className="font-medium text-sm">
									{mode === "encrypt"
										? "File successfully encrypted!"
										: "File successfully decrypted!"}
								</span>
							</div>

							<div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
								<span className="truncate text-foreground font-medium">{result.filename}</span>
								<span className="text-muted-foreground">{formatBytes(result.size)}</span>
							</div>

							<Button
								size="lg"
								onClick={() => downloadBlob(result.blob, result.filename)}
								className="w-full font-medium"
							>
								<Download className="size-4" /> Download {result.filename}
							</Button>
						</div>
					)}
				</div>
			)}

			{result && <SaveToMedia blob={result.blob} name={result.filename} />}
			<PrivacyNote text="100% Zero-Knowledge Encryption — AES-256-GCM and PBKDF2 executed on your device. Nothing uploads unless you choose Save to Media." />
		</div>
	);
}
