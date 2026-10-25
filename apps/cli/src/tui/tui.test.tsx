/**
 * TUI snapshot tests — few and stable by design: dashboard list, the tool
 * form, output rendering, and the shell chrome.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTestRenderer } from "@opentui/core/testing";
import { createRoot } from "@opentui/react";
import { App } from "./app";
import { OutputPanel, renderAsciiTable } from "./components";
import { ToolListScreen } from "./screens/browse";
import { DashboardScreen } from "./screens/dashboard";
import { ToolScreen } from "./screens/tool";

const savedEnv = { ...process.env };
let configDir: string;

afterEach(async () => {
	for (const key of Object.keys(process.env)) {
		if (!(key in savedEnv)) delete process.env[key];
	}
	Object.assign(process.env, savedEnv);
	if (configDir) {
		await rm(configDir, { recursive: true, force: true });
		configDir = undefined as never;
	}
});

async function render(element: React.ReactNode, width = 80, height = 24) {
	configDir ??= await mkdtemp(join(tmpdir(), "qbtools-tui-test-"));
	process.env.QBTOOLS_CONFIG_DIR = configDir;
	process.env.QBTOOLS_NO_UPDATE_CHECK = "1";
	const setup: { renderer: unknown; renderOnce(): Promise<void>; captureCharFrame(): string } =
		await createTestRenderer({ width, height });
	createRoot(setup.renderer as never).render(element);
	await setup.renderOnce();
	return setup;
}

describe("TUI screens", () => {
	test("dashboard lists popular tools", async () => {
		const setup = await render(<DashboardScreen width={80} onOpenTool={() => {}} />);
		const frame = setup.captureCharFrame();
		expect(frame).toContain("Popular tools");
		expect(frame).toContain("Merge PDF");
	});

	test("category list shows tools and taglines", async () => {
		const setup = await render(
			<ToolListScreen
				title="Calculators"
				tools={[
					{
						slug: "bmi-calculator",
						name: "BMI Calculator",
						note: "Body mass index with healthy range",
					},
					{
						slug: "age-calculator",
						name: "Age Calculator",
						note: "Exact age in years, months and days",
					},
				]}
				onOpenTool={() => {}}
			/>,
		);
		const frame = setup.captureCharFrame();
		expect(frame).toContain("Calculators");
		expect(frame).toContain("BMI Calculator");
		// the highlighted row's tagline comes from the real registry entry
		expect(frame).toContain("Check your BMI");
	});

	test("tool form renders fields for word-counter", async () => {
		const setup = await render(<ToolScreen slug="word-counter" width={80} />);
		const frame = setup.captureCharFrame();
		expect(frame).toContain("Word Counter");
		expect(frame).toContain("/word-counter");
		expect(frame).toContain("Text");
		expect(frame).toContain("local");
	});
});

describe("output rendering", () => {
	test("ascii table aligns columns", () => {
		const table = renderAsciiTable(["A", "BB"], [["1", "2"]]);
		expect(table.split("\n")[0]).toBe("A  BB");
		expect(table.split("\n")[1]).toBe("─  ──");
	});

	test("OutputPanel renders text and code blocks", async () => {
		const setup = await render(
			<OutputPanel
				outputs={[
					{ type: "text", text: "plain result" },
					{ type: "code", text: "const x = 1;" },
					{
						type: "image",
						bytes: new Uint8Array(4),
						mimeType: "image/png",
						suggestedName: "out.png",
					},
				]}
			/>,
		);
		const frame = setup.captureCharFrame();
		expect(frame).toContain("plain result");
		expect(frame).toContain("const x = 1;");
		expect(frame).toContain("image/png");
	});
});

describe("shell", () => {
	test("app shell renders header, sidebar and footer", async () => {
		const setup = await render(<App />);
		const frame = setup.captureCharFrame();
		expect(frame).toContain("QBTools");
		expect(frame).toContain("Navigate");
		expect(frame).toContain("Dashboard");
		expect(frame).toContain("Search");
	});
});
