/**
 * Interactive TUI entry. Loaded lazily from bin.tsx so headless mode never
 * touches OpenTUI. Owns the renderer lifecycle — never call process.exit()
 * directly; renderer.destroy() restores the terminal.
 */

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app";

export async function runTui(): Promise<void> {
	const renderer = await createCliRenderer({ exitOnCtrlC: false, useMouse: true });
	createRoot(renderer).render(<App />);

	// Ctrl+C quits only when nothing is registered to cancel; a running tool
	// handles its own cancellation first (keys.ts dispatch order).
	process.on("SIGINT", () => {
		void renderer.destroy();
	});
	await new Promise<void>(() => {});
}
