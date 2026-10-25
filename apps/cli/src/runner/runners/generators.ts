/** Generator runners: password, QR code, invoice PDF. */

import {
	estimateEntropy,
	generatePassphrase,
	generatePassword,
	passphraseEntropy,
	passwordPoolSize,
	strengthFromEntropy,
} from "@qbtools/engines/generators";
import QRCode from "qrcode";
import { bool, num, requireString, str, type RunnerContext, type ToolRunner } from "../types";

export const passwordGenerator: ToolRunner = {
	slug: "password-generator",
	availability: "local",
	fields: [
		{
			name: "kind",
			label: "Style",
			kind: "select",
			default: "password",
			options: [
				{ label: "Random characters", value: "password" },
				{ label: "Passphrase", value: "passphrase" },
			],
		},
		{ name: "length", label: "Password length", kind: "number", default: 16, min: 6, max: 128 },
		{ name: "words", label: "Passphrase words", kind: "number", default: 4, min: 3, max: 12 },
		{ name: "separator", label: "Passphrase separator", kind: "text", default: "-" },
		{ name: "lowercase", label: "Include lowercase", kind: "boolean", default: true },
		{ name: "uppercase", label: "Include uppercase", kind: "boolean", default: true },
		{ name: "digits", label: "Include digits", kind: "boolean", default: true },
		{ name: "symbols", label: "Include symbols", kind: "boolean", default: true },
		{ name: "excludeAmbiguous", label: "Exclude ambiguous characters", kind: "boolean", default: true },
		{ name: "capitalize", label: "Capitalize passphrase words", kind: "boolean", default: true },
		{ name: "includeNumber", label: "Add a number to the passphrase", kind: "boolean", default: true },
		{ name: "count", label: "How many to generate", kind: "number", default: 1, min: 1, max: 50 },
	],
	async run({ values }) {
		const kind = str(values, "kind", "password");
		const count = Math.min(50, Math.max(1, Math.round(num(values, "count", 1))));
		const results: string[] = [];
		if (kind === "passphrase") {
			const options = {
				words: num(values, "words", 4),
				separator: str(values, "separator", "-") || "-",
				capitalize: bool(values, "capitalize", true),
				includeNumber: bool(values, "includeNumber", true),
			};
			for (let i = 0; i < count; i++) results.push(generatePassphrase(options));
			const entropy = passphraseEntropy(options);
			return {
				summary: `${count} passphrase${count > 1 ? "s" : ""} · ~${Math.round(entropy)} bits of entropy`,
				outputs: [{ type: "code", text: results.join("\n") }],
				data: { passwords: results, entropyBits: entropy },
			};
		}
		const options = {
			length: num(values, "length", 16),
			lowercase: bool(values, "lowercase", true),
			uppercase: bool(values, "uppercase", true),
			digits: bool(values, "digits", true),
			symbols: bool(values, "symbols", true),
			excludeAmbiguous: bool(values, "excludeAmbiguous", true),
		};
		for (let i = 0; i < count; i++) results.push(generatePassword(options));
		const strength = strengthFromEntropy(estimateEntropy(results[0] ?? ""));
		return {
			summary: `${count} password${count > 1 ? "s" : ""} · ${strength.label} (~${Math.round(strength.entropyBits)} bits)`,
			outputs: [
				{ type: "code", text: results.join("\n") },
				{
					type: "table",
					columns: ["Metric", "Value"],
					rows: [
						["Strength", `${strength.label} (${strength.score}/4)`],
						["Entropy", `${Math.round(strength.entropyBits)} bits`],
						["Offline crack time", strength.crackTime],
						["Character pool", String(passwordPoolSize(options))],
					],
				},
			],
			data: { passwords: results, strength },
		};
	},
};

export const qrCodeGenerator: ToolRunner = {
	slug: "qr-code-generator",
	availability: "local",
	fields: [
		{
			name: "kind",
			label: "Payload",
			kind: "select",
			default: "text",
			options: [
				{ label: "Plain text", value: "text" },
				{ label: "URL", value: "url" },
				{ label: "Wi-Fi", value: "wifi" },
			],
		},
		{ name: "text", label: "Text / URL", kind: "textarea" },
		{ name: "ssid", label: "Wi-Fi network name", kind: "text" },
		{ name: "wifiPassword", label: "Wi-Fi password", kind: "text" },
		{
			name: "encryption",
			label: "Wi-Fi security",
			kind: "select",
			default: "WPA",
			options: [
				{ label: "WPA/WPA2/WPA3", value: "WPA" },
				{ label: "WEP", value: "WEP" },
				{ label: "None", value: "nopass" },
			],
		},
		{ name: "format", label: "Output format", kind: "select", default: "png", options: [
			{ label: "PNG image", value: "png" },
			{ label: "SVG vector", value: "svg" },
		] },
		{ name: "width", label: "PNG width (px)", kind: "number", default: 512, min: 128, max: 2048 },
	],
	async run(ctx: RunnerContext) {
		const { values, outDir, outPath } = ctx;
		const kind = str(values, "kind", "text");
		let payload: string;
		if (kind === "wifi") {
			const ssid = requireString(values, "ssid", "Wi-Fi network name");
			payload = `WIFI:T:${str(values, "encryption", "WPA")};S:${ssid.replace(/([;,:"])/g, "\\$1")};P:${str(values, "wifiPassword").replace(/([;,:"])/g, "\\$1")};;`;
		} else if (kind === "url") {
			const raw = requireString(values, "text", "URL");
			payload = /^[a-z][a-z0-9+.-]*:/i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
		} else {
			payload = requireString(values, "text", "text");
		}
		const format = str(values, "format", "png");
		if (format === "svg") {
			const svg = await QRCode.toString(payload, { type: "svg", margin: 1 });
			return {
				summary: "QR code (SVG)",
				outputs: [{ type: "text", text: svg }],
				data: { payload },
			};
		}
		const width = Math.min(2048, Math.max(128, Math.round(num(values, "width", 512))));
		const buffer = await QRCode.toBuffer(payload, {
			type: "png",
			width,
			margin: 1,
			errorCorrectionLevel: "M",
		});
		const stem = payload.replace(/[^a-z0-9]+/gi, "-").slice(0, 32).replace(/^-+|-+$/g, "") || "qr";
		const name = `${stem || "qr"}.png`;
		const { writeOutput } = await import("../files");
		const saved = await writeOutput({ outDir, outPath, suggestedName: name }, buffer);
		return {
			summary: `QR code saved to ${saved.path}`,
			outputs: [
				{ type: "image", bytes: buffer, mimeType: "image/png", suggestedName: name },
			],
			data: { payload, path: saved.path },
		};
	},
};

