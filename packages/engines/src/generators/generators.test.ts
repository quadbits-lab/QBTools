import { describe, expect, test } from "bun:test";
import {
	estimateEntropy,
	generatePassphrase,
	generatePassword,
	invoiceTotals,
	passphraseEntropy,
	passwordPoolSize,
	secureRandomInt,
	strengthFromEntropy,
	vcardPayload,
	wifiPayload,
} from "./index";

const all = {
	length: 20,
	lowercase: true,
	uppercase: true,
	digits: true,
	symbols: true,
	excludeAmbiguous: false,
};

describe("password", () => {
	test("length and every chosen class present", () => {
		for (let i = 0; i < 200; i++) {
			const pw = generatePassword(all);
			expect(pw).toHaveLength(20);
			expect(pw).toMatch(/[a-z]/);
			expect(pw).toMatch(/[A-Z]/);
			expect(pw).toMatch(/\d/);
			expect(pw).toMatch(/[^a-zA-Z0-9]/);
		}
	});

	test("excludes ambiguous characters", () => {
		const opts = { ...all, length: 200, excludeAmbiguous: true };
		expect(generatePassword(opts)).not.toMatch(/[Il1O0o]/);
	});

	test("no sets throws", () => {
		expect(() =>
			generatePassword({
				...all,
				lowercase: false,
				uppercase: false,
				digits: false,
				symbols: false,
			}),
		).toThrow();
	});

	test("random int is roughly uniform", () => {
		const counts = [0, 0, 0];
		for (let i = 0; i < 30000; i++) {
			const n = secureRandomInt(3);
			counts[n] = (counts[n] ?? 0) + 1;
		}
		for (const c of counts) expect(Math.abs(c - 10000)).toBeLessThan(600);
	});

	test("entropy: 20 chars over 87 symbols ≈ 128 bits", () => {
		const bits = 20 * Math.log2(passwordPoolSize(all));
		expect(bits).toBeGreaterThan(125);
		expect(strengthFromEntropy(bits).label).toBe("Very strong");
	});

	test("weak passwords score low", () => {
		expect(strengthFromEntropy(estimateEntropy("password")).score).toBe(0);
		expect(strengthFromEntropy(estimateEntropy("sunflower")).score).toBeLessThanOrEqual(1);
		expect(strengthFromEntropy(estimateEntropy("T4k#9vLq!2mZ")).score).toBeGreaterThanOrEqual(3);
		expect(strengthFromEntropy(estimateEntropy("aaaaaaaaaaaa")).score).toBe(0);
	});

	test("passphrase", () => {
		const phrase = generatePassphrase({
			words: 5,
			separator: "-",
			capitalize: true,
			includeNumber: true,
		});
		expect(phrase.split("-")).toHaveLength(5);
		expect(phrase).toMatch(/\d/);
		expect(
			passphraseEntropy({ words: 5, separator: "-", capitalize: false, includeNumber: false }),
		).toBeCloseTo(51.7, 1);
	});
});

describe("qr payloads", () => {
	test("wifi escapes special characters", () => {
		expect(
			wifiPayload({ ssid: 'My;Net"', password: "p:a,ss", encryption: "WPA", hidden: false }),
		).toBe(String.raw`WIFI:T:WPA;S:My\;Net\";P:p\:a\,ss;;`);
		expect(wifiPayload({ ssid: "Open", password: "x", encryption: "nopass", hidden: true })).toBe(
			"WIFI:T:nopass;S:Open;H:true;;",
		);
	});

	test("vcard", () => {
		const card = vcardPayload({
			firstName: "Ada",
			lastName: "Lovelace",
			phone: "+1 555",
			email: "ada@example.com",
			organization: "Engines, Inc",
			title: "",
			url: "",
		});
		expect(card).toContain("N:Lovelace;Ada;;;");
		expect(card).toContain("ORG:Engines\\, Inc");
		expect(card).not.toContain("TITLE");
	});
});

describe("invoice totals", () => {
	test("percent discount then tax", () => {
		const totals = invoiceTotals({
			items: [
				{ description: "A", quantity: 2, unitPrice: 50 },
				{ description: "B", quantity: 1, unitPrice: 100.5 },
			],
			taxRate: 18,
			discount: 10,
			discountType: "percent",
		});
		expect(totals).toEqual({
			subtotal: 200.5,
			discount: 20.05,
			taxable: 180.45,
			tax: 32.48,
			total: 212.93,
		});
	});

	test("amount discount is capped at subtotal", () => {
		const totals = invoiceTotals({
			items: [{ description: "A", quantity: 1, unitPrice: 10 }],
			taxRate: 0,
			discount: 50,
			discountType: "amount",
		});
		expect(totals.total).toBe(0);
	});
});

describe("invoice pdf", () => {
	test("renders a valid multi-item PDF with unicode text", async () => {
		const { renderInvoicePdf, toWinAnsi } = await import("./invoice-pdf");
		expect(toWinAnsi("Café ₹ “ok” 日本")).toBe("Café ? “ok” ??");
		const bytes = await renderInvoicePdf({
			number: "INV-001",
			issueDate: "2026-10-24",
			dueDate: "2026-11-07",
			currency: "INR",
			from: { name: "Asha Design", details: "12 MG Road\nBengaluru" },
			to: { name: "Client Ltd", details: "client@example.com" },
			items: Array.from({ length: 40 }, (_, i) => ({
				description: `Item ${i + 1} — logo design ₹`,
				quantity: 1,
				unitPrice: 100,
			})),
			taxLabel: "GST",
			taxRate: 18,
			discount: 5,
			discountType: "percent",
			notes: "Thank you!",
			accent: "#4f46e5",
		});
		expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
		expect(bytes.byteLength).toBeGreaterThan(2000);
	});
});
