import type { Category, CategoryId } from "./types";

export const categories: Category[] = [
	{
		id: "image",
		name: "Image tools",
		plural: "image tools",
		tagline: "Shrink, resize, convert and clean up photos.",
		description:
			"Free image tools that run in your browser: compress photos to an exact size, resize for any form or social network, convert between JPG, PNG and WebP, and remove backgrounds.",
		icon: "image",
	},
	{
		id: "pdf",
		name: "PDF tools",
		plural: "PDF tools",
		tagline: "Merge, split, shrink and create PDFs.",
		description:
			"Free PDF tools with no upload: merge several PDFs, split pages out, compress big files for email, and turn photos into a PDF.",
		icon: "file-text",
	},
	{
		id: "text",
		name: "Text tools",
		plural: "text tools",
		tagline: "Count, convert and polish your writing.",
		description:
			"Free text tools: count words and characters, change letter case, and fix grammar or rephrase sentences with an AI helper.",
		icon: "type",
	},
	{
		id: "calculators",
		name: "Calculators",
		plural: "calculators",
		tagline: "Quick answers for money, school and health.",
		description:
			"Free online calculators for age, loan EMI, percentages, GPA and BMI, with clear step-by-step results.",
		icon: "calculator",
	},
	{
		id: "generators",
		name: "Generators",
		plural: "generators",
		tagline: "Make QR codes, passwords, invoices and signatures.",
		description:
			"Free generators: create QR codes, strong passwords, professional invoices and handwritten-style signatures in seconds.",
		icon: "sparkles",
	},
	{
		id: "media",
		name: "Media tools",
		plural: "media tools",
		tagline: "Shrink videos, trim audio, design thumbnails.",
		description:
			"Free media tools that work on your device: compress videos for sharing, trim audio clips and design YouTube thumbnails.",
		icon: "clapperboard",
	},
	{
		id: "security",
		name: "Security & Encryption",
		plural: "security tools",
		tagline: "Encrypt files, verify hashes, protect private data.",
		description:
			"Free client-side encryption and security tools: protect documents with AES-256 passwords, compute SHA-256 hashes, and encrypt private notes.",
		icon: "shield-check",
	},
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<
	CategoryId,
	Category
>;

export function isCategoryId(value: string): value is CategoryId {
	return value in categoryById;
}
