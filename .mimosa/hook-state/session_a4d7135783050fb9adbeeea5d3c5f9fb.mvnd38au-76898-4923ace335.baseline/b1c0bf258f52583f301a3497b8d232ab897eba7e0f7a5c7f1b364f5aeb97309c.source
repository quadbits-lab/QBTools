export type QrKind = "url" | "text" | "wifi" | "contact" | "email" | "phone";

export interface WifiPayload {
	ssid: string;
	password: string;
	encryption: "WPA" | "WEP" | "nopass";
	hidden: boolean;
}

export interface ContactPayload {
	firstName: string;
	lastName: string;
	phone: string;
	email: string;
	organization: string;
	title: string;
	url: string;
}

/** Escape \ ; , : " per the WiFi QR (MECARD-style) spec. */
const escapeWifi = (value: string) => value.replace(/([;,:"])/g, "\\$1");

/** Escape per vCard 3.0 (RFC 2426). */
const escapeVcard = (value: string) =>
	value
		.replace(/\\/g, "\\\\")
		.replace(/\n/g, "\\n")
		.replace(/([,;])/g, "\\$1");

export function wifiPayload({ ssid, password, encryption, hidden }: WifiPayload): string {
	const parts = [`T:${encryption}`, `S:${escapeWifi(ssid)}`];
	if (encryption !== "nopass") parts.push(`P:${escapeWifi(password)}`);
	if (hidden) parts.push("H:true");
	return `WIFI:${parts.join(";")};;`;
}

export function vcardPayload(c: ContactPayload): string {
	const lines = [
		"BEGIN:VCARD",
		"VERSION:3.0",
		`N:${escapeVcard(c.lastName)};${escapeVcard(c.firstName)};;;`,
		`FN:${escapeVcard(`${c.firstName} ${c.lastName}`.trim())}`,
	];
	if (c.organization) lines.push(`ORG:${escapeVcard(c.organization)}`);
	if (c.title) lines.push(`TITLE:${escapeVcard(c.title)}`);
	if (c.phone) lines.push(`TEL;TYPE=CELL:${escapeVcard(c.phone)}`);
	if (c.email) lines.push(`EMAIL:${escapeVcard(c.email)}`);
	if (c.url) lines.push(`URL:${escapeVcard(c.url)}`);
	lines.push("END:VCARD");
	return lines.join("\r\n");
}

/** Add https:// when the user typed a bare domain. */
export function normalizeUrl(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return "";
	return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
