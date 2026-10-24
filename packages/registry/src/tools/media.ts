import type { ToolDef } from "../types";

export const mediaTools: ToolDef[] = [
	{
		slug: "video-compressor",
		category: "media",
		name: "Video Compressor",
		title: "Video Compressor — Reduce Video Size Online",
		tagline: "Shrink videos for WhatsApp, email and uploads.",
		description:
			"Compress MP4, MOV and WebM videos to a smaller size right in your browser. Choose quality and resolution — no upload, no watermark.",
		icon: "file-play",
		keywords: [
			"video compressor",
			"compress video",
			"reduce video size",
			"compress mp4",
			"video for whatsapp",
		],
		howTo: [
			{ title: "Add a video", text: "Drop an MP4, MOV or WebM file." },
			{ title: "Pick quality", text: "Choose a size preset or resolution like 720p." },
			{
				title: "Compress & download",
				text: "Wait for the progress bar, then save the smaller MP4.",
			},
		],
		about: {
			what: "Video compression re-encodes your video with modern settings and an optional smaller resolution. It uses your device's built-in video encoder, so it's fast and private.",
			when: [
				"A video is too big to send on WhatsApp or email.",
				"A website limits video uploads to a certain size.",
				"Saving storage on your phone or laptop.",
			],
		},
		faqs: [
			{
				q: "Is there a watermark?",
				a: "Never. Your video stays exactly yours.",
			},
			{
				q: "Which browsers are supported?",
				a: "Recent Chrome, Edge, Safari and Firefox. Very old browsers can't encode video and will show a message.",
			},
			{
				q: "How long does it take?",
				a: "It depends on video length and your device. A one-minute phone video usually takes under a minute.",
			},
		],
		related: ["audio-trimmer", "thumbnail-maker", "compress-image"],
		runtime: "browser",
		popular: 15,
	},
	{
		slug: "audio-trimmer",
		category: "media",
		name: "Audio Trimmer",
		title: "Audio Trimmer — Cut MP3 & Make Ringtones Online",
		tagline: "Cut the part of a song or recording you want.",
		description:
			"Trim MP3, WAV and M4A audio online with a visual waveform. Add fade in/out and save as MP3 or WAV — perfect for ringtones. Free and private.",
		icon: "audio-waveform",
		keywords: ["audio trimmer", "cut mp3", "trim audio", "ringtone maker", "audio cutter"],
		howTo: [
			{ title: "Add audio", text: "Drop an MP3, WAV, M4A or OGG file." },
			{
				title: "Select the part",
				text: "Drag the handles on the waveform and press play to check.",
			},
			{ title: "Save", text: "Add fades if you like, then download MP3 or WAV." },
		],
		about: {
			what: "The audio trimmer shows your sound as a waveform so you can see quiet and loud parts, then cuts exactly the section you choose.",
			when: [
				"Making a ringtone from a song.",
				"Removing silence from a voice recording.",
				"Cutting a clip for a video or presentation.",
			],
		},
		faqs: [
			{
				q: "Is my audio uploaded?",
				a: "No. Audio is decoded and trimmed in your browser.",
			},
			{
				q: "How long should a ringtone be?",
				a: "Around 20–30 seconds works on most phones.",
			},
		],
		related: ["video-compressor", "thumbnail-maker"],
		runtime: "browser",
	},
	{
		slug: "thumbnail-maker",
		category: "media",
		name: "Thumbnail Maker",
		title: "YouTube Thumbnail Maker — Free 1280×720 Designs",
		tagline: "Design eye-catching thumbnails with big, bold text.",
		description:
			"Create YouTube thumbnails at 1280×720 with templates, bold outlined text and your own photos or video frames. Download PNG or JPG free.",
		icon: "panels-top-left",
		keywords: [
			"thumbnail maker",
			"youtube thumbnail",
			"thumbnail creator",
			"1280x720",
			"video thumbnail",
		],
		howTo: [
			{ title: "Pick a template", text: "Start with a layout and colors you like." },
			{
				title: "Add image & text",
				text: "Use a photo or grab a frame from your video, then type your title.",
			},
			{ title: "Download", text: "Save a 1280×720 PNG or JPG under 2MB, ready for YouTube." },
		],
		about: {
			what: "A thumbnail is the first thing viewers see. This maker gives you a correctly sized canvas, readable outlined text and simple templates so anyone can make one in minutes.",
			when: [
				"Uploading a new YouTube video.",
				"Making a cover for a course or podcast episode.",
				"Creating a banner image for social posts.",
			],
		},
		faqs: [
			{
				q: "What size is a YouTube thumbnail?",
				a: "1280 × 720 pixels (16:9), under 2MB, as JPG or PNG.",
			},
			{
				q: "Can I use a frame from my video?",
				a: "Yes. Choose “From video”, scrub to the moment you want and use it as the background.",
			},
		],
		related: ["resize-image", "remove-background", "video-compressor"],
		runtime: "browser",
	},
];
