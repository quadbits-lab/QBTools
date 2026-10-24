/**
 * Guides are plain structured data (no MDX build step): each block renders
 * to semantic HTML, so pages are fully server-rendered and fast.
 */
export type GuideBlock =
	| { type: "p"; text: string }
	| { type: "h2"; text: string }
	| { type: "ul"; items: string[] }
	| { type: "ol"; items: string[] }
	| { type: "tip"; text: string }
	| { type: "tool"; slug: string; preset?: string; label: string };

export interface Guide {
	slug: string;
	title: string;
	description: string;
	/** ISO date */
	published: string;
	readMinutes: number;
	tools: string[];
	body: GuideBlock[];
}

export const guides: Guide[] = [
	{
		slug: "how-to-compress-a-photo-to-100kb",
		title: "How to compress a photo to under 100KB (without it looking blurry)",
		description:
			"Exam portals and job forms often reject photos over 100KB. Here's the fastest way to shrink a picture to an exact size on phone or computer.",
		published: "2026-10-20",
		readMinutes: 4,
		tools: ["compress-image", "resize-image"],
		body: [
			{
				type: "p",
				text: "Online application forms love strict limits: “JPG only, under 100KB, 200 × 230 pixels”. Phone cameras, meanwhile, produce photos of 3–8MB. The good news is that you can usually shrink a photo by 95% without anyone noticing.",
			},
			{ type: "h2", text: "Why are phone photos so big?" },
			{
				type: "p",
				text: "Modern phones take 12–50 megapixel photos — far more detail than a form will ever display. File size grows with two things: the number of pixels (width × height) and the quality setting used when the photo is saved.",
			},
			{ type: "h2", text: "The quick way" },
			{
				type: "ol",
				items: [
					"Open the Compress Image to 100KB tool.",
					"Drop your photo in. QBTools tries many quality levels and keeps the best one that fits under 100KB.",
					"Check the preview and tap Download.",
				],
			},
			{ type: "tool", slug: "compress-image", preset: "to-100kb", label: "Compress Image to 100KB" },
			{ type: "h2", text: "If the photo still won't fit" },
			{
				type: "p",
				text: "Very large photos may need fewer pixels too. Turn on “Also reduce dimensions”, or resize the photo to the size the form asks for first (for example 600 pixels wide), then compress.",
			},
			{
				type: "tip",
				text: "Forms that ask for a passport-style photo usually want a plain background and your face filling about 70% of the frame. Crop before compressing — you'll get better quality at the same size.",
			},
			{ type: "h2", text: "Is it safe?" },
			{
				type: "p",
				text: "Yes. QBTools compresses photos inside your browser, so your picture is never uploaded to a server. That matters for ID photos and documents.",
			},
		],
	},
	{
		slug: "merge-pdf-files-on-phone",
		title: "How to merge PDF files on your phone in 30 seconds",
		description:
			"Need to upload all your documents as one PDF? Here's how to combine PDFs and photos into one file on Android or iPhone — no app required.",
		published: "2026-10-14",
		readMinutes: 3,
		tools: ["merge-pdf", "image-to-pdf", "compress-pdf"],
		body: [
			{
				type: "p",
				text: "Scholarship, visa and job portals often ask for “all documents in a single PDF”. You don't need to install an app — your phone's browser can do it.",
			},
			{ type: "h2", text: "Step by step" },
			{
				type: "ol",
				items: [
					"Open Merge PDF in your browser.",
					"Tap the box and choose your PDF files (hold to select several).",
					"Use the arrows to put them in the right order.",
					"Tap Merge PDF and save the file.",
				],
			},
			{ type: "tool", slug: "merge-pdf", label: "Open Merge PDF" },
			{ type: "h2", text: "Have photos of documents instead?" },
			{
				type: "p",
				text: "Turn photos into a PDF first with Image to PDF, then merge that PDF with the rest. Choose A4 pages so everything prints neatly.",
			},
			{ type: "tool", slug: "image-to-pdf", label: "Open Image to PDF" },
			{
				type: "tip",
				text: "Upload limit of 2MB? Run the merged file through Compress PDF before uploading.",
			},
		],
	},
	{
		slug: "how-emi-is-calculated",
		title: "How loan EMI is calculated — explained simply",
		description:
			"What makes up your monthly loan payment, why early payments are mostly interest, and how a shorter tenure saves you money.",
		published: "2026-10-08",
		readMinutes: 5,
		tools: ["emi-calculator", "percentage-calculator"],
		body: [
			{
				type: "p",
				text: "EMI stands for Equated Monthly Instalment: the same amount you pay every month until a loan is cleared. Each payment has two parts — interest for the month, and a slice of the original loan (the principal).",
			},
			{ type: "h2", text: "The formula" },
			{
				type: "p",
				text: "EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1). P is the loan amount, r is the monthly interest rate (yearly rate ÷ 12 ÷ 100), and n is the number of months.",
			},
			{ type: "h2", text: "Why the first payments are mostly interest" },
			{
				type: "p",
				text: "Interest is charged on what you still owe. At the start you owe the most, so most of the EMI goes to interest. As the balance falls, more of each payment reduces the principal.",
			},
			{ type: "h2", text: "Three ways to pay less interest" },
			{
				type: "ul",
				items: [
					"Choose a shorter tenure if the EMI fits your budget.",
					"Make part-prepayments early in the loan, when they save the most interest.",
					"Compare rates: even 0.5% lower can save a lot on a 20-year home loan.",
				],
			},
			{ type: "tool", slug: "emi-calculator", label: "Try the EMI Calculator" },
			{
				type: "tip",
				text: "Results are estimates for planning. Lenders may add processing fees, insurance or taxes — always ask for the full cost.",
			},
		],
	},
];

export function getGuide(slug: string): Guide | undefined {
	return guides.find((guide) => guide.slug === slug);
}

export function latestGuides(limit = 3): Guide[] {
	return [...guides].sort((a, b) => b.published.localeCompare(a.published)).slice(0, limit);
}
