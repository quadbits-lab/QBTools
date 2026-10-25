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
import { CATEGORY_COLORS, categoryColor, GRADIENT, PALETTE, theme } from "./theme";
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
	// Pin the console size — ambient pty heights differ between contexts and
	// ink's renderToString clips to them; the pin makes static frames full and
	// deterministic. afterEach restores the env between tests.
	process.env.QBTOOLS_TUI_SIZE = "120x40";
	return renderToString(element, { columns: 120 });
}

/** ANSI codes (SGR + cursor moves) split colored runs; stripped for exact matches. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: matches ANSI escape codes
const CSI = /\x1B\[[0-9;:]*[A-Za-z]/g;

function plain(value: string | undefined): string {
	return value?.replace(CSI, "") ?? "";
}

/** Every `#rrggbb` reachable from a value — used to keep the palette closed. */
function hexes(value: unknown, out: string[] = []): string[] {
	if (typeof value === "string") {
		if (/^#[0-9a-f]{6}$/i.test(value)) out.push(value);
	} else if (Array.isArray(value)) {
		for (const item of value) hexes(item, out);
	} else if (value && typeof value === "object") {
		for (const item of Object.values(value)) hexes(item, out);
	}
	return out;
}

/** WCAG relative luminance of a `#rrggbb` color. */
function luminance(hex: string): number {
	const value = hex.replace("#", "");
	const channels = [0, 2, 4].map((offset) => {
		const channel = Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
		return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	const [r = 0, g = 0, b = 0] = channels;
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two `#rrggbb` colors. */
function contrast(a: string, b: string): number {
	const values = [luminance(a), luminance(b)].sort((left, right) => right - left);
	const lighter = values[0] ?? 0;
	const darker = values[1] ?? 0;
	return (lighter + 0.05) / (darker + 0.05);
}

describe("wordmark", () => {
	test("every row has the same width", () => {
		const widths = new Set(LOGO_LINES.map((line) => line.length));
		expect(widths.size).toBe(1);
		expect(LOGO_WIDTH).toBe(44);
		expect(LOGO_HEIGHT).toBe(3);
	});

	test("renders the words it is given", () => {
		const lines = renderWordmark("QB");
		expect(lines).toHaveLength(3);
		expect(lines[0]).toBe("█▀█  █▀▄");
		expect(lines[2]).toBe("▀▀█▄ █▄█");
	});

	test("runs span the logo and stay in the palette", () => {
		for (const runs of LOGO_ROWS) {
			const width = runs.reduce((sum, run) => sum + run.text.length, 0);
			expect(width).toBe(LOGO_WIDTH);
		}
		const tones = new Set<string>(PALETTE);
		for (const hue of LOGO_ROWS.flat().flatMap((run) => [run.color, run.background])) {
			if (hue === undefined) continue;
			expect(tones.has(hue.toLowerCase())).toBe(true);
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

	test("the mascot is rendered in palette tones", () => {
		const colors = new Set(
			LOGO_ICON_ROWS.flat()
				.map((run) => run.color)
				.filter((color) => color !== undefined),
		);
		expect(colors.size).toBe(2);
		const tones = new Set<string>(PALETTE);
		for (const color of colors) {
			expect(tones.has(color.toLowerCase())).toBe(true);
		}
	});
});

describe("theme", () => {
	const TONES = new Set<string>(PALETTE);

	test("the palette is a unique set of lowercase hex colors", () => {
		expect(TONES.size).toBe(PALETTE.length);
		for (const color of PALETTE) expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});

	test("every color token comes from the closed palette", () => {
		const colors = hexes({
			theme,
			gradient: GRADIENT,
			categories: CATEGORY_COLORS,
			wordmark: LOGO_ROWS,
			mascot: LOGO_ICON_ROWS,
		});
		expect(colors.length).toBeGreaterThan(10);
		for (const color of colors) expect(TONES.has(color)).toBe(true);
	});

	test("grounds the chrome in Gemini's default dark theme", () => {
		expect(theme.text.primary).toBe("#ffffff");
		expect(theme.text.secondary).toBe("#afafaf");
		expect(theme.border.default).toBe("#878787");
		expect(theme.surface.chip).toBe("#5f5f5f");
		expect(theme.ui.gradient).toEqual(["#4796e4", "#847ace", "#c3677f"]);
	});

	test("copy stays legible on every fill", () => {
		const pairs: Array<[string, string]> = [
			[theme.text.primary, theme.surface.onHighlight],
			[theme.text.secondary, theme.surface.onHighlight],
			[theme.text.muted, theme.surface.onHighlight],
			[theme.surface.onHighlight, theme.surface.highlight],
			[theme.surface.onChip, theme.surface.chip],
			[theme.surface.onHighlight, theme.status.success],
			[theme.surface.onHighlight, theme.text.accent],
			[theme.surface.onHighlight, theme.text.active],
		];
		for (const [copy, fill] of pairs) {
			expect(contrast(copy, fill)).toBeGreaterThanOrEqual(4.5);
		}
	});

	test("every registry category resolves to a palette hue", () => {
		const categories = [
			"image",
			"pdf",
			"text",
			"calculators",
			"generators",
			"media",
			"security",
			"developer",
		];
		for (const category of categories) expect(TONES.has(categoryColor(category))).toBe(true);
		expect(categoryColor("not-a-category")).toBe(theme.text.active);
	});
});

describe("console frame", () => {
	test("header carries the logo, title and version", async () => {
		await prepareEnv();
		const output = plain(frame(<App />));
		expect(output).toContain("QBTools CLI");
		for (const line of LOGO_LINES) expect(output).toContain(line);
		expect(output).toContain("42 tools");
		expect(output).toContain("v0.3.0");
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
		expect(plain(lastFrame())).toContain("OPEN: img:og-banner-maker");
		expect(plain(lastFrame())).toContain("INSPECTOR: OPEN");
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
		expect(plain(lastFrame())).toContain("OPEN: txt:word-counter");
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
