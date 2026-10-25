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
import { formatEvent, makeEvent } from "./console/events";
import { LOGO_HEIGHT, LOGO_LINES, LOGO_WIDTH, renderWordmark } from "./ui/ascii-logo";

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
		expect(LOGO_WIDTH).toBe(54);
		expect(LOGO_HEIGHT).toBe(5);
	});

	test("renders the words it is given", () => {
		const lines = renderWordmark("QB");
		expect(lines).toHaveLength(5);
		expect(lines[0]).toBe("#### ####");
	});
});

describe("console frame", () => {
	test("header carries the logo, title and version", async () => {
		await prepareEnv();
		const output = frame(<App />);
		expect(output).toContain("QBTools CLI - Private By Default");
		expect(output).toContain("Zero server calls.");
		expect(output).toContain("QB-CORE");
		expect(output).toContain("TELESCOPE: TOOLS");
		expect(output).toContain("SYS_STREAM: RING_BUFFER");
		expect(output).toContain("NETWORK EGRESS");
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
