import type { ToolDef } from "../types";

export const pdfTools: ToolDef[] = [
	{
		slug: "merge-pdf",
		category: "pdf",
		name: "Merge PDF",
		title: "Merge PDF Files Online — Combine PDFs Free",
		tagline: "Join several PDFs into one file, in the order you want.",
		description:
			"Combine multiple PDF files into one document. Drag to reorder, then download. Free, no signup, and files never leave your device.",
		icon: "files",
		keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger", "add pdf together"],
		howTo: [
			{ title: "Add PDFs", text: "Drop two or more PDF files, or tap to pick them." },
			{ title: "Put them in order", text: "Use the arrows to move files up or down." },
			{ title: "Merge & download", text: "Tap Merge and save your single combined PDF." },
		],
		about: {
			what: "Merging puts the pages of several PDFs into one file, one after another. It's the easiest way to send many documents as a single attachment.",
			when: [
				"An application asks you to upload all documents as one PDF.",
				"You scanned pages separately and want one file.",
				"You want to send one attachment instead of many.",
			],
		},
		faqs: [
			{
				q: "Is there a file limit?",
				a: "There's no fixed limit. Because merging happens on your device, very large files depend on your device's memory.",
			},
			{
				q: "Are my PDFs uploaded?",
				a: "No. Your files are combined inside your browser and never sent to us.",
			},
			{
				q: "Can I merge password-protected PDFs?",
				a: "Encrypted PDFs need to be unlocked first. Open them with the password and save an unprotected copy.",
			},
		],
		related: ["split-pdf", "compress-pdf", "image-to-pdf", "compress-image"],
		runtime: "browser",
		popular: 2,
	},
	{
		slug: "split-pdf",
		category: "pdf",
		name: "Split PDF",
		title: "Split PDF Online — Extract Pages from a PDF",
		tagline: "Take out the pages you need, or split every page into its own file.",
		description:
			"Split a PDF by page ranges or into single pages. Extract just the pages you need — free, fast and private.",
		icon: "scissors",
		keywords: ["split pdf", "extract pdf pages", "separate pdf", "pdf splitter", "remove pages"],
		howTo: [
			{ title: "Add a PDF", text: "Drop your PDF or tap to choose it." },
			{
				title: "Choose pages",
				text: "Type ranges like 1-3, 5 or choose “every page as a separate file”.",
			},
			{ title: "Download", text: "Save the new PDF, or a ZIP of single-page files." },
		],
		about: {
			what: "Splitting creates new PDFs that contain only the pages you pick. The original file isn't changed.",
			when: [
				"You only need to send one page of a long document.",
				"A portal limits uploads to a few pages.",
				"You want each page of a scan as its own file.",
			],
		},
		faqs: [
			{
				q: "How do I write page ranges?",
				a: "Use commas and dashes: “1-3, 6, 9-10” keeps pages 1, 2, 3, 6, 9 and 10.",
			},
			{ q: "Does splitting reduce quality?", a: "No. Pages are copied exactly as they are." },
		],
		related: ["merge-pdf", "compress-pdf", "image-to-pdf"],
		runtime: "browser",
		popular: 9,
	},
	{
		slug: "compress-pdf",
		category: "pdf",
		name: "Compress PDF",
		title: "Compress PDF Online — Reduce PDF File Size",
		tagline: "Shrink big PDFs so they fit email and upload limits.",
		description:
			"Optimize PDF structure while preserving text, or compress scans as images. Compare file sizes and download locally without uploading your document.",
		icon: "file-down",
		keywords: ["compress pdf", "reduce pdf size", "pdf compressor", "shrink pdf", "pdf under 1mb"],
		howTo: [
			{ title: "Add a PDF", text: "Drop a PDF or tap to choose it." },
			{
				title: "Choose a mode",
				text: "Preserve text, or choose Compress scans with Light, Recommended or Strong settings.",
			},
			{ title: "Download", text: "Compare sizes and save the smaller PDF." },
		],
		about: {
			what: "Preserve text mode optimizes document structure and retains selectable text. Compress scans converts pages into images for larger reductions on scans. Savings depend on the document; keep the original.",
			when: [
				"An email bounces because the attachment is too big.",
				"A government or exam portal limits PDFs to 1MB or 2MB.",
				"You want to save space on your phone.",
			],
		},
		faqs: [
			{
				q: "Why can't I select text after compressing?",
				a: "Compress scans turns pages into images. Choose Preserve text to retain selectable text, links, bookmarks and forms.",
			},
			{
				q: "Is my document private?",
				a: "Yes. The PDF is compressed in your browser and never uploaded.",
			},
			{
				q: "Why did my PDF barely shrink?",
				a: "PDFs that are mostly text are already small. Compression helps most with scans and photos.",
			},
		],
		related: ["merge-pdf", "split-pdf", "compress-image", "image-to-pdf"],
		runtime: "browser",
		popular: 5,
		presets: [
			{
				slug: "to-1mb",
				title: "Compress PDF to 1MB",
				description: "Shrink a PDF to under 1MB for forms and email. Free and private.",
				intro:
					"Many forms limit uploads to 1MB. Strong compression is selected for you — drop your PDF to see if it fits.",
				keywords: ["compress pdf to 1mb", "pdf under 1mb", "reduce pdf to 1mb"],
				params: { level: "strong", mode: "scans" },
			},
		],
	},
	{
		slug: "image-to-pdf",
		category: "pdf",
		name: "Image to PDF",
		title: "Image to PDF Converter — JPG & PNG to PDF",
		tagline: "Turn photos and scans into one tidy PDF.",
		description:
			"Convert JPG, PNG and WebP images into a PDF. Choose page size and margins, reorder pages, and download — free with no upload.",
		icon: "file-image",
		keywords: ["image to pdf", "jpg to pdf", "png to pdf", "photo to pdf", "convert image to pdf"],
		howTo: [
			{ title: "Add images", text: "Drop photos or scans — they become pages in order." },
			{ title: "Set up pages", text: "Choose A4, Letter or fit-to-image, plus margins." },
			{ title: "Create PDF", text: "Tap Create and save your PDF." },
		],
		about: {
			what: "This tool places each image on its own PDF page, so you can send phone photos of documents as one professional file.",
			when: [
				"You photographed documents and need to send them as PDF.",
				"A form only accepts PDF uploads.",
				"You want to combine receipts into one file.",
			],
		},
		faqs: [
			{
				q: "Can I change the page order?",
				a: "Yes. Use the arrows next to each image before creating the PDF.",
			},
			{
				q: "Will my images be compressed?",
				a: "They're kept at their original quality. Use Compress PDF afterward if you need a smaller file.",
			},
		],
		related: ["merge-pdf", "compress-pdf", "compress-image", "convert-image"],
		runtime: "browser",
		popular: 6,
		presets: [
			{
				slug: "jpg-to-pdf",
				title: "JPG to PDF Converter",
				description: "Convert JPG photos to a PDF in seconds. Free, private, works on phone.",
				intro: "Add your JPG photos below and they'll become pages of one PDF.",
				keywords: ["jpg to pdf", "jpeg to pdf"],
				params: {},
			},
			{
				slug: "png-to-pdf",
				title: "PNG to PDF Converter",
				description: "Convert PNG images into a PDF for free with no upload.",
				intro: "Add your PNG images below and they'll become pages of one PDF.",
				keywords: ["png to pdf"],
				params: {},
			},
		],
	},
];
