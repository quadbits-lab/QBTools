import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tools } from "@qbtools/registry";

// Parse the source instead of importing it: widget modules need a browser.
const source = readFileSync(join(import.meta.dir, "widgets.ts"), "utf8");
const keys = [...source.matchAll(/^\t"([a-z0-9-]+)": lazy/gm)].map((m) => m[1]);

test("every registry tool has exactly one widget", () => {
	expect([...keys].sort()).toEqual(tools.map((t) => t.slug).sort());
});
