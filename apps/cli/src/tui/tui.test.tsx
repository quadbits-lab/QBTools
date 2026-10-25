/**
 * TUI tests — few and stable by design: the console frame, the hero, the
 * prompt filtering, the tool opening and the logo geometry.
 *
 * Static frames use Ink's renderToString; interactive cases use
 * ink-testing-library's fake stdin/stdout.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { renderToString } from "ink";
import { cleanup, render } from "ink-testing-library";
import { App } from "./app";
import { CommandBar } from "./console/command-bar";
import { formatEvent, makeEvent } from "./console/events";
import { KeyRouterProvider } from "./ui";
import { LOGO_ICON_HEIGHT, LOGO_ICON_ROWS, LOGO_ICON_WIDTH } from "./ui/app-logo";
import { LOGO_HEIGHT, LOGO_LINES, LOGO_ROWS, LOGO_WIDTH, renderWordmark } from "./ui/ascii-logo";

const savedEnv = { ...process.env };
let configDir: string;

afterEach(async () => {
	cleanup();
	for (const key of Object.keys(process.env)) {
		if (!(key in savedEnv)) delete process.env[key];
	}
	Object.assign(process.env, savedEnv);
	if (configDir) {
		await rm(configDir, { recursive: true, force: true });
		configDir = undefined as never;
	}
});

async function prepareEnv(): Promise<void> {
	configDir ??= await mkdtemp(join(tmpdir(), "qbtools-tui-test-"));
	process.env.QBTOOLS_CONFIG_DIR = configDir;
	process.env.QBTOOLS_NO_UPDATE_CHECK = "1";
}

function frame(element: React.ReactNode): string {
	return renderToString(element, { columns: 120 });
}

describe("wordmark", () => {
	test("every row has the same width", () => {
		const widths = new Set(LOGO_LINES.map((line) => line.length));
		expect(widths.size).toBe(1);
		expect(LOGO_WIDTH).toBe(60);
		expect(LOGO_HEIGHT).toBe(5);
	});

	test("renders the words it is given", () => {
		const lines = renderWordmark("QB");
		expect(lines).toHaveLength(5);
		expect(lines[0]).toBe("▄▀▀▀▀▄ ▀▀▀▀▄");
		expect(lines[4]).toBe(" ▀▀▀▀▄ ▀▄▄▄▀");
	});

	test("runs span the logo and stay achromatic", () => {
		for (const runs of LOGO_ROWS) {
			const width = runs.reduce((sum, run) => sum + run.text.length, 0);
			expect(width).toBe(LOGO_WIDTH);
		}
		for (const hue of LOGO_ROWS.flat().flatMap((run) => [run.color, run.background])) {
			if (hue === undefined) continue;
			const red = Number.parseInt(hue.slice(1, 3), 16);
			const green = Number.parseInt(hue.slice(3, 5), 16);
			const blue = Number.parseInt(hue.slice(5, 7), 16);
			expect(red).toBe(green);
			expect(green).toBe(blue);
		}
	});
});

describe("app logo", () => {
	test("squashes the mascot to five double-height rows", () => {
		expect(LOGO_ICON_HEIGHT).toBe(5);
		expect(LOGO_ICON_ROWS).toHaveLength(5);
	});

	test("every row spans the full art width", () => {
		for (const runs of LOGO_ICON_ROWS) {
			const width = runs.reduce((sum, run) => sum + run.text.length, 0);
			expect(width).toBe(LOGO_ICON_WIDTH);
		}
		expect(LOGO_ICON_WIDTH).toBe(13);
	});

	test("the mascot is rendered in achromatic tones", () => {
		const colors = new Set(
			LOGO_ICON_ROWS.flat()
				.map((run) => run.color)
				.filter((color) => color !== undefined),
		);
		expect(colors.size).toBe(2);
		for (const color of colors) {
			const red = Number.parseInt(color.slice(1, 3), 16);
			const green = Number.parseInt(color.slice(3, 5), 16);
			const blue = Number.parseInt(color.slice(5, 7), 16);
			expect(red).toBe(green);
			expect(green).toBe(blue);
		}
	});
});

describe("console frame", () => {
	test("header carries the logo, title and version", async () => {
		await prepareEnv();
		const output = frame(<App />);
		expect(output).toContain("QBTools CLI");
		for (const line of LOGO_LINES) expect(output).toContain(line);
		expect(output).toContain("42 tools");
		expect(output).toContain("v0.2.0");
		expect(output).toContain("QB-CORE");
		expect(output).toContain("TELESCOPE: TOOLS");
		expect(output).toContain("SYS_STREAM: RING_BUFFER");
		expect(output).toContain("NETWORK EGRESS");
	});

	test("boots with a colored single-line prompt", async () => {
		await prepareEnv();
		const output = frame(<App />);
		expect(output).toContain("⌘");
		expect(output).toContain("❯");
		expect(output).toContain("⏎");
	});

	test("groups the tools into category blocks of cards", async () => {
		await prepareEnv();
		const { lastFrame } = render(<App />);
		await delay(120);
		const output = lastFrame();
		expect(output).toContain("IMAGE TOOLS");
		expect(output).toContain(".img (8)");
		expect(output).toContain("compress-image");
		expect(output).toContain("Showing 42 of 42 tools");
	});
});

describe("prompt bar", () => {
	const HINTS = [
		{ keys: "<Enter>", label: "Run" },
		{ keys: "<Tab>", label: "Next" },
		{ keys: "<C-?>", label: "Help" },
	];

	function promptFrame(boxed: boolean, width: number): string {
		return renderToString(
			<KeyRouterProvider>
				<CommandBar
					width={width}
					boxed={boxed}
					userAt="quadbits@Alans-MacBook-Pro-2"
					dir="~/RD/QBTools/apps/cli"
					program="qbtools"
					value=""
					onChange={() => {}}
					focused
					hints={HINTS}
				/>
			</KeyRouterProvider>,
			{ columns: width },
		);
	}

	test("the framed prompt draws label, arrow and key chips", () => {
		const output = promptFrame(true, 100);
		const lines = output.trimEnd().split("\n");
		expect(output).toContain("⌘ PROMPT");
		expect(output).toContain("❯");
		expect(output).toContain("⏎");
		expect(output).toContain("╰┄┄");
		expect(lines).toHaveLength(3); // label + one prompt row + bottom rule
	});

	test("the compact prompt stays on one line with chips", () => {
		const lines = promptFrame(false, 100).trimEnd().split("\n");
		expect(lines).toHaveLength(1);
		expect(lines[0]).toContain("❯");
		expect(lines[0]).toContain("⏎");
	});

	test("the shell yields before the line wraps", () => {
		const output = promptFrame(false, 60);
		expect(output.trimEnd().split("\n")).toHaveLength(1);
		expect(output).toContain("❯");
	});
});

describe("console interaction", () => {
	test("boots with system events in the log", async () => {
		await prepareEnv();
		const { lastFrame } = render(<App />);
		await delay(120);
		expect(lastFrame()).toContain("SYS_BOOT");
		expect(lastFrame()).toContain("NET_POLICIES");
	});

	test("typing filters the tool list", async () => {
		await prepareEnv();
		const { stdin, lastFrame } = render(<App />);
		await delay(120);
		stdin.write("qr");
		await delay(120);
		expect(lastFrame()).toContain("QR Code Generator");
	});

	test("a category prefix narrows the board", async () => {
		await prepareEnv();
		const { stdin, lastFrame } = render(<App />);
		await delay(120);
		stdin.write("pdf:");
		await delay(120);
		expect(lastFrame()).toContain("PDF TOOLS");
		expect(lastFrame()).toContain("merge-pdf");
		expect(lastFrame()).not.toContain("compress-image");
		expect(lastFrame()).not.toContain("IMAGE TOOLS");
	});

	test("enter opens the highlighted card without typing", async () => {
		await prepareEnv();
		const { stdin, lastFrame } = render(<App />);
		await delay(120);
		// Navigate down one card row, then open it with Enter alone.
		stdin.write("\x1b[B");
		await delay(80);
		stdin.write("\r");
		await delay(200);
		expect(lastFrame()).toContain("OPEN: img:og-banner-maker");
		expect(lastFrame()).toContain("INSPECTOR: OPEN");
	});

	test("arrows move across the card grid", async () => {
		await prepareEnv();
		const { stdin, lastFrame } = render(<App />);
		await delay(120);
		expect(lastFrame()).toContain("img:compress-image");
		stdin.write("\x1b[C");
		await delay(80);
		expect(lastFrame()).toContain("img:resize-image");
		stdin.write("\x1b[B");
		await delay(80);
		expect(lastFrame()).toContain("img:favicon-generator");
	});

	test("enter opens the tool in the inspector", async () => {
		await prepareEnv();
		const { stdin, lastFrame } = render(<App />);
		await delay(120);
		stdin.write("word");
		await delay(120);
		stdin.write("\r");
		await delay(200);
		expect(lastFrame()).toContain("OPEN: txt:word-counter");
		expect(lastFrame()).toContain("Word Counter");
	});

	test("slash commands print into the log", async () => {
		await prepareEnv();
		const { stdin, lastFrame } = render(<App />);
		await delay(120);
		stdin.write("/help");
		await delay(120);
		stdin.write("\r");
		await delay(200);
		expect(lastFrame()).toContain("Ctrl+C cancel/quit");
		expect(lastFrame()).toContain("/settings /account /cleanup");
	});
});

describe("events", () => {
	test("events render as timestamped lines", () => {
		const line = formatEvent(makeEvent("RUN", "compress-image — starting"));
		expect(line).toMatch(/^\[\d{2}:\d{2}:\d{2}\.\d{3}\] RUN: compress-image — starting$/);
	});
});
