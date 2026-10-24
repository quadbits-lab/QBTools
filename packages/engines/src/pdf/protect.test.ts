import { expect, test } from "bun:test";
import { LIMITS } from "../processing";
import {
	hasEncryptEntry,
	MAX_PASSWORD_BYTES,
	protectPdf,
	qpdfArgs,
	validatePassword,
} from "./protect";

function oversized(size: number) {
	const file = new File([], "oversized.pdf");
	Object.defineProperty(file, "size", { value: size });
	file.arrayBuffer = () => {
		throw new Error("Input should not be read");
	};
	return file;
}
test("protect uses AES-256 and keeps the password as a single argument", () => {
	expect(qpdfArgs("protect", "a b;rm -rf", "in.pdf", "out.pdf")).toEqual([
		"--encrypt",
		"a b;rm -rf",
		"a b;rm -rf",
		"256",
		"--",
		"in.pdf",
		"out.pdf",
	]);
});
test("unlock passes the password and requests decryption", () => {
	expect(qpdfArgs("unlock", "secret", "in.pdf", "out.pdf")).toEqual([
		"--password=secret",
		"--decrypt",
		"in.pdf",
		"out.pdf",
	]);
});
test("passwords are validated by encoded byte length", () => {
	expect(() => validatePassword("")).toThrow("Enter a password");
	expect(() => validatePassword("a".repeat(MAX_PASSWORD_BYTES))).not.toThrow();
	expect(() => validatePassword("a".repeat(MAX_PASSWORD_BYTES + 1))).toThrow("127 bytes");
	expect(() => validatePassword("é".repeat(64))).toThrow("127 bytes");
});
test("oversized files are rejected before reading or loading the engine", async () => {
	await expect(
		protectPdf({ file: oversized(LIMITS.pdfBytes + 1), mode: "protect", password: "x" }),
	).rejects.toThrow("100 MiB");
});
test("detects an Encrypt reference in a trailer", () => {
	expect(hasEncryptEntry("trailer\n<< /Size 6 /Root 1 0 R /Encrypt 5 0 R /ID [<a><a>] >>")).toBe(
		true,
	);
	expect(hasEncryptEntry("trailer\n<< /Size 6 /Root 1 0 R >>")).toBe(false);
});
