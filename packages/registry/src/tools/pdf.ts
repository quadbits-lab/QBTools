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
				a: "No. Your files are combined inside your browser. Nothing is sent to us unless you choose Save to Media while signed in.",
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
				a: "Yes. The PDF is compressed in your browser and uploads only if you choose Save to Media.",
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
	{
		slug: "protect-pdf",
		category: "pdf",
		name: "Protect PDF",
		title: "Protect or Unlock PDF — Add or Remove a Password",
		tagline: "Lock a PDF with a password, or remove a password you know.",
		description:
			"Encrypt a PDF with AES-256 or remove its password, right in your browser. Your document and password stay on your device unless you choose Save to Media.",
		icon: "lock",
		keywords: [
			"protect pdf",
			"password protect pdf",
			"unlock pdf",
			"remove pdf password",
			"encrypt pdf",
		],
		howTo: [
			{ title: "Add a PDF", text: "Drop a PDF or tap to choose it." },
			{
				title: "Pick Protect or Unlock",
				text: "Choose Protect and set a password, or choose Unlock and enter the current one.",
			},
			{ title: "Download", text: "Save the new PDF. Keep your original until you've tested it." },
		],
		about: {
			what: "Protect encrypts the document with AES-256 so it needs a password to open. Unlock removes the password from a PDF when you enter the correct one. It cannot recover a forgotten password.",
			when: [
				"You need to email a sensitive document such as a contract or ID.",
				"A PDF you own asks for a password every time you open it.",
				"A portal or printer rejects a password-protected file.",
			],
		},
		faqs: [
			{
				q: "Can you unlock a PDF if I forgot the password?",
				a: "No. Unlock only works when you enter the correct password. QBTools never tries to guess or crack passwords.",
			},
			{
				q: "Is my password sent anywhere?",
				a: "No. The PDF and password are handled in your browser. Nothing is saved or uploaded unless you choose Save to Media, and the password is never stored.",
			},
			{
				q: "How strong is the protection?",
				a: "The PDF is encrypted with AES-256. Protection is only as strong as the password, so use a long, unique one.",
			},
		],
		related: ["file-encryptor", "merge-pdf", "compress-pdf", "split-pdf"],
		runtime: "browser",
		isNew: true,
	},
	{
		slug: "watermark-pdf",
		category: "pdf",
		name: "Watermark PDF",
		title: "Add a Watermark to PDF — Text or Image Stamp",
		tagline: "Stamp CONFIDENTIAL, DRAFT or your logo across a PDF.",
		description:
			"Add a text or image watermark to every page or chosen pages of a PDF. Set opacity, size, rotation and tiling, all in your browser, with nothing uploaded.",
		icon: "stamp",
		keywords: [
			"watermark pdf",
			"add watermark to pdf",
			"pdf stamp",
			"confidential watermark",
			"draft watermark pdf",
		],
		howTo: [
			{ title: "Add a PDF", text: "Drop a PDF or tap to choose it." },
			{
				title: "Design the watermark",
				text: "Type your text or add a PNG or JPG logo, then set opacity, size, rotation and which pages to stamp.",
			},
			{ title: "Download", text: "Save the watermarked PDF. Your original is never changed." },
		],
		about: {
			what: "The watermark is drawn on top of each page you choose, as one centred stamp or a repeating pattern. The text and pages underneath stay selectable. A watermark discourages casual reuse but is not a security feature, because it can be removed by someone with PDF editing tools.",
			when: [
				"You are sharing a draft and want every page marked DRAFT.",
				"A contract copy needs CONFIDENTIAL across the page.",
				"You want your logo on handouts or proofs.",
			],
		},
		faqs: [
			{
				q: "Can people remove the watermark?",
				a: "Someone with PDF editing software may be able to. For private documents, add a password with Protect PDF as well.",
			},
			{
				q: "Is my PDF uploaded?",
				a: "No. The watermark is added in your browser. Nothing is uploaded unless you choose Save to Media.",
			},
			{
				q: "Can I use non-English text?",
				a: "Text watermarks support Latin letters and common punctuation. For other scripts, make an image of the text and use it as an image watermark.",
			},
		],
		related: ["protect-pdf", "merge-pdf", "compress-pdf", "signature-generator"],
		runtime: "browser",
		isNew: true,
	},
	{
		slug: "redact-pdf",
		category: "pdf",
		name: "Redact PDF",
		title: "Redact PDF Online — Permanently Black Out Text",
		tagline: "Draw boxes over private details and remove them for good.",
		description:
			"Black out names, numbers and other sensitive details in a PDF. Redacted pages are rebuilt as images so the hidden text is truly removed, all in your browser.",
		icon: "eraser",
		keywords: [
			"redact pdf",
			"black out pdf",
			"hide text in pdf",
			"remove sensitive information pdf",
			"censor pdf",
		],
		howTo: [
			{ title: "Add a PDF", text: "Drop a PDF or tap to choose it." },
			{
				title: "Draw boxes",
				text: "Drag a box over each detail to hide. Remove a box with its × button, or redact a whole page.",
			},
			{
				title: "Download",
				text: "Save the redacted PDF, then open it and check every page before you share it.",
			},
		],
		about: {
			what: "Covering text with a shape does not remove it: anyone can select or extract what is underneath. Redact PDF re-draws each page you mark with the boxes burned into the pixels and replaces the page with that image, so the original text no longer exists in the file. Pages you did not mark keep their selectable text. Bookmarks and document properties are not kept.",
			when: [
				"You are sharing a statement or contract that contains account numbers.",
				"A form must be submitted with personal details removed.",
				"You are publishing a document that mentions people who must stay anonymous.",
			],
		},
		faqs: [
			{
				q: "Is the hidden text really gone?",
				a: "On pages you redact, yes. They are rebuilt from a picture of the page with the boxes painted on, so there is no text underneath. Always open the result and test by selecting text where the boxes are.",
			},
			{
				q: "Why can't I select text on redacted pages?",
				a: "Those pages become images, which is what makes the redaction permanent. Pages without boxes are not changed.",
			},
			{
				q: "Is my PDF uploaded?",
				a: "No. Redaction happens in your browser. Nothing is uploaded unless you choose Save to Media.",
			},
		],
		related: ["protect-pdf", "watermark-pdf", "compress-pdf", "split-pdf"],
		runtime: "browser",
		isNew: true,
	},
	{
		slug: "ocr-pdf",
		category: "pdf",
		name: "Searchable PDF (OCR)",
		title: "Make a Scanned PDF Searchable — Free OCR PDF",
		tagline: "Turn scanned pages into a PDF you can search and copy from.",
		description:
			"Add a hidden text layer to a scanned PDF with on-device OCR so you can search and select text. Pages look the same, and your file stays in your browser.",
		icon: "scan-text",
		keywords: [
			"searchable pdf",
			"ocr pdf",
			"scanned pdf to searchable",
			"make pdf searchable",
			"pdf ocr online",
		],
		howTo: [
			{ title: "Add a scanned PDF", text: "Drop a PDF of scanned pages or tap to choose it." },
			{
				title: "Run OCR",
				text: "Pages without text are read by OCR. Pages that already have text are kept as they are.",
			},
			{
				title: "Download",
				text: "Save the new PDF. It looks identical but you can now search it and copy text from it.",
			},
		],
		about: {
			what: "OCR reads each scanned page and places the recognised words invisibly on top of the original image, so the page looks the same but can be searched, selected and copied. English text is supported. Accuracy depends on scan quality, so check important passages.",
			when: [
				"You scanned a contract or receipt and want to search for a name.",
				"You need to copy text out of a scanned book chapter.",
				"An archive of scanned letters needs to be findable by keyword.",
			],
		},
		faqs: [
			{
				q: "Does it change how my PDF looks?",
				a: "No. Each page is kept as it was and the recognised text is added invisibly on top.",
			},
			{
				q: "Can it read other languages?",
				a: "Searchable PDFs currently support English. To extract Arabic or mixed English and Arabic text, use Extract Text.",
			},
			{
				q: "Is my document uploaded?",
				a: "No. The OCR engine runs in your browser. Nothing is uploaded unless you choose Save to Media.",
			},
		],
		related: ["extract-text", "compress-pdf", "merge-pdf", "protect-pdf"],
		runtime: "browser",
		isNew: true,
	},
];
