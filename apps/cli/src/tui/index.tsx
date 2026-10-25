/**
 * Interactive TUI entry. Loaded lazily from bin.tsx so headless mode never
 * touches Ink. The renderer owns the process lifetime — never call
 * process.exit() from here.
 */

import { render } from "ink";
import { App } from "./app";

export async function runTui(): Promise<void> {
	const instance = render(<App />, {
		// Ctrl+C is handled by the app: it cancels a running tool first and
		// only quits when nothing is running.
		exitOnCtrlC: false,
		patchConsole: true,
	});
	await instance.waitUntilExit();
}
