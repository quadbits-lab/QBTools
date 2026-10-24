import type { ToolDef } from "../types";

export const generatorTools: ToolDef[] = [
	{
		slug: "qr-code-generator",
		category: "generators",
		name: "QR Code Generator",
		title: "QR Code Generator — Free QR for Links, WiFi & Contacts",
		tagline: "Make a QR code for a link, WiFi network, contact or text.",
		description:
			"Create free QR codes for websites, WiFi, contact cards and text. Pick colors and download PNG or SVG. No signup, no expiry.",
		icon: "qr-code",
		keywords: ["qr code generator", "make qr code", "wifi qr", "qr code for link", "vcard qr"],
		howTo: [
			{ title: "Choose a type", text: "Link, Text, WiFi or Contact." },
			{ title: "Fill in details", text: "The QR code updates as you type. Pick colors if you like." },
			{ title: "Download", text: "Save as PNG for sharing or SVG for printing." },
		],
		about: {
			what: "A QR code stores information that phones can read with the camera. Our QR codes are static — the data is inside the code itself, so they never expire and don't track scans.",
			when: [
				"Sharing your website or menu on a poster.",
				"Letting guests join WiFi without typing the password.",
				"Adding contact details to a business card.",
			],
		},
		faqs: [
			{
				q: "Do these QR codes expire?",
				a: "Never. The information is stored inside the code, not on our servers.",
			},
			{
				q: "Can I use them commercially?",
				a: "Yes, free for personal and business use.",
			},
			{
				q: "Why won't my colored QR code scan?",
				a: "Keep strong contrast: a dark code on a light background works best.",
			},
		],
		related: ["password-generator", "invoice-generator", "signature-generator"],
		runtime: "browser",
		popular: 13,
	},
	{
		slug: "password-generator",
		category: "generators",
		name: "Password Generator",
		title: "Strong Password Generator — Random & Secure",
		tagline: "Create strong passwords and easy-to-remember passphrases.",
		description:
			"Generate strong random passwords or memorable passphrases with a strength meter. Made with your browser's secure random generator — nothing is sent anywhere.",
		icon: "key-round",
		keywords: [
			"password generator",
			"strong password",
			"random password",
			"passphrase generator",
			"secure password",
		],
		howTo: [
			{ title: "Pick a style", text: "Random characters or a passphrase of words." },
			{ title: "Adjust options", text: "Choose length and which characters to include." },
			{ title: "Copy", text: "Copy the password and store it in a password manager." },
		],
		about: {
			what: "Strong passwords are long and random. This generator uses your browser's cryptographically secure random numbers, and nothing is ever sent or saved.",
			when: [
				"Creating a new online account.",
				"Replacing a weak or reused password.",
				"Setting a WiFi or device password.",
			],
		},
		faqs: [
			{
				q: "Are generated passwords stored?",
				a: "No. Passwords are created on your device and disappear when you leave the page.",
			},
			{
				q: "How long should a password be?",
				a: "At least 14 characters, or a passphrase of 5 or more random words.",
			},
		],
		related: ["qr-code-generator", "signature-generator"],
		runtime: "browser",
		popular: 14,
	},
	{
		slug: "invoice-generator",
		category: "generators",
		name: "Invoice Generator",
		title: "Free Invoice Generator — Create PDF Invoices",
		tagline: "Make a professional PDF invoice in a minute.",
		description:
			"Create and download professional PDF invoices with your logo, items, tax and discount. Free, no signup, drafts saved in your browser.",
		icon: "receipt-text",
		keywords: ["invoice generator", "invoice maker", "free invoice", "pdf invoice", "bill generator"],
		howTo: [
			{ title: "Add your details", text: "Your business, your client, and an optional logo." },
			{ title: "Add items", text: "List products or services with quantity and price. Totals are automatic." },
			{ title: "Download PDF", text: "Save a clean PDF invoice to send or print." },
		],
		about: {
			what: "The invoice generator builds a tidy, printable invoice with automatic totals, tax and discounts. Your draft is saved in your browser so you can come back later.",
			when: [
				"Freelancers billing a client.",
				"Small shops that need a quick bill.",
				"Anyone who needs a receipt for a sale.",
			],
		},
		faqs: [
			{
				q: "Where is my invoice saved?",
				a: "Drafts are saved only in your browser on this device. Download the PDF to keep a copy.",
			},
			{
				q: "Can I add tax like GST or VAT?",
				a: "Yes. Add a tax percentage and label it however you need.",
			},
		],
		related: ["signature-generator", "qr-code-generator", "emi-calculator"],
		runtime: "browser",
	},
	{
		slug: "signature-generator",
		category: "generators",
		name: "Signature Maker",
		title: "Online Signature Maker — Draw or Type a Signature",
		tagline: "Draw or type a signature and save it as a transparent PNG.",
		description:
			"Create an electronic signature by drawing with your finger or mouse, or typing your name in handwriting styles. Download a transparent PNG.",
		icon: "signature",
		keywords: ["signature generator", "signature maker", "e-signature", "draw signature", "digital signature"],
		howTo: [
			{ title: "Draw or type", text: "Sign with your finger or mouse, or type your name." },
			{ title: "Style it", text: "Pick ink color and pen thickness or a handwriting font." },
			{ title: "Download", text: "Save a transparent PNG to add to documents." },
		],
		about: {
			what: "This tool creates an image of your signature with a transparent background, ready to drop into PDFs, Word documents and forms.",
			when: [
				"Signing a PDF form without printing it.",
				"Adding a signature to email or invoices.",
				"Making a consistent signature image for documents.",
			],
		},
		faqs: [
			{
				q: "Is this a legally binding signature?",
				a: "An image of a signature is accepted in many everyday cases, but some legal documents need certified e-signatures. Check what's required.",
			},
			{
				q: "Is my signature uploaded?",
				a: "No. It's created and saved only on your device.",
			},
		],
		related: ["invoice-generator", "image-to-pdf", "remove-background"],
		runtime: "browser",
	},
];
