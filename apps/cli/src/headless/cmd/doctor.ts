/**
 * `qbtools doctor` — environment diagnostics: runtime, optional deps, wasm
 * assets, config, server reachability and auth state. Read-only; never
 * throws.
 */

import { assertHttpUrl } from "../../services/api";
import { loadAuth } from "../../services/auth-store";
import { activeProfile, configFilePath, loadConfig, serverUrl } from "../../services/config";
import { sharpAvailable } from "../../services/image-native";
import { CLI_VERSION } from "../../version";
import { getBool } from "../args";
import { type Command, EXIT_ERROR, EXIT_OK } from "../command";

interface Row {
	label: string;
	ok: boolean | null;
	detail: string;
}

function row(label: string, ok: boolean | null, detail: string): Row {
	return { label, ok, detail };
}

async function probeFfmpeg(): Promise<Row> {
	try {
		const { ffmpegPaths } = await import("../../services/media");
		const paths = await ffmpegPaths();
		if (!paths) {
			return row(
				"ffmpeg / ffprobe",
				null,
				"not installed — media tools unavailable (brew install ffmpeg)",
			);
		}
		return row("ffmpeg / ffprobe", true, `found (${paths.ffmpeg})`);
	} catch (error) {
		return row(
			"ffmpeg / ffprobe",
			false,
			`probe failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

async function probeServer(): Promise<Row> {
	const config = await loadConfig();
	const base = serverUrl(config);
	try {
		assertHttpUrl(base);
	} catch (error) {
		return row("server", false, error instanceof Error ? error.message : String(error));
	}
	const started = Date.now();
	try {
		const response = await fetch(new URL("/api/health", base), {
			signal: AbortSignal.timeout(5000),
		});
		const ms = Date.now() - started;
		return row(
			"server",
			response.ok,
			`${base} · ${response.ok ? "healthy" : `HTTP ${response.status}`} · ${ms}ms`,
		);
	} catch {
		return row("server", false, `${base} unreachable (is the app running?)`);
	}
}

async function main(): Promise<Row[]> {
	const rows: Row[] = [];
	rows.push(row("bun runtime", true, `bun ${Bun.version} · qbtools ${CLI_VERSION}`));

	const config = await loadConfig();
	const profile = activeProfile(config);
	rows.push(
		row(
			"config",
			true,
			`${configFilePath()} · profile "${config.activeProfile}" → ${profile.serverUrl} · out ${profile.outputDir}`,
		),
	);

	const auth = await loadAuth();
	rows.push(
		auth
			? row("credentials", true, `stored ${auth.kind} for ${auth.user?.email ?? "unknown user"}`)
			: row("credentials", null, "signed out — qbtools login --api-key qbk_…"),
	);

	// Wasm asset resolution (engines assetBase headless branch)
	try {
		const { assetBase } = await import("@qbtools/engines/assets");
		const base = await assetBase("qpdf");
		const probe = await fetch(`${base}/qpdf.wasm`, { method: "HEAD" });
		rows.push(row("wasm assets", probe.ok, `qpdf base reachable (${base.slice(0, 48)}…)`));
	} catch (error) {
		rows.push(row("wasm assets", false, error instanceof Error ? error.message : String(error)));
	}

	const sharp = await sharpAvailable();
	rows.push(
		sharp
			? row("sharp (image tools)", true, "installed")
			: row(
					"sharp (image tools)",
					null,
					"not installed — npm i -g sharp to enable compress/resize/convert",
				),
	);
	rows.push(await probeFfmpeg());
	rows.push(await probeServer());
	return rows;
}

export const doctorCommand: Command = {
	name: "doctor",
	summary: "Check the CLI environment (runtime, deps, server, auth)",
	flags: [{ name: "json", description: "Print as JSON" }],
	async run({ args, io }) {
		const rows = await main();
		const failed = rows.filter((row) => row.ok === false);
		if (getBool(args, "json")) {
			io.out(JSON.stringify({ rows, healthy: failed.length === 0 }, null, "\t"));
		} else {
			for (const { label, ok, detail } of rows) {
				const mark = ok === true ? "✓" : ok === false ? "✗" : "·";
				io.out(`${mark} ${label.padEnd(22)} ${detail}`);
			}
			io.out("");
			io.out(
				failed.length
					? `${failed.length} problem${failed.length > 1 ? "s" : ""} found.`
					: "Everything optional is either working or clearly flagged above.",
			);
		}
		return failed.length ? EXIT_ERROR : EXIT_OK;
	},
};
