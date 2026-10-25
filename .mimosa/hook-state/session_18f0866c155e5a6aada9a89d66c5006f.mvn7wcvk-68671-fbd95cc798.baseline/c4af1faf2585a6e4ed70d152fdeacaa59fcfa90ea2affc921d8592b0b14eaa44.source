import { Button } from "@qbtools/ui/button";
import {
	DEFAULT_THEME,
	onThemeChange,
	readThemeMode,
	setThemeMode,
	type ThemeMode,
} from "@qbtools/ui/theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const NEXT: Record<ThemeMode, ThemeMode> = { light: "dark", dark: "system", system: "light" };
const LABEL: Record<ThemeMode, string> = { light: "Light", dark: "Dark", system: "System" };

export function ThemeToggle({ className }: { className?: string } = {}) {
	const [mode, setMode] = useState<ThemeMode>(DEFAULT_THEME);

	useEffect(() => {
		setMode(readThemeMode());
		return onThemeChange(setMode);
	}, []);

	const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
	return (
		<Button
			variant="outline"
			size="icon-sm"
			className={className}
			onClick={() => setThemeMode(NEXT[mode])}
			aria-label={`Theme: ${LABEL[mode]}. Switch to ${LABEL[NEXT[mode]]}`}
			title={`Theme: ${LABEL[mode]}`}
		>
			<Icon className="size-4 transition-transform duration-200 hover:rotate-12" />
		</Button>
	);
}
