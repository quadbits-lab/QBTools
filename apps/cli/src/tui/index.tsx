/**
 * Interactive TUI entry. Loaded lazily from bin.tsx so headless mode never
 * touches OpenTUI. Owns the renderer lifecycle — never call process.exit()
 * directly; renderer.destroy() restores the terminal.
 */

import { createCliRenderer, TextAttributes } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { CLI_NAME, CLI_VERSION } from "../version";

function App() {
	return (
		<box alignItems="center" justifyContent="center" flexGrow={1} flexDirection="column">
			<ascii-font font="tiny" text={CLI_NAME.toUpperCase()} />
			<text attributes={TextAttributes.DIM}>
				{`${CLI_NAME} ${CLI_VERSION} — interactive UI under construction`}
			</text>
			<text attributes={TextAttributes.DIM}>Use `qbtools help` for headless commands.</text>
		</box>
	);
}

export async function runTui(): Promise<void> {
	const renderer = await createCliRenderer({ exitOnCtrlC: true });
	createRoot(renderer).render(<App />);
}
