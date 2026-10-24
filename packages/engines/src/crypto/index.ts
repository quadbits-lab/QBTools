/**
 * QBTools Cryptography Engine
 * 100% client-side security using the native Web Crypto API (crypto.subtle).
 * Zero server knowledge, hardware accelerated, AES-256-GCM + PBKDF2.
 */

const MAGIC = new Uint8Array([0x51, 0x42, 0x45, 0x4e]); // "QBEN" (QBTools Encrypted)
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derives an AES-GCM 256-bit key from a user passphrase and random salt.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		{ name: "PBKDF2" },
		false,
		["deriveKey"],
	);

	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt as BufferSource,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
}

export interface EncryptedFileResult {
	blob: Blob;
	filename: string;
	originalSize: number;
}

export interface DecryptedFileResult {
	blob: Blob;
	filename: string;
	type: string;
	size: number;
}

/**
 * Encrypts any File into a password-protected `.enc` file.
 * Metadata (original filename and MIME type) is encrypted within the payload
 * so zero information is leaked.
 */
export async function encryptFile(
	file: File,
	password: string,
	onProgress?: (progress: number) => void,
): Promise<EncryptedFileResult> {
	onProgress?.(0.1);
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const key = await deriveKey(password, salt);
	onProgress?.(0.3);

	const fileBuffer = await file.arrayBuffer();
	onProgress?.(0.5);

	// Pack metadata (filename, mime type) with file data before encryption
	const encoder = new TextEncoder();
	const nameBytes = encoder.encode(file.name);
	const typeBytes = encoder.encode(file.type || "application/octet-stream");

	const metaHeader = new Uint8Array(8 + nameBytes.length + typeBytes.length);
	const view = new DataView(metaHeader.buffer);
	view.setUint32(0, nameBytes.length, false);
	metaHeader.set(nameBytes, 4);
	view.setUint32(4 + nameBytes.length, typeBytes.length, false);
	metaHeader.set(typeBytes, 8 + nameBytes.length);

	// Combine header + file
	const combinedPlaintext = new Uint8Array(metaHeader.length + fileBuffer.byteLength);
	combinedPlaintext.set(metaHeader, 0);
	combinedPlaintext.set(new Uint8Array(fileBuffer), metaHeader.length);

	onProgress?.(0.7);
	const encryptedContent = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		combinedPlaintext,
	);
	onProgress?.(0.9);

	// Final container: [MAGIC 4b] + [SALT 16b] + [IV 12b] + [CIPHERTEXT + TAG]
	const container = new Uint8Array(
		MAGIC.length + SALT_LENGTH + IV_LENGTH + encryptedContent.byteLength,
	);
	container.set(MAGIC, 0);
	container.set(salt, MAGIC.length);
	container.set(iv, MAGIC.length + SALT_LENGTH);
	container.set(new Uint8Array(encryptedContent), MAGIC.length + SALT_LENGTH + IV_LENGTH);

	onProgress?.(1.0);
	return {
		blob: new Blob([container], { type: "application/octet-stream" }),
		filename: `${file.name}.enc`,
		originalSize: file.size,
	};
}

/**
 * Decrypts a `.enc` container and restores the original file with its name and MIME type.
 * Throws an Error if password is wrong or file is corrupted.
 */
