import type { ToolDef } from "../types";

const sizePreset = (kb: number): NonNullable<ToolDef["presets"]>[number] => ({
	slug: `to-${kb}kb`,
	title: `Compress Image to ${kb}KB`,
	description: `Reduce a JPG, PNG or WebP photo to ${kb}KB or less in seconds. Free, no signup, and your image never leaves your device.`,
	intro: `Many application forms, exam portals and job sites only accept photos under ${kb}KB. Drop your image below and QBTools finds the best quality that still fits under ${kb}KB — automatically.`,
	keywords: [
		`compress image to ${kb}kb`,
		`reduce photo size to ${kb}kb`,
		`image ${kb}kb`,
		`resize image to ${kb}kb`,
	],
	params: { targetKb: kb },
});

export const imageTools: ToolDef[] = [
	{
		slug: "compress-image",
		category: "image",
		name: "Compress Image",
		title: "Compress Image Online — Reduce Photo Size to Any KB",
		tagline: "Make photos smaller without making them look worse.",
		description:
			"Compress JPG, PNG and WebP images to an exact size like 100KB or 50KB. Free, fast and private — images are processed in your browser, never uploaded.",
		icon: "minimize-2",
		keywords: [
			"compress image",
			"reduce image size",
			"image compressor",
			"compress jpg",
			"compress png",
			"photo size reducer",
			"kb",
			"shrink image",
		],
		howTo: [
			{ title: "Add your image", text: "Drag a photo onto the box, tap to pick one, or paste it." },
			{
				title: "Pick a size",
				text: "Choose a target like 100KB, or use the quality slider for full control.",
			},
			{ title: "Download", text: "See the new size, then save the smaller image with one tap." },
		],
		about: {
			what: "Image compression keeps your photo looking the same to your eyes while removing data you can't see. QBTools tries many quality levels and picks the best one that fits the size you need, so you don't have to guess.",
			when: [
				"An online form says “photo must be under 100KB”.",
				"Email or WhatsApp refuses a large picture.",
				"Your website loads slowly because of heavy images.",
				"Your phone storage is filling up with big photos.",
			],
		},
		faqs: [
			{
				q: "Is my photo uploaded to a server?",
				a: "No. Compression happens inside your browser using your own device, so the image never leaves your computer or phone.",
			},
			{
				q: "Will compressing reduce the quality?",
				a: "Slightly, but usually not in a way you can see. Set a target size and we keep as much quality as possible while staying under it.",
			},
			{
				q: "Can I compress a PNG?",
				a: "Yes. PNGs with photos compress best when saved as JPG or WebP. For logos with transparency, keep WebP to preserve the see-through parts.",
			},
			{
				q: "What if my image is still too big?",
				a: "Very large photos may also need to be made smaller in width and height. Turn on “Also reduce dimensions” or use the Resize Image tool first.",
			},
		],
		related: ["resize-image", "convert-image", "image-to-pdf", "compress-pdf"],
		runtime: "browser",
		popular: 1,
		presets: [
			sizePreset(20),
			sizePreset(50),
			sizePreset(100),
			sizePreset(200),
			sizePreset(500),
			{
				slug: "to-1mb",
				title: "Compress Image to 1MB",
				description:
					"Shrink large photos to under 1MB for email, uploads and sharing. Free, no signup, processed on your device.",
				intro:
					"Phone cameras create photos of 4–10MB. Drop one below and we'll make it fit under 1MB while keeping it sharp.",
				keywords: ["compress image to 1mb", "reduce photo to 1mb", "image under 1mb"],
				params: { targetKb: 1024 },
			},
		],
	},
	{
		slug: "resize-image",
		category: "image",
		name: "Resize Image",
		title: "Resize Image Online — Change Photo Width & Height",
		tagline: "Change the width and height of any photo in pixels or percent.",
		description:
			"Resize images to exact pixels or by percentage, with ready-made sizes for passport photos, Instagram and WhatsApp. Free and private.",
		icon: "scaling",
		keywords: [
			"resize image",
			"image resizer",
			"change image size",
			"resize photo",
			"pixels",
			"passport photo size",
			"instagram size",
		],
		howTo: [
			{ title: "Add your image", text: "Drop a photo or tap to choose one from your device." },
			{
				title: "Set the new size",
				text: "Type a width and height, pick a percentage, or choose a ready-made size.",
			},
			{ title: "Download", text: "Save the resized image in JPG, PNG or WebP." },
		],
		about: {
			what: "Resizing changes how many pixels wide and tall a picture is. Smaller dimensions mean a smaller file and a perfect fit for forms, profiles and websites. We use high-quality resampling so edges stay sharp.",
			when: [
				"A form asks for a photo of exactly 413 × 531 pixels.",
				"You need a square picture for a profile or post.",
				"A huge camera photo is too big to upload.",
			],
		},
		faqs: [
			{
				q: "What does “keep aspect ratio” mean?",
				a: "It keeps the shape of your photo the same, so faces and objects don't look stretched. Change the width and the height updates automatically.",
			},
			{
				q: "Can I make an image bigger?",
				a: "Yes, but enlarging can't add detail that isn't there, so very large increases may look soft.",
			},
			{
				q: "What size is a passport photo in pixels?",
				a: "A common 35 × 45 mm passport photo at 300 DPI is 413 × 531 pixels. Check your country's rules, as they vary.",
			},
		],
		related: ["compress-image", "convert-image", "remove-background", "thumbnail-maker"],
		runtime: "browser",
		popular: 4,
		presets: [
			{
				slug: "passport-size",
				title: "Resize Photo to Passport Size",
				description:
					"Resize a photo to 35×45 mm passport size (413×531 px at 300 DPI). Free, private, works on phone.",
				intro:
					"Most passport and visa forms want a 35 × 45 mm photo. We've set the size to 413 × 531 pixels (300 DPI) — just add your picture and download.",
				keywords: ["passport size photo", "resize photo for passport", "35x45 photo"],
				params: { width: 413, height: 531, keepRatio: false, fit: "cover" },
			},
			{
				slug: "instagram-post",
				title: "Resize Image for Instagram (1080×1080)",
				description:
					"Resize photos to Instagram's 1080×1080 square post size without uploading them anywhere.",
				intro:
					"Instagram square posts look best at 1080 × 1080 pixels. Add a photo and we'll crop and resize it to fit perfectly.",
				keywords: ["instagram image size", "resize for instagram", "1080x1080"],
				params: { width: 1080, height: 1080, keepRatio: false, fit: "cover" },
			},
			{
				slug: "whatsapp-dp",
				title: "Resize Image for WhatsApp DP",
				description: "Make a square 500×500 profile picture for WhatsApp, free and private.",
				intro:
					"WhatsApp profile photos are shown as a circle cut from a square. Add your picture to make a crisp 500 × 500 square.",
				keywords: ["whatsapp dp size", "whatsapp profile photo size"],
				params: { width: 500, height: 500, keepRatio: false, fit: "cover" },
			},
		],
	},
	{
		slug: "convert-image",
		category: "image",
		name: "Convert Image",
		title: "Image Converter — JPG, PNG, WebP & HEIC Online",
		tagline: "Change photos between JPG, PNG, WebP and HEIC.",
		description:
			"Convert images between JPG, PNG and WebP, and turn iPhone HEIC photos into JPG. Free, batch-friendly and processed on your device.",
		icon: "repeat",
		keywords: [
			"convert image",
			"jpg to png",
			"png to jpg",
			"webp to jpg",
			"heic to jpg",
			"image converter",
			"jpg to webp",
		],
		howTo: [
			{ title: "Add images", text: "Drop one or many images — JPG, PNG, WebP, GIF or HEIC." },
			{ title: "Choose a format", text: "Pick JPG, PNG or WebP as the output." },
			{ title: "Download", text: "Save each file, or download all of them at once." },
		],
		about: {
			what: "Different apps want different image formats. JPG is best for photos, PNG keeps sharp edges and transparency, and WebP gives smaller files for the web. HEIC is the iPhone format that many websites can't open.",
			when: [
				"A website won't accept your iPhone HEIC photo.",
				"You need a PNG with a transparent background.",
				"You want smaller WebP images for your website.",
			],
		},
		faqs: [
			{
				q: "Will converting PNG to JPG lose transparency?",
				a: "JPG doesn't support transparency, so see-through areas become white. Choose PNG or WebP to keep them.",
			},
			{
				q: "Can I convert many images at once?",
				a: "Yes. Add as many as you like; each one is converted on your device.",
			},
			{
				q: "Is HEIC conversion private?",
				a: "Yes. HEIC photos are decoded in your browser — nothing is uploaded.",
			},
		],
		related: ["compress-image", "resize-image", "image-to-pdf", "remove-background"],
		runtime: "browser",
		popular: 7,
		presets: [
			{
				slug: "heic-to-jpg",
				title: "HEIC to JPG Converter",
				description:
					"Convert iPhone HEIC photos to JPG for free, right in your browser. No upload, no signup.",
				intro:
					"iPhones save photos as HEIC, which many websites and Windows apps can't open. Drop your HEIC photos to turn them into normal JPGs.",
				keywords: ["heic to jpg", "convert heic", "iphone photo to jpg"],
				params: { to: "jpg" },
			},
			{
				slug: "png-to-jpg",
				title: "PNG to JPG Converter",
				description: "Convert PNG images to smaller JPG files for free, with no upload.",
				intro: "JPG files are usually much smaller than PNG for photos. Drop your PNGs below.",
				keywords: ["png to jpg", "convert png to jpeg"],
				params: { to: "jpg" },
			},
			{
				slug: "jpg-to-png",
				title: "JPG to PNG Converter",
				description: "Convert JPG photos to PNG for free, right in your browser.",
				intro: "Need a PNG for editing or a design app? Drop your JPGs below.",
				keywords: ["jpg to png", "jpeg to png"],
				params: { to: "png" },
			},
			{
				slug: "webp-to-jpg",
				title: "WebP to JPG Converter",
				description: "Convert WebP images to JPG so they open everywhere. Free and private.",
				intro: "Saved an image that turned out to be WebP? Convert it to a JPG that opens in any app.",
				keywords: ["webp to jpg", "convert webp"],
				params: { to: "jpg" },
			},
			{
				slug: "jpg-to-webp",
				title: "JPG to WebP Converter",
				description: "Convert JPG and PNG to WebP for faster websites. Free, no upload.",
				intro: "WebP images are often 25–35% smaller than JPG at the same quality — great for websites.",
				keywords: ["jpg to webp", "png to webp", "convert to webp"],
				params: { to: "webp" },
			},
		],
	},
	{
		slug: "remove-background",
		category: "image",
		name: "Background Remover",
		title: "Remove Background from Image — Free AI Background Remover",
		tagline: "Cut out people, products and pets in one tap.",
		description:
			"Remove image backgrounds automatically with AI that runs in your browser. Get a transparent PNG or a new color background — free and private.",
		icon: "eraser",
		keywords: [
			"remove background",
			"background remover",
			"transparent background",
			"remove bg",
			"cut out image",
			"png transparent",
		],
		howTo: [
			{ title: "Add a photo", text: "Drop a photo of a person, product, pet or object." },
			{
				title: "Wait a moment",
				text: "The AI finds the subject. The first run downloads the AI model once (about 45MB), then it is saved for next time.",
			},
			{
				title: "Download",
				text: "Save a transparent PNG, or pick a background color first.",
			},
		],
		about: {
			what: "Our background remover uses an AI model that runs entirely in your browser. It finds the main subject and makes everything else transparent — ideal for product photos, profile pictures and stickers.",
			when: [
				"Selling online and need clean product photos.",
				"Making a profile picture with a plain background.",
				"Creating stickers, logos or presentation graphics.",
			],
		},
		faqs: [
			{
				q: "Why does the first use take longer?",
				a: "The AI model is downloaded once and then saved by your browser, so later uses start much faster.",
			},
			{
				q: "Is my photo sent to a server?",
				a: "No. Unlike most background removers, the AI runs on your own device.",
			},
			{
				q: "Does it work on phones?",
				a: "Yes, on most modern phones. Older or low-memory devices may be slow with very large photos.",
			},
		],
		related: ["resize-image", "compress-image", "convert-image", "thumbnail-maker"],
		runtime: "browser",
		popular: 3,
	},
];
