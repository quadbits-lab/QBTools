import { onThemeChange, readThemeMode, setThemeMode, type ThemeMode } from "@qbtools/ui/theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@qbtools/ui/button";

const NEXT: Record<ThemeMode, ThemeMode> = { light: "dark", dark: "system", system: "light" };
const LABEL: Record<ThemeMode, string> = { light: "Light", dark: "Dark", system: "System" };

export function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>("system");

	useEffect(() => {
		setMode(readThemeMode());
		return onThemeChange(setMode);
	}, []);

	const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => setThemeMode(NEXT[mode])}
			aria-label={`Theme: ${LABEL[mode]}. Switch to ${LABEL[NEXT[mode]]}`}
			title={`Theme: ${LABEL[mode]}`}
		>
			<Icon />
		</Button>
	);
}