export async function decryptFile(
	file: File | Blob,
	password: string,
	onProgress?: (progress: number) => void,
): Promise<DecryptedFileResult> {
	onProgress?.(0.1);
	const buffer = await file.arrayBuffer();
	const bytes = new Uint8Array(buffer);

	// Check magic
	if (bytes.length < MAGIC.length + SALT_LENGTH + IV_LENGTH) {
		throw new Error("File is too small to be a valid encrypted QBTools file.");
	}

	for (let i = 0; i < MAGIC.length; i++) {
		if (bytes[i] !== MAGIC[i]) {
			throw new Error("Invalid encrypted file format. Please select a valid .enc file.");
		}
	}

	const salt = bytes.slice(MAGIC.length, MAGIC.length + SALT_LENGTH);
	const iv = bytes.slice(MAGIC.length + SALT_LENGTH, MAGIC.length + SALT_LENGTH + IV_LENGTH);
	const ciphertext = bytes.slice(MAGIC.length + SALT_LENGTH + IV_LENGTH);

	onProgress?.(0.3);
	const key = await deriveKey(password, salt);

	onProgress?.(0.5);
	let decryptedBuffer: ArrayBuffer;
	try {
		decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
	} catch {
		throw new Error("Incorrect password or corrupted file. Verification failed.");
	}

	onProgress?.(0.8);
	const decBytes = new Uint8Array(decryptedBuffer);
	const view = new DataView(decryptedBuffer);

	const nameLen = view.getUint32(0, false);
	const decoder = new TextDecoder();
	const name = decoder.decode(decBytes.subarray(4, 4 + nameLen));

	const typeOffset = 4 + nameLen;
	const typeLen = view.getUint32(typeOffset, false);
	const type = decoder.decode(decBytes.subarray(typeOffset + 4, typeOffset + 4 + typeLen));

	const fileOffset = typeOffset + 4 + typeLen;
	const originalData = decBytes.subarray(fileOffset);

	onProgress?.(1.0);
	return {
		blob: new Blob([originalData], { type: type || "application/octet-stream" }),
		filename: name || (file instanceof File ? file.name.replace(/\.enc$/i, "") : "decrypted_file"),
		type,
		size: originalData.byteLength,
	};
}

/**
 * Encrypts a plain text string into a self-contained Base64 URL-safe ciphertext.
 */
export async function encryptText(plainText: string, password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const key = await deriveKey(password, salt);

	const encoder = new TextEncoder();
	const ciphertext = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		encoder.encode(plainText),
	);

	const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
	combined.set(salt, 0);
	combined.set(iv, SALT_LENGTH);
	combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

	// Convert to Base64
	let binary = "";
	const len = combined.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(combined[i] ?? 0);
	}
	return btoa(binary);
}

/**
 * Decrypts a Base64 ciphertext string back to clear text.
 */
export async function decryptText(cipherTextBase64: string, password: string): Promise<string> {
	let binary: string;
	try {
		binary = atob(cipherTextBase64.trim());
	} catch {
		throw new Error("Invalid encrypted text format (not valid base64).");
	}

	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	if (bytes.length < SALT_LENGTH + IV_LENGTH) {
		throw new Error("Ciphertext too short.");
	}

	const salt = bytes.slice(0, SALT_LENGTH);
	const iv = bytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
	const ciphertext = bytes.slice(SALT_LENGTH + IV_LENGTH);

	const key = await deriveKey(password, salt);
	let decrypted: ArrayBuffer;
	try {
		decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
	} catch {
		throw new Error("Incorrect password or corrupted ciphertext.");
	}

	return new TextDecoder().decode(decrypted);
}

export type HashAlgorithm = "SHA-256" | "SHA-512" | "SHA-1";

/**
 * Computes cryptographic hash digest for a File or string using native crypto.subtle.
 */
export async function computeFileHash(
	file: File | string,
	algorithm: HashAlgorithm = "SHA-256",
): Promise<string> {
	let data: BufferSource;
	if (typeof file === "string") {
		data = new TextEncoder().encode(file);
	} else {
		data = await file.arrayBuffer();
	}

	const hashBuffer = await crypto.subtle.digest(algorithm, data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes multiple common hashes simultaneously for a File.
 */
export async function computeAllHashes(
	file: File,
	onProgress?: (progress: number) => void,
): Promise<{ sha256: string; sha512: string; sha1: string }> {
	onProgress?.(0.2);
	const buffer = await file.arrayBuffer();
	onProgress?.(0.5);

	const [sha256Buf, sha512Buf, sha1Buf] = await Promise.all([
		crypto.subtle.digest("SHA-256", buffer),
		crypto.subtle.digest("SHA-512", buffer),
		crypto.subtle.digest("SHA-1", buffer),
	]);

	const toHex = (buf: ArrayBuffer) =>
		Array.from(new Uint8Array(buf))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

	onProgress?.(1.0);
	return {
		sha256: toHex(sha256Buf),
		sha512: toHex(sha512Buf),
		sha1: toHex(sha1Buf),
	};
}
