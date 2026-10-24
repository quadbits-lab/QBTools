import { downloadBlob } from "@qbtools/engines/files";
import { normalizeUrl, type QrKind, vcardPayload, wifiPayload } from "@qbtools/engines/generators";
import { Button } from "@qbtools/ui/button";
import { Input, Select, Textarea } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Segmented } from "@qbtools/ui/segmented";
import { Switch } from "@qbtools/ui/switch";
import { Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { Notice } from "#/components/kit/notice";
import { PrivacyNote } from "#/components/kit/privacy-note";

const KINDS: { value: QrKind; label: string }[] = [
	{ value: "url", label: "Link" },
	{ value: "text", label: "Text" },
	{ value: "wifi", label: "WiFi" },
	{ value: "contact", label: "Contact" },
	{ value: "email", label: "Email" },
	{ value: "phone", label: "Phone" },
];

/** Relative luminance contrast, to warn about codes phones can't read. */
function contrast(a: string, b: string) {
	const lum = (hex: string) => {
		const n = Number.parseInt(hex.slice(1), 16);
		const [r, g, bl] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
			const c = v / 255;
			return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		}) as [number, number, number];
		return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
	};
	const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
	return (x + 0.05) / (y + 0.05);
}

export default function QrCodeGenerator() {
	const [kind, setKind] = useState<QrKind>("url");
	const [url, setUrl] = useState("https://example.com");
	const [text, setText] = useState("");
	const [wifi, setWifi] = useState({
		ssid: "",
		password: "",
		encryption: "WPA" as "WPA" | "WEP" | "nopass",
		hidden: false,
	});
	const [contact, setContact] = useState({
		firstName: "",
		lastName: "",
		phone: "",
		email: "",
		organization: "",
		title: "",
		url: "",
	});
	const [email, setEmail] = useState({ to: "", subject: "", body: "" });
	const [phone, setPhone] = useState("");
	const [fg, setFg] = useState("#111827");
	const [bg, setBg] = useState("#ffffff");
	const [ecl, setEcl] = useState<"L" | "M" | "Q" | "H">("M");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState<string | null>(null);

	const payload = useMemo(() => {
		switch (kind) {
			case "url":
				return normalizeUrl(url);
			case "text":
				return text;
			case "wifi":
				return wifi.ssid ? wifiPayload(wifi) : "";
			case "contact":
				return contact.firstName || contact.lastName || contact.phone || contact.email
					? vcardPayload(contact)
					: "";
			case "email": {
				const params = new URLSearchParams();
				if (email.subject) params.set("subject", email.subject);
				if (email.body) params.set("body", email.body);
				const query = params.toString().replace(/\+/g, "%20");
				return email.to ? `mailto:${email.to}${query ? `?${query}` : ""}` : "";
			}
			case "phone":
				return phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
		}
	}, [kind, url, text, wifi, contact, email, phone]);

	useEffect(() => {
		if (!canvasRef.current) return;
		if (!payload) {
			canvasRef.current
				.getContext("2d")
				?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
			return;
		}
		QRCode.toCanvas(canvasRef.current, payload, {
			width: 320,
			margin: 2,
			errorCorrectionLevel: ecl,
			color: { dark: fg, light: bg },
		})
			.then(() => setError(null))
			.catch(() => setError("That's too much information for one QR code. Please shorten it."));
	}, [payload, fg, bg, ecl]);

	const downloadPng = async () => {
		const dataUrl = await QRCode.toDataURL(payload, {
			width: 1024,
			margin: 2,
			errorCorrectionLevel: ecl,
			color: { dark: fg, light: bg },
		});
		downloadBlob(await (await fetch(dataUrl)).blob(), "qr-code.png");
	};
	const downloadSvg = async () => {
		const svg = await QRCode.toString(payload, {
			type: "svg",
			margin: 2,
			errorCorrectionLevel: ecl,
			color: { dark: fg, light: bg },
		});
		downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "qr-code.svg");
	};

	const lowContrast = contrast(fg, bg) < 4;

	return (
		<div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
			<div className="flex flex-col gap-5">
				<Segmented label="QR code type" value={kind} onChange={setKind} options={KINDS} />
				{kind === "url" && (
					<Field label="Website link" htmlFor="qr-url">
						<Input
							id="qr-url"
							type="url"
							inputMode="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="example.com"
						/>
					</Field>
				)}
				{kind === "text" && (
					<Field label="Text" htmlFor="qr-text">
						<Textarea
							id="qr-text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Any message…"
						/>
					</Field>
				)}
				{kind === "wifi" && (
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Network name (SSID)" htmlFor="qr-ssid">
							<Input
								id="qr-ssid"
								value={wifi.ssid}
								onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
							/>
						</Field>
						<Field label="Security" htmlFor="qr-enc">
							<Select
								id="qr-enc"
								value={wifi.encryption}
								onChange={(e) =>
									setWifi({ ...wifi, encryption: e.target.value as typeof wifi.encryption })
								}
							>
								<option value="WPA">WPA / WPA2 / WPA3</option>
								<option value="WEP">WEP</option>
								<option value="nopass">No password</option>
							</Select>
						</Field>
						{wifi.encryption !== "nopass" && (
							<Field label="Password" htmlFor="qr-pass">
								<Input
									id="qr-pass"
									value={wifi.password}
									onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
									autoComplete="off"
								/>
							</Field>
						)}
						<label className="flex items-center gap-3 self-end pb-3 font-medium">
							<Switch
								checked={wifi.hidden}
								onCheckedChange={(hidden) => setWifi({ ...wifi, hidden })}
							/>{" "}
							Hidden network
						</label>
					</div>
				)}
				{kind === "contact" && (
					<div className="grid gap-4 sm:grid-cols-2">
						{(
							[
								["firstName", "First name"],
								["lastName", "Last name"],
								["phone", "Phone"],
								["email", "Email"],
								["organization", "Company"],
								["title", "Job title"],
								["url", "Website"],
							] as const
						).map(([key, label]) => (
							<Field key={key} label={label} htmlFor={`qr-${key}`}>
								<Input
									id={`qr-${key}`}
									value={contact[key]}
									onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
								/>
							</Field>
						))}
					</div>
				)}
				{kind === "email" && (
					<div className="grid gap-4">
						<Field label="Send to" htmlFor="qr-mail">
							<Input
								id="qr-mail"
								type="email"
								value={email.to}
								onChange={(e) => setEmail({ ...email, to: e.target.value })}
							/>
						</Field>
						<Field label="Subject" htmlFor="qr-subj">
							<Input
								id="qr-subj"
								value={email.subject}
								onChange={(e) => setEmail({ ...email, subject: e.target.value })}
							/>
						</Field>
						<Field label="Message" htmlFor="qr-body">
							<Textarea
								id="qr-body"
								value={email.body}
								onChange={(e) => setEmail({ ...email, body: e.target.value })}
								className="min-h-24"
							/>
						</Field>
					</div>
				)}
				{kind === "phone" && (
					<Field label="Phone number" htmlFor="qr-tel">
						<Input
							id="qr-tel"
							type="tel"
							inputMode="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+1 555 123 4567"
						/>
					</Field>
				)}
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
					<Field label="Code color" htmlFor="qr-fg">
						<Input
							id="qr-fg"
							type="color"
							value={fg}
							onChange={(e) => setFg(e.target.value)}
							className="cursor-pointer p-1"
						/>
					</Field>
					<Field label="Background" htmlFor="qr-bg">
						<Input
							id="qr-bg"
							type="color"
							value={bg}
							onChange={(e) => setBg(e.target.value)}
							className="cursor-pointer p-1"
						/>
					</Field>
					<Field label="Error correction" htmlFor="qr-ecl" className="col-span-2 sm:col-span-1">
						<Select id="qr-ecl" value={ecl} onChange={(e) => setEcl(e.target.value as typeof ecl)}>
							<option value="L">Low (7%)</option>
							<option value="M">Medium (15%)</option>
							<option value="Q">High (25%)</option>
							<option value="H">Max (30%)</option>
						</Select>
					</Field>
				</div>
				{lowContrast && (
					<Notice tone="caution">
						These colors are too similar — some phones may not scan the code.
					</Notice>
				)}
			</div>
			<div className="flex flex-col items-center gap-4">
				<div className="border border-border bg-white p-4">
					<canvas
						ref={canvasRef}
						width={320}
						height={320}
						className="size-64 sm:size-80"
						aria-label="QR code preview"
						role="img"
					/>
				</div>
				{error && <Notice tone="critical">{error}</Notice>}
				{!payload && (
					<p className="text-muted-foreground">Fill in the details to create your QR code.</p>
				)}
				<div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
					<Button
						size="lg"
						className="flex-1"
						onClick={downloadPng}
						disabled={!payload || Boolean(error)}
					>
						<Download /> PNG
					</Button>
					<Button
						size="lg"
						variant="secondary"
						className="flex-1"
						onClick={downloadSvg}
						disabled={!payload || Boolean(error)}
					>
						<Download /> SVG
					</Button>
				</div>
				<PrivacyNote text="Made on your device. Never expires, no tracking." />
			</div>
		</div>
	);
}
