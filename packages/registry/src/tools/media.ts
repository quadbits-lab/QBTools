import type { ToolDef } from "../types";

export const mediaTools: ToolDef[] = [
	{
		slug: "video-compressor",
		category: "media",
		name: "Video Compressor",
		title: "Video Compressor — Reduce Video Size Online",
		tagline: "Shrink videos for WhatsApp, email and uploads.",
		description:
			"Compress videos locally to MP4 or native WebM. Choose quality and resolution, with an optional MP4 compatibility mode. No upload or watermark.",
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
			what: "Video compression re-encodes with native codecs where available. Compatibility mode supports MP4 conversion for files up to 128 MiB. WebM uses native VP9/Opus support.",
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
				a: "Recent Chrome, Edge, Safari and Firefox support different codecs. Native mode checks capabilities; try Compatibility mode for MP4 conversion.",
			},
			{
				q: "How long does it take?",
				a: "It depends on file contents, codec, processing mode and device. Compatibility mode may take longer than native processing.",
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
			"Trim MP3, WAV and M4A audio online with a visual waveform. Add fade in/out and save as MP3, WAV or FLAC — perfect for ringtones. Free and private.",
		icon: "audio-waveform",
		keywords: ["audio trimmer", "cut mp3", "trim audio", "ringtone maker", "audio cutter"],
		howTo: [
			{ title: "Add audio", text: "Drop an MP3, WAV, M4A or OGG file." },
			{
				title: "Select the part",
				text: "Drag the handles on the waveform and press play to check.",
			},
			{ title: "Save", text: "Add fades if you like, then download MP3, WAV or FLAC." },
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
	{
		slug: "video-trimmer",
		category: "media",
		name: "Video Trimmer",
		title: "Video Trimmer — Cut & Slice Video Clips Online",
		tagline: "Trim, cut and shorten MP4 & WebM videos with timeline preview.",
		description:
			"Cut the exact part of a video you need right in your browser. Visual timeline with start and end handles — fast, private, and no watermark.",
		icon: "scissors",
		keywords: ["video trimmer", "cut video online", "trim mp4", "video cutter", "shorten video"],
		howTo: [
			{ title: "Upload video", text: "Drop an MP4, WebM or MOV video file." },
			{
				title: "Set start & end",
				text: "Drag the timeline handles or adjust timestamps to frame-accuracy.",
			},
			{
				title: "Trim & save",
				text: "Export the selected clip as MP4. Re-encoding may change quality.",
			},
		],
		about: {
			what: "The Video Trimmer extracts precisely the section of video you select using your device's native WebCodecs acceleration. It runs 100% locally with zero server lag.",
			when: [
				"Removing awkward pauses from the start or end of a recording.",
				"Clipping highlights for Instagram, TikTok, or YouTube Shorts.",
				"Shortening long video files to meet upload size limits.",
			],
		},
		faqs: [
			{
				q: "Is there any watermark on trimmed videos?",
				a: "Never. Your video remains completely watermark-free.",
			},
			{
				q: "Does trimming degrade video quality?",
				a: "The tool may re-encode video to export the selected range. Quality depends on the source and encoder; keep the original.",
			},
		],
		related: ["video-compressor", "video-to-audio", "video-to-gif"],
		runtime: "browser",
		popular: 14,
		isNew: true,
	},
	{
		slug: "video-to-audio",
		category: "media",
		name: "Video to Audio",
		title: "Video to Audio Extractor — Convert MP4 to MP3 Online",
		tagline: "Extract soundtrack or speech from supported videos.",
		description:
			"Extract MP3, WAV or FLAC audio from supported videos on your device. Optional compatibility mode supports files up to 128 MiB.",
		icon: "audio-waveform",
		keywords: [
			"video to audio",
			"mp4 to mp3",
			"extract audio from video",
			"video sound extractor",
			"convert video to mp3",
		],
		howTo: [
			{
				title: "Select video",
				text: "Drop an MP4, WebM, MOV or MKV file containing a supported audio track.",
			},
			{ title: "Choose format", text: "Pick MP3, uncompressed WAV or losslessly compressed FLAC." },
			{ title: "Download audio", text: "Save the soundtrack directly to your device." },
		],
		about: {
			what: "Video to Audio reads the selected audio track and converts it without processing video frames. WAV and FLAC preserve decoded audio without restoring quality lost in the source.",
			when: [
				"Saving music or dialogue from a video recording.",
				"Creating podcasts from recorded video lectures or interviews.",
				"Extracting background audio for creative editing.",
			],
		},
		faqs: [
			{
				q: "How fast is audio extraction?",
				a: "There is no upload wait. Processing time depends on the file, selected format, browser and device.",
			},
			{
				q: "Which audio formats are supported?",
				a: "MP3, 16-bit PCM WAV, and FLAC. WAV and FLAC avoid additional lossy compression.",
			},
		],
		related: ["audio-trimmer", "video-trimmer", "video-compressor"],
		runtime: "browser",
		popular: 13,
		isNew: true,
	},
	{
		slug: "video-to-gif",
		category: "media",
		name: "Video to GIF",
		title: "Video to GIF Converter — Create Animated GIFs Online",
		tagline: "Convert video clips into high-quality animated GIFs.",
		description:
			"Turn any video segment into an animated GIF online. Customize frame rate, width, and playback looping with instant local preview.",
		icon: "file-play",
		keywords: [
			"video to gif",
			"mp4 to gif",
			"make gif from video",
			"animated gif maker",
			"video gif converter",
		],
		howTo: [
			{ title: "Choose video", text: "Drop any short video clip." },
			{ title: "Set range & FPS", text: "Select up to 15 seconds, pick 10–24 FPS." },
			{ title: "Export GIF", text: "Download the animated GIF ready for sharing." },
		],
		about: {
			what: "Video to GIF samples frames from your video and quantizes colors into an optimized GIF palette. Great for memes, documentation, and product demos.",
			when: [
				"Creating animated reaction GIFs for Slack, Discord, or Twitter.",
				"Embedding lightweight product feature loops in documentation.",
				"Sharing video moments without requiring a media player.",
			],
		},
		faqs: [
			{
				q: "What is the recommended video length for GIFs?",
				a: "GIFs work best for clips under 10–15 seconds to keep file sizes manageable.",
			},
			{
				q: "Will the GIF loop automatically?",
				a: "Yes. GIFs are generated with standard continuous looping enabled.",
			},
		],
		related: ["video-trimmer", "video-compressor", "thumbnail-maker"],
		runtime: "browser",
		isNew: true,
	},
];
