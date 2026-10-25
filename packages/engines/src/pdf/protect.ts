import { LIMITS, type ProcessingOptions, progress } from "../processing";
import { getQpdf, runQpdf, stageInput } from "./qpdf";

export type ProtectMode = "protect" | "unlock";
export interface ProtectRequest {
	file: File;
	mode: ProtectMode;
	password: string;
}
/** PDF 2.0 (AES-256) passwords are limited to 127 UTF-8 bytes. */
export const MAX_PASSWORD_BYTES = 127;
export function validatePassword(password: string) {
	if (!password) throw new Error("Enter a password.");
	if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES)
		throw new Error("Use a password of 127 bytes or fewer.");
}
/** Arguments are passed as an array, so passwords never meet a shell. */
export function qpdfArgs(mode: ProtectMode, password: string, input: string, output: string) {
	return mode === "protect"
		? ["--encrypt", password, password, "256", "--", input, output]
		: [`--password=${password}`, "--decrypt", input, output];
}
/** The trailer (or xref stream dictionary) of an encrypted PDF references an Encrypt dictionary. */
export const hasEncryptEntry = (text: string) => /\/Encrypt\s+\d+\s+\d+\s+R/.test(text);
async function isEncrypted(file: File) {
	const edge = 64 * 1024;
	if (hasEncryptEntry(await file.slice(0, edge).text())) return true;
	return file.size > edge && hasEncryptEntry(await file.slice(file.size - edge).text());
}
/** Must run in a dedicated worker: qpdf.callMain is synchronous. */
export async function protectPdf(
	request: ProtectRequest,
	options: ProcessingOptions = {},
): Promise<Blob> {
	const { file, mode, password } = request;
	if (file.size > LIMITS.pdfBytes) throw new Error("This tool supports PDFs up to 100 MiB.");
	validatePassword(password);
	progress(options, "Loading PDF engine…", null, "loading");
	const qpdf = await getQpdf();
	progress(options, mode === "protect" ? "Encrypting PDF…" : "Removing password…");
	let mounted = false;
	try {
		mounted = await stageInput(qpdf, file);
		if (mode === "unlock") {
			// Exit 3 means the file is encrypted and this password opens it. qpdf reports 2 for
			// both a wrong password and an unencrypted file, so tell those apart by hand.
			const check = runQpdf(qpdf, [
				"--requires-password",
				`--password=${password}`,
				"/input/source.pdf",
			]);
			if (check !== 3) {
				if (await isEncrypted(file)) throw new Error("That password is incorrect.");
				throw new Error("This PDF isn't password-protected.");
			}
		}
		const code = runQpdf(qpdf, qpdfArgs(mode, password, "/input/source.pdf", "/output.pdf"));
		if (code !== 0 && code !== 3)
			throw new Error(
				mode === "protect"
					? "This PDF couldn't be protected. It may be damaged or already password-protected."
					: "This PDF couldn't be unlocked. It may be damaged.",
			);
		const bytes = qpdf.FS.readFile("/output.pdf").slice();
		if (bytes.length < 8 || String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-")
			throw new Error("The result failed validation. Keep your original.");
		progress(options, "PDF ready", 1);
		return new Blob([bytes as BlobPart], { type: "application/pdf" });
	} finally {
		if (mounted) qpdf.FS.unmount("/input");
		try {
			qpdf.FS.unlink("/output.pdf");
		} catch {
			/* No output on failure. */
		}
	}
}
