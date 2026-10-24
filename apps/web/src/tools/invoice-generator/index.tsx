import { downloadBlob } from "@qbtools/engines/files";
import {
	CURRENCIES,
	formatMoney,
	type Invoice,
	invoiceTotals,
	lineTotal,
} from "@qbtools/engines/generators";
import { Button } from "@qbtools/ui/button";
import { Input, Select, Textarea } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { toast } from "@qbtools/ui/toaster";
import { Download, ImagePlus, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PrivacyNote } from "#/components/kit/privacy-note";
import { SaveToMedia } from "#/components/kit/save-to-media";

const DRAFT_KEY = "qbtools.invoice.draft";
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (days: number) =>
	new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const blank = (): Invoice => ({
	number: "INV-0001",
	issueDate: today(),
	dueDate: plusDays(14),
	currency: "USD",
	from: { name: "", details: "" },
	to: { name: "", details: "" },
	items: [{ description: "", quantity: 1, unitPrice: 0 }],
	taxLabel: "Tax",
	taxRate: 0,
	discount: 0,
	discountType: "percent",
	notes: "Thank you for your business!",
	accent: "#4f46e5",
});

export default function InvoiceGenerator() {
	const [invoice, setInvoice] = useState<Invoice>(blank);
	const [loaded, setLoaded] = useState(false);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(DRAFT_KEY);
			if (saved) setInvoice({ ...blank(), ...(JSON.parse(saved) as Partial<Invoice>) });
		} catch {}
		setLoaded(true);
	}, []);
	useEffect(() => {
		if (!loaded) return;
		const id = setTimeout(() => {
			try {
				localStorage.setItem(DRAFT_KEY, JSON.stringify(invoice));
			} catch {
				// Large logos can exceed storage; the draft just won't persist.
			}
		}, 400);
		return () => clearTimeout(id);
	}, [invoice, loaded]);

	const set = <K extends keyof Invoice>(key: K, value: Invoice[K]) =>
		setInvoice((inv) => ({ ...inv, [key]: value }));
	const setItem = (index: number, patch: Partial<Invoice["items"][number]>) =>
		setInvoice((inv) => ({
			...inv,
			items: inv.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
		}));
	const totals = invoiceTotals(invoice);
	const money = (n: number) => formatMoney(n, invoice.currency);

	const onLogo = (file: File | undefined) => {
		if (!file) return;
		if (!/image\/(png|jpeg)/.test(file.type)) return toast.error("Please use a PNG or JPG logo.");
		if (file.size > 500_000) return toast.error("Please use a logo under 500KB.");
		const reader = new FileReader();
		reader.onload = () => set("logo", String(reader.result));
		reader.readAsDataURL(file);
	};

	const download = async () => {
		setPending(true);
		try {
			const { renderInvoicePdf } = await import("@qbtools/engines/invoice-pdf");
			const bytes = await renderInvoicePdf(invoice);
			downloadBlob(
				new Blob([bytes as BlobPart], { type: "application/pdf" }),
				`${invoice.number || "invoice"}.pdf`,
			);
		} catch (error) {
			console.error(error);
			toast.error("Couldn't create the PDF. Please check your details and try again.");
		} finally {
			setPending(false);
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<div className="grid gap-5 md:grid-cols-[auto_1fr_1fr_1fr]">
				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium">Logo</span>
					<label className="grid size-24 cursor-pointer place-items-center overflow-hidden border-2 border-dashed border-input bg-surface-2 hover:border-primary">
						{invoice.logo ? (
							<img
								src={invoice.logo}
								alt="Your logo"
								className="max-h-full max-w-full object-contain"
							/>
						) : (
							<ImagePlus className="size-7 text-muted-foreground" />
						)}
						<input
							type="file"
							accept="image/png,image/jpeg"
							className="sr-only"
							onChange={(e) => onLogo(e.target.files?.[0])}
						/>
					</label>
					{invoice.logo && (
						<button
							type="button"
							className="cursor-pointer text-left text-sm text-critical"
							onClick={() => set("logo", undefined)}
						>
							Remove
						</button>
					)}
				</div>
				<Field label="Invoice number" htmlFor="inv-no">
					<Input
						id="inv-no"
						value={invoice.number}
						onChange={(e) => set("number", e.target.value)}
					/>
				</Field>
				<Field label="Issue date" htmlFor="inv-issue">
					<Input
						id="inv-issue"
						type="date"
						value={invoice.issueDate}
						onChange={(e) => set("issueDate", e.target.value)}
					/>
				</Field>
				<Field label="Due date" htmlFor="inv-due">
					<Input
						id="inv-due"
						type="date"
						value={invoice.dueDate}
						onChange={(e) => set("dueDate", e.target.value)}
					/>
				</Field>
			</div>

			<div className="grid gap-5 md:grid-cols-2">
				<fieldset className="flex flex-col gap-3 border border-border p-5">
					<legend className="px-1 font-medium">From (you)</legend>
					<Input
						aria-label="Your name or business"
						placeholder="Your name or business"
						value={invoice.from.name}
						onChange={(e) => set("from", { ...invoice.from, name: e.target.value })}
					/>
					<Textarea
						aria-label="Your details"
						placeholder={"Address, email, phone, tax ID…"}
						value={invoice.from.details}
						onChange={(e) => set("from", { ...invoice.from, details: e.target.value })}
						className="min-h-24"
					/>
				</fieldset>
				<fieldset className="flex flex-col gap-3 border border-border p-5">
					<legend className="px-1 font-medium">Bill to (client)</legend>
					<Input
						aria-label="Client name"
						placeholder="Client name"
						value={invoice.to.name}
						onChange={(e) => set("to", { ...invoice.to, name: e.target.value })}
					/>
					<Textarea
						aria-label="Client details"
						placeholder="Client address, email…"
						value={invoice.to.details}
						onChange={(e) => set("to", { ...invoice.to, details: e.target.value })}
						className="min-h-24"
					/>
				</fieldset>
			</div>

			<section aria-labelledby="items-h">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<h3 id="items-h" className="text-lg font-medium">
						Items
					</h3>
					<Field label="Currency" htmlFor="inv-cur" className="w-32">
						<Select
							id="inv-cur"
							value={invoice.currency}
							onChange={(e) => set("currency", e.target.value)}
						>
							{CURRENCIES.map((c) => (
								<option key={c}>{c}</option>
							))}
						</Select>
					</Field>
				</div>
				<ul className="mt-3 flex flex-col gap-3">
					{invoice.items.map((item, i) => (
						<li
							key={i}
							className="grid grid-cols-[1fr_auto] items-center gap-2 border border-border p-3 sm:grid-cols-[1fr_6rem_8rem_8rem_auto] sm:border-0 sm:p-0"
						>
							<Input
								aria-label={`Item ${i + 1} description`}
								placeholder="Description"
								value={item.description}
								onChange={(e) => setItem(i, { description: e.target.value })}
								className="col-span-2 sm:col-span-1"
							/>
							<Input
								aria-label={`Item ${i + 1} quantity`}
								type="number"
								inputMode="decimal"
								min={0}
								value={item.quantity}
								onChange={(e) => setItem(i, { quantity: Number(e.target.value) })}
								className="font-mono"
							/>
							<Input
								aria-label={`Item ${i + 1} price`}
								type="number"
								inputMode="decimal"
								min={0}
								step="0.01"
								value={item.unitPrice}
								onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })}
								className="font-mono"
							/>
							<span className="text-right font-mono font-medium">{money(lineTotal(item))}</span>
							<Button
								variant="ghost"
								size="icon"
								aria-label={`Remove item ${i + 1}`}
								disabled={invoice.items.length === 1}
								onClick={() =>
									set(
										"items",
										invoice.items.filter((_, j) => j !== i),
									)
								}
							>
								<Trash2 />
							</Button>
						</li>
					))}
				</ul>
				<Button
					variant="secondary"
					className="mt-3"
					onClick={() =>
						set("items", [...invoice.items, { description: "", quantity: 1, unitPrice: 0 }])
					}
				>
					<Plus /> Add item
				</Button>
			</section>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<Field label="Tax name" htmlFor="inv-taxl">
							<Input
								id="inv-taxl"
								value={invoice.taxLabel}
								onChange={(e) => set("taxLabel", e.target.value)}
								placeholder="GST / VAT"
							/>
						</Field>
						<Field label="Tax %" htmlFor="inv-tax">
							<Input
								id="inv-tax"
								type="number"
								inputMode="decimal"
								min={0}
								value={invoice.taxRate}
								onChange={(e) => set("taxRate", Number(e.target.value))}
								className="font-mono"
							/>
						</Field>
						<Field label="Discount" htmlFor="inv-disc">
							<Input
								id="inv-disc"
								type="number"
								inputMode="decimal"
								min={0}
								value={invoice.discount}
								onChange={(e) => set("discount", Number(e.target.value))}
								className="font-mono"
							/>
						</Field>
						<Field label="Discount type" htmlFor="inv-dtype">
							<Select
								id="inv-dtype"
								value={invoice.discountType}
								onChange={(e) => set("discountType", e.target.value as Invoice["discountType"])}
							>
								<option value="percent">%</option>
								<option value="amount">{invoice.currency}</option>
							</Select>
						</Field>
					</div>
					<Field label="Notes / payment details" htmlFor="inv-notes">
						<Textarea
							id="inv-notes"
							value={invoice.notes}
							onChange={(e) => set("notes", e.target.value)}
							className="min-h-24"
						/>
					</Field>
					<Field label="Accent color" htmlFor="inv-accent">
						<Input
							id="inv-accent"
							type="color"
							value={invoice.accent}
							onChange={(e) => set("accent", e.target.value)}
							className="w-24 cursor-pointer p-1"
						/>
					</Field>
				</div>
				<div
					className="flex flex-col gap-2 self-start bg-surface-2 p-6 font-mono"
					aria-live="polite"
				>
					<p className="flex justify-between">
						<span className="font-sans text-muted-foreground">Subtotal</span>
						{money(totals.subtotal)}
					</p>
					{totals.discount > 0 && (
						<p className="flex justify-between">
							<span className="font-sans text-muted-foreground">Discount</span>−{" "}
							{money(totals.discount)}
						</p>
					)}
					{invoice.taxRate > 0 && (
						<p className="flex justify-between">
							<span className="font-sans text-muted-foreground">
								{invoice.taxLabel || "Tax"} ({invoice.taxRate}%)
							</span>
							{money(totals.tax)}
						</p>
					)}
					<p className="mt-2 flex justify-between border-t border-border pt-3 text-2xl font-medium">
						<span className="font-sans">Total</span>
						{money(totals.total)}
					</p>
					<Button size="lg" className="mt-4 font-sans" onClick={download} disabled={pending}>
						{pending ? <Loader2 className="animate-spin" /> : <Download />} Download PDF
					</Button>
					<SaveToMedia
						name={`${invoice.number || "invoice"}.pdf`}
						prepare={async () => {
							const { renderInvoicePdf } = await import("@qbtools/engines/invoice-pdf");
							return new Blob([(await renderInvoicePdf(invoice)) as BlobPart], {
								type: "application/pdf",
							});
						}}
					/>
					<Button
						variant="ghost"
						className="font-sans"
						onClick={() => {
							if (confirm("Start a new blank invoice? Your current draft will be cleared."))
								setInvoice(blank());
						}}
					>
						<RotateCcw /> New invoice
					</Button>
				</div>
			</div>
			<PrivacyNote text="Your draft is saved only in this browser. The PDF is created on your device." />
		</div>
	);
}
