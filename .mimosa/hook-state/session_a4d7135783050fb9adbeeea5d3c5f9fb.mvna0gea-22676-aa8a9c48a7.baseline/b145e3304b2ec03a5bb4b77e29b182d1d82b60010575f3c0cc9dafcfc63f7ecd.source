export interface InvoiceItem {
	description: string;
	quantity: number;
	unitPrice: number;
}

export interface Invoice {
	number: string;
	issueDate: string;
	dueDate: string;
	currency: string;
	from: { name: string; details: string };
	to: { name: string; details: string };
	items: InvoiceItem[];
	taxLabel: string;
	taxRate: number;
	discount: number;
	discountType: "percent" | "amount";
	notes: string;
	/** data: URL (PNG/JPEG) */
	logo?: string;
	accent: string;
}

export interface InvoiceTotals {
	subtotal: number;
	discount: number;
	taxable: number;
	tax: number;
	total: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineTotal(item: InvoiceItem): number {
	return round2((item.quantity || 0) * (item.unitPrice || 0));
}

export function invoiceTotals(
	invoice: Pick<Invoice, "items" | "taxRate" | "discount" | "discountType">,
): InvoiceTotals {
	const subtotal = round2(invoice.items.reduce((sum, item) => sum + lineTotal(item), 0));
	const rawDiscount =
		invoice.discountType === "percent"
			? (subtotal * (invoice.discount || 0)) / 100
			: invoice.discount || 0;
	const discount = round2(Math.min(Math.max(rawDiscount, 0), subtotal));
	const taxable = round2(subtotal - discount);
	const tax = round2((taxable * (invoice.taxRate || 0)) / 100);
	return { subtotal, discount, taxable, tax, total: round2(taxable + tax) };
}

export function formatMoney(amount: number, currency: string): string {
	try {
		return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
	} catch {
		return `${currency} ${amount.toFixed(2)}`;
	}
}

export const CURRENCIES = [
	"USD",
	"EUR",
	"GBP",
	"INR",
	"AED",
	"SAR",
	"PKR",
	"BDT",
	"NGN",
	"CAD",
	"AUD",
	"SGD",
	"JPY",
	"CNY",
	"ZAR",
] as const;
