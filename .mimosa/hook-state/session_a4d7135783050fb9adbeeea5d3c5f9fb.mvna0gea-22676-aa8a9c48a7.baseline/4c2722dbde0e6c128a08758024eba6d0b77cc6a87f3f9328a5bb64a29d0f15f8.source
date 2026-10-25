import { Button, type ButtonProps } from "@qbtools/ui/button";
import { toast } from "@qbtools/ui/toaster";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
	text,
	label = "Copy",
	...props
}: { text: string; label?: string } & Omit<ButtonProps, "onClick">) {
	const [copied, setCopied] = useState(false);
	return (
		<Button
			variant="secondary"
			{...props}
			disabled={!text || props.disabled}
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(text);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				} catch {
					toast.error("Couldn't copy — select the text and copy it manually.");
				}
			}}
		>
			{copied ? <Check /> : <Copy />}
			{copied ? "Copied!" : label}
		</Button>
	);
}
