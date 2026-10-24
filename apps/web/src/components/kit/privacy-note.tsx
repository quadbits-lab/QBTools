import { ShieldCheck } from "lucide-react";

export function PrivacyNote({
	text = "Processed on your device — 0 bytes uploaded",
}: {
	text?: string;
}) {
	return (
		<p className="flex items-center gap-2 text-sm font-semibold text-positive">
			<ShieldCheck className="size-4 shrink-0" />
			{text}
		</p>
	);
}