export const invoiceGenerator: ToolRunner = {
	slug: "invoice-generator",
	availability: "local",
	fields: [
		{ name: "number", label: "Invoice number", kind: "text", default: "INV-001" },
		{ name: "from", label: "From (sender name)", kind: "text", required: true },
		{ name: "to", label: "To (client name)", kind: "text", required: true },
		{
			name: "items",
			label: "Line items as description:quantity:unitPrice, semicolon separated",
			kind: "textarea",
			required: true,
			placeholder: "Design work:10:95; Hosting:1:30",
		},
		{ name: "currency", label: "Currency code", kind: "text", default: "USD" },
		{ name: "taxRate", label: "Tax rate (%)", kind: "number", default: 0, min: 0, max: 100 },
		{ name: "discount", label: "Discount", kind: "number", default: 0 },
		{
			name: "discountType",
			label: "Discount type",
			kind: "select",
			default: "percent",
			options: [
				{ label: "Percent", value: "percent" },
				{ label: "Fixed amount", value: "amount" },
			],
		},
		{ name: "dueDays", label: "Payment due (days from today)", kind: "number", default: 14 },
	],
	async run({ values, outDir, outPath }) {
		const { renderInvoicePdf } = await import("@qbtools/engines/invoice-pdf");
		const { invoiceTotals } = await import("@qbtools/engines/generators");
		const raw = requireString(values, "items", "line items");
		const items = raw
			.split(";")
			.map((part) => part.trim())
			.filter(Boolean)
			.map((entry) => {
				const [description = "", quantity = "1", unitPrice = "0"] = entry.split(":");
				const qty = Number(quantity);
				const price = Number(unitPrice);
				if (!description.trim() || !Number.isFinite(qty) || !Number.isFinite(price)) {
					throw new Error(`Couldn't parse "${entry}" — use description:quantity:unitPrice`);
				}
				return { description: description.trim(), quantity: qty, unitPrice: price };
			});
		if (!items.length) throw new Error("Add at least one line item.");
		const today = new Date();
		const due = new Date(today.getTime() + num(values, "dueDays", 14) * 86_400_000);
		const iso = (date: Date) => date.toISOString().slice(0, 10);
		const invoice = {
			number: str(values, "number", "INV-001") || "INV-001",
			issueDate: iso(today),
			dueDate: iso(due),
			currency: (str(values, "currency", "USD") || "USD").toUpperCase(),
			from: { name: requireString(values, "from", "sender"), details: "" },
			to: { name: requireString(values, "to", "client"), details: "" },
			items,
			taxLabel: "Tax",
			taxRate: num(values, "taxRate", 0),
			discount: num(values, "discount", 0),
			discountType: (str(values, "discountType", "percent") === "amount"
				? "amount"
				: "percent") as "percent" | "amount",
			notes: "",
			accent: "#111111",
		};
		const totals = invoiceTotals(invoice);
		const bytes = await renderInvoicePdf(invoice);
		const { writeOutput } = await import("../files");
		const name = `${invoice.number.replace(/[^\w-]+/g, "-")}.pdf`;
		const saved = await writeOutput(
			{ outDir, outPath, suggestedName: name },
			bytes as Uint8Array,
		);
		return {
			summary: `Invoice ${invoice.number} — total ${totals.total.toFixed(2)} ${invoice.currency} → ${saved.path}`,
			outputs: [
				{
					type: "table",
					columns: ["Total", "Value"],
					rows: [
						["Subtotal", totals.subtotal.toFixed(2)],
						["Discount", totals.discount.toFixed(2)],
						["Tax", totals.tax.toFixed(2)],
						["Total", totals.total.toFixed(2)],
					],
				},
			],
			data: { totals, path: saved.path },
		};
	},
};

export const generatorRunners: ToolRunner[] = [passwordGenerator, qrCodeGenerator, invoiceGenerator];
