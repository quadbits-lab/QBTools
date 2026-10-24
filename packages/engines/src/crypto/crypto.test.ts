import { describe, expect, test } from "bun:test";
import {
	computeAllHashes,
	computeFileHash,
	decryptFile,
	decryptText,
	encryptFile,
	encryptText,
} from "./index";

describe("crypto engine", () => {
	test("encryptText and decryptText roundtrip", async () => {
		const secret = "Top secret message for QBTools!";
		const password = "SuperSecurePassword123!";

		const encrypted = await encryptText(secret, password);
		expect(typeof encrypted).toBe("string");
		expect(encrypted).not.toBe(secret);

		const decrypted = await decryptText(encrypted, password);
		expect(decrypted).toBe(secret);
	});

	test("decryptText fails with invalid password", async () => {
		const secret = "Classified data";
		const encrypted = await encryptText(secret, "CorrectPassword");

		expect(decryptText(encrypted, "WrongPassword")).rejects.toThrow();
	});

	test("encryptFile and decryptFile roundtrip", async () => {
		const content = new TextEncoder().encode("Hello world file encryption");
		const file = new File([content], "test.txt", { type: "text/plain" });
		const password = "FileEncryptionKey999!";

		const encrypted = await encryptFile(file, password);
		expect(encrypted.blob).toBeInstanceOf(Blob);
		expect(encrypted.filename).toBe("test.txt.enc");

		const decrypted = await decryptFile(encrypted.blob, password);
		expect(decrypted.filename).toBe("test.txt");
		expect(decrypted.type).toContain("text/plain");

		const decryptedText = await decrypted.blob.text();
		expect(decryptedText).toBe("Hello world file encryption");
	});

	test("decryptFile rejects corrupt or invalid files", async () => {
		const bogusData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
		const bogusBlob = new Blob([bogusData]);

		expect(decryptFile(bogusBlob, "SomePassword")).rejects.toThrow(
			"File is too small to be a valid encrypted QBTools file.",
		);
	});

	test("computeFileHash produces valid SHA digests", async () => {
		const content = new TextEncoder().encode("Hello hashing");
		const file = new File([content], "hash.txt", { type: "text/plain" });

		const sha256 = await computeFileHash(file, "SHA-256");
		expect(sha256).toMatch(/^[a-f0-9]{64}$/);

		const sha512 = await computeFileHash(file, "SHA-512");
		expect(sha512).toMatch(/^[a-f0-9]{128}$/);

		const sha1 = await computeFileHash(file, "SHA-1");
		expect(sha1).toMatch(/^[a-f0-9]{40}$/);

		const all = await computeAllHashes(file);
		expect(all.sha256).toBe(sha256);
		expect(all.sha512).toBe(sha512);
		expect(all.sha1).toBe(sha1);
	});
});
