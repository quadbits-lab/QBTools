import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import { type Invoice, invoiceTotals, lineTotal } from "./invoice";

/** Standard PDF fonts only cover Windows-1252; replace anything else. */
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
export function toWinAnsi(text: string): string {
	return [...text.normalize("NFC")]
		.map((ch) => {
			const code = ch.codePointAt(0) ?? 0;
			if (ch === "\t") return "  ";
			if (code === 10 || (code >= 32 && code <= 126) || (code >= 160 && code <= 255) || WIN_ANSI_EXTRA.includes(ch)) return ch;
			return "?";
		})
		.join("");
}

function hexToRgb(hex: string) {
	const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	if (!m) return rgb(0.31, 0.27, 0.9);
	return rgb(Number.parseInt(m[1] ?? "0", 16) / 255, Number.parseInt(m[2] ?? "0", 16) / 255, Number.parseInt(m[3] ?? "0", 16) / 255);
}

/** Amounts as "INR 1,234.50" — currency symbols like ₹ aren't in WinAnsi. */
function money(amount: number, currency: string) {
	return `${currency} ${amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
	const lines: string[] = [];
	for (const paragraph of toWinAnsi(text).split("\n")) {
		let line = "";
		for (const word of paragraph.split(/\s+/)) {
			const next = line ? `${line} ${word}` : word;
			if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
				lines.push(line);
				line = word;
			} else {
				line = next;
			}
		}
		lines.push(line);
	}
	return lines;
}

export async function renderInvoicePdf(invoice: Invoice): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	pdf.setTitle(toWinAnsi(`Invoice ${invoice.number}`));
	pdf.setProducer("QBTools Invoice Generator");
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const accent = hexToRgb(invoice.accent);
	const muted = rgb(0.4, 0.43, 0.5);
	const ink = rgb(0.1, 0.11, 0.16);
	const totals = invoiceTotals(invoice);

	const A4: [number, number] = [595.28, 841.89];
	const margin = 48;
	let page: PDFPage = pdf.addPage(A4);
	const width = A4[0] - margin * 2;
	let y = A4[1] - margin;

	const text = (value: string, x: number, size = 10, font = regular, color = ink) =>
		page.drawText(toWinAnsi(value), { x, y, size, font, color });
	const textRight = (value: string, right: number, size = 10, font = regular, color = ink) => {
		const safe = toWinAnsi(value);
		page.drawText(safe, { x: right - font.widthOfTextAtSize(safe, size), y, size, font, color });
	};

	// Header band
	page.drawRectangle({ x: 0, y: A4[1] - 8, width: A4[0], height: 8, color: accent });
	if (invoice.logo) {
		try {
			const bytes = Uint8Array.from(atob(invoice.logo.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
			const image = invoice.logo.startsWith("data:image/png") ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
			const scale = Math.min(140 / image.width, 56 / image.height, 1);
			page.drawImage(image, { x: margin, y: y - image.height * scale + 6, width: image.width * scale, height: image.height * scale });
		} catch {
			// Unsupported logo format: skip it rather than failing the invoice.
		}
	}
	textRight("INVOICE", A4[0] - margin, 26, bold, accent);
	y -= 24;
	textRight(`# ${invoice.number}`, A4[0] - margin, 11, regular, muted);
	y -= 40;

	// From / To
	const colWidth = width / 2 - 12;
	const blockTop = y;
	text("FROM", margin, 9, bold, muted);
	y -= 15;
	text(invoice.from.name || "-", margin, 12, bold);
	for (const line of wrap(invoice.from.details, regular, 10, colWidth)) {
		y -= 14;
		text(line, margin, 10, regular, muted);
	}
	const fromBottom = y;
	y = blockTop;
	const toX = margin + width / 2 + 12;
	text("BILL TO", toX, 9, bold, muted);
	y -= 15;
	text(invoice.to.name || "-", toX, 12, bold);
	for (const line of wrap(invoice.to.details, regular, 10, colWidth)) {
		y -= 14;
		text(line, toX, 10, regular, muted);
	}
	y = Math.min(y, fromBottom) - 28;

	// Dates
	text("Issue date", margin, 9, bold, muted);
	text("Due date", margin + 150, 9, bold, muted);
	y -= 14;
	text(invoice.issueDate || "-", margin, 11);
	text(invoice.dueDate || "-", margin + 150, 11);
	y -= 30;

	// Items table
	const cols = { desc: margin + 10, qty: margin + width * 0.62, price: margin + width * 0.8, total: margin + width - 10 };
	const drawHeader = () => {
		page.drawRectangle({ x: margin, y: y - 8, width, height: 26, color: accent, opacity: 0.1 });
		text("DESCRIPTION", cols.desc, 9, bold, muted);
		textRight("QTY", cols.qty, 9, bold, muted);
		textRight("PRICE", cols.price, 9, bold, muted);
		textRight("AMOUNT", cols.total, 9, bold, muted);
		y -= 30;
	};
	drawHeader();
	for (const item of invoice.items) {
		const lines = wrap(item.description || "-", regular, 10, cols.qty - cols.desc - 60);
		const rowHeight = lines.length * 14 + 10;
		if (y - rowHeight < margin + 160) {
			page = pdf.addPage(A4);
			y = A4[1] - margin;
			drawHeader();
		}
		const rowTop = y;
		lines.forEach((line, i) => {
			y = rowTop - i * 14;
			text(line, cols.desc, 10);
		});
		y = rowTop;
		textRight(String(item.quantity), cols.qty, 10);
		textRight(money(item.unitPrice || 0, invoice.currency), cols.price, 10);
		textRight(money(lineTotal(item), invoice.currency), cols.total, 10, bold);
		y = rowTop - rowHeight;
		page.drawLine({ start: { x: margin, y: y + 6 }, end: { x: margin + width, y: y + 6 }, thickness: 0.5, color: rgb(0.88, 0.89, 0.92) });
		y -= 8;
	}

	// Totals
	y -= 6;
	const labelX = margin + width * 0.58;
	const row = (label: string, value: string, strong = false) => {
		text(label, labelX, strong ? 12 : 10, strong ? bold : regular, strong ? ink : muted);
		textRight(value, cols.total, strong ? 12 : 10, strong ? bold : regular);
		y -= strong ? 22 : 17;
	};
	row("Subtotal", money(totals.subtotal, invoice.currency));
	if (totals.discount > 0) row(invoice.discountType === "percent" ? `Discount (${invoice.discount}%)` : "Discount", `- ${money(totals.discount, invoice.currency)}`);
	if (invoice.taxRate > 0) row(`${invoice.taxLabel || "Tax"} (${invoice.taxRate}%)`, money(totals.tax, invoice.currency));
	page.drawRectangle({ x: labelX - 10, y: y - 10, width: margin + width - labelX + 10, height: 32, color: accent });
	y += 0;
	text("TOTAL", labelX, 12, bold, rgb(1, 1, 1));
	textRight(money(totals.total, invoice.currency), cols.total, 14, bold, rgb(1, 1, 1));
	y -= 50;

	if (invoice.notes.trim()) {
		text("NOTES", margin, 9, bold, muted);
		for (const line of wrap(invoice.notes, regular, 10, width)) {
			y -= 14;
			if (y < margin) break;
			text(line, margin, 10, regular, muted);
		}
	}

	return pdf.save();
}
