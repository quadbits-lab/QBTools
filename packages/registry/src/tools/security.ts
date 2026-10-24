import type { ToolDef } from "../types";

export const securityTools: ToolDef[] = [
	{
		slug: "file-encryptor",
		category: "security",
		name: "File Encryptor",
		title: "File Encryptor & Decryptor — Free Client-Side AES-256",
		tagline: "Lock and protect any file with military-grade AES-256 encryption.",
		description:
			"Encrypt and decrypt PDF, images, ZIP and sensitive documents in your browser. Secured with AES-256-GCM and PBKDF2 — 100% private, no server upload.",
		icon: "lock",
		keywords: [
			"file encryptor",
			"encrypt file online",
			"aes 256 encryption",
			"password protect file",
			"decrypt file",
			"client side encryption",
		],
		howTo: [
			{ title: "Select a file", text: "Drop any file you wish to secure." },
			{ title: "Set a password", text: "Enter a strong passphrase to derive the AES key." },
			{
				title: "Download encrypted file",
				text: "Save the tamper-proof .enc file. Decrypt it anytime with your password.",
			},
		],
		about: {
			what: "The File Encryptor uses AES-256-GCM authenticated encryption paired with PBKDF2 key derivation (100,000 iterations). Your file and its metadata are encrypted in browser memory, never touching any remote server.",
			when: [
				"Sending sensitive documents, tax forms, or contracts via email or cloud storage.",
				"Storing confidential records on shared or public USB drives.",
				"Ensuring only someone with the exact password can read the file.",
			],
		},
		faqs: [
			{
				q: "Can QBTools or a hacker decrypt my file without the password?",
				a: "No. AES-256-GCM is mathematically infeasible to brute-force when paired with a strong passphrase. QBTools never sees your file or password.",
			},
			{
				q: "What happens if I lose my password?",
				a: "Because this is true zero-knowledge encryption, files cannot be recovered without the correct password. Keep your passphrase safe.",
			},
			{
				q: "Does it work with any file type?",
				a: "Yes. PDF, images, video, ZIP, documents, and spreadsheets can all be encrypted.",
			},
		],
		related: ["text-encryptor", "hash-generator", "password-generator"],
		runtime: "browser",
		popular: 16,
		isNew: true,
	},
	{
		slug: "hash-generator",
		category: "security",
		name: "Hash & Checksum",
		title: "Hash Generator & Checksum Verifier — SHA-256, SHA-512 & MD5",
		tagline: "Generate cryptographic hashes and verify file integrity.",
		description:
			"Calculate SHA-256, SHA-512, and SHA-1 checksums for files and text. Paste expected hash to instantly verify download integrity and detect tampering.",
		icon: "hash",
		keywords: [
			"hash generator",
			"sha256 checksum",
			"verify checksum",
			"file hash verifier",
			"sha512 generator",
			"file integrity checker",
		],
		howTo: [
			{ title: "Choose input", text: "Upload a file or enter text to hash." },
			{
				title: "View hashes",
				text: "Calculate SHA-256, SHA-512 and SHA-1, with optional BLAKE3 and SHA3-256.",
			},
			{
				title: "Verify checksum",
				text: "Paste an expected hash to check if the file matches exactly.",
			},
		],
		about: {
			what: "A cryptographic hash generates a unique, fixed-length fingerprint of digital content. Even a one-bit modification changes the resulting hash completely.",
			when: [
				"Verifying software installers and downloads match official checksums.",
				"Confirming files were not corrupted during transfer or storage.",
				"Generating deterministic unique IDs for content verification.",
			],
		},
		faqs: [
			{
				q: "Is my file uploaded to calculate the hash?",
				a: "No. Hashing runs locally in a worker and reads files in small chunks. SHA-256, SHA-512, SHA-1, BLAKE3 and SHA3-256 are available.",
			},
			{
				q: "Which hash algorithm should I use?",
				a: "SHA-256 is the modern standard for file verification and digital integrity. SHA-512 offers even higher collision resistance.",
			},
		],
		related: ["file-encryptor", "text-encryptor", "password-generator"],
		runtime: "browser",
		isNew: true,
	},
	{
		slug: "text-encryptor",
		category: "security",
		name: "Text Encryptor",
		title: "Secret Text Encryptor — Password Protect Messages Online",
		tagline: "Encrypt confidential text notes and messages with AES-GCM.",
		description:
			"Encrypt sensitive text, passwords, and private messages with a password. Generates secure ciphertext that can only be decrypted with your key.",
		icon: "key-round",
		keywords: [
			"text encryptor",
			"encrypt message",
			"secret note encryptor",
			"password protect text",
			"aes text encryption",
		],
		howTo: [
			{ title: "Write your note", text: "Type or paste your secret text." },
			{ title: "Enter passphrase", text: "Provide a password to encrypt the message." },
			{
				title: "Copy ciphertext",
				text: "Send the encrypted text safely via chat, email, or notes.",
			},
		],
		about: {
			what: "Text Encryptor uses AES-GCM 256-bit encryption to scramble your private notes into Base64 ciphertext. Only recipients who know your password can decrypt it.",
			when: [
				"Sharing sensitive credentials, API keys, or recovery phrases over Slack or WhatsApp.",
				"Keeping private notes safe in unencrypted document apps.",
				"Secure communication without storing plain text in history.",
			],
		},
		faqs: [
			{
				q: "Can communication platforms read my encrypted message?",
				a: "No. Third-party apps and servers only see meaningless scrambled ciphertext.",
			},
			{
				q: "Is the decryption process safe?",
				a: "Yes. Decryption happens purely in your browser memory.",
			},
		],
		related: ["file-encryptor", "hash-generator", "password-generator"],
		runtime: "browser",
		isNew: true,
	},
];
