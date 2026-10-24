import { ShieldCheck } from "lucide-react";

export function PrivacyNote({
	text = "Processed on your device — 0 bytes uploaded",
}: {
	text?: string;
}) {
	return (
		<p className="label-mono flex items-center gap-2 text-foreground">
			<ShieldCheck className="size-4 shrink-0" strokeWidth={1.5} />
			{text}
		</p>
	);
}
