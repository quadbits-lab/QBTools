import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { cn } from "@qbtools/ui/utils";
import {
	Check,
	CheckCircle2,
	Copy,
	Eye,
	EyeOff,
	Lock,
	RotateCcw,
	ShieldAlert,
	Unlock,
} from "lucide-react";
import { useState } from "react";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";

export default function TextEncryptor() {
	const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
	const [input, setInput] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [output, setOutput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		if (!output) return;
		try {
			await navigator.clipboard.writeText(output);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// Clipboard API blocked
		}
	};

	const run = async () => {
		if (!input.trim()) {
			setError(
				mode === "encrypt"
					? "Please enter text to encrypt."
					: "Please paste ciphertext to decrypt.",
			);
			return;
		}
		if (!password.trim()) {
			setError("Please enter a passphrase.");
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const cryptoEngine = await import("@qbtools/engines/crypto");
			if (mode === "encrypt") {
				const res = await cryptoEngine.encryptText(input, password);
				setOutput(res);
			} else {
				const res = await cryptoEngine.decryptText(input, password);
				setOutput(res);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Cryptographic operation failed.");
			setOutput("");
		} finally {
			setLoading(false);
		}
	};

	const reset = () => {
		setInput("");
		setPassword("");
		setOutput("");
		setError(null);
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Mode Switcher */}
			<div className="flex border border-border bg-surface p-1">
				<button
					type="button"
					onClick={() => {
						setMode("encrypt");
						setOutput("");
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
					<span>Encrypt Message</span>
				</button>
				<button
					type="button"
					onClick={() => {
						setMode("decrypt");
						setOutput("");
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
					<span>Decrypt Message</span>
				</button>
			</div>

			<div className="flex flex-col gap-5 border border-border bg-surface p-6">
				{/* Input Text Area */}
				<div className="flex flex-col gap-2">
					<label htmlFor="secret-text-input" className="label-mono">
						{mode === "encrypt" ? "Secret Message / Plain Text" : "Paste Encrypted Ciphertext"}
					</label>
					<textarea
						id="secret-text-input"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder={
							mode === "encrypt"
								? "Enter confidential note, password, recovery phrase, or message..."
								: "Paste the Base64 ciphertext here..."
						}
						rows={5}
						className="w-full border border-input bg-background/80 p-3 font-mono text-sm outline-none focus:border-foreground"
					/>
				</div>

				{/* Passphrase Input */}
				<div className="flex flex-col gap-2">
					<label
						htmlFor="secret-passphrase"
						className="flex items-center justify-between font-mono text-xs uppercase text-subtle"
					>
						<span>Passphrase</span>
					</label>
					<div className="relative">
						<Input
							id="secret-passphrase"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter encryption passphrase..."
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
				</div>

				{error && (
					<Notice tone="critical">
						<div className="flex items-center gap-2">
							<ShieldAlert className="size-4" />
							<span>{error}</span>
						</div>
					</Notice>
				)}

				<div className="flex gap-3">
					<Button
						size="lg"
						onClick={run}
						disabled={loading || !input.trim() || !password.trim()}
						className="flex-1 font-mono text-xs uppercase tracking-wider"
					>
						{loading ? "Processing..." : mode === "encrypt" ? "Encrypt Note" : "Decrypt Note"}
					</Button>
					<Button variant="outline" size="lg" onClick={reset}>
						<RotateCcw className="size-4" />
					</Button>
				</div>

				{/* Output Panel */}
				{output && (
					<div className="mt-2 flex flex-col gap-3 border border-teal-500/30 bg-teal-500/10 p-5">
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-2 text-xs font-mono text-teal-400 font-semibold uppercase">
								<CheckCircle2 className="size-4" />
								{mode === "encrypt" ? "Ciphertext Output" : "Decrypted Secret Note"}
							</span>
							<button
								type="button"
								onClick={handleCopy}
								className="flex items-center gap-1.5 text-xs font-mono text-foreground hover:underline cursor-pointer"
							>
								{copied ? (
									<Check className="size-3.5 text-emerald-400" />
								) : (
									<Copy className="size-3.5" />
								)}
								<span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
							</button>
						</div>

						<textarea
							readOnly
							value={output}
							rows={4}
							className="w-full border border-teal-500/30 bg-background/90 p-3 font-mono text-xs select-all outline-none"
						/>
					</div>
				)}
			</div>

			<PrivacyNote text="Client-Side Encryption — Text encrypted in browser memory with AES-256-GCM. 0 bytes uploaded." />
		</div>
	);
}
