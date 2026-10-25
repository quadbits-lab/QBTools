/** AI runners: grammar checker and paraphrase helper, served by the QBTools server. */

import { ApiError, aiGrammar, aiParaphrase } from "../../services/api";
import { loadAuth } from "../../services/auth-store";
import { requireString, str, type ToolRunner, UnavailableError } from "../types";

async function requireSignedIn(): Promise<void> {
	const auth = await loadAuth();
	if (auth) return;
	throw new UnavailableError(
		"server",
		"Sign in first: create a key in the web dashboard, then `qbtools login --api-key qbk_…`.",
	);
}

export const grammarChecker: ToolRunner = {
	slug: "grammar-checker",
	availability: "server",
	stdinField: "text",
	fields: [
		{
			name: "text",
			label: "Text to proofread",
			kind: "textarea",
			required: true,
			help: "Runs on the QBTools server (AI); sign in with qbtools login",
		},
	],
	async run({ values, onProgress }) {
		await requireSignedIn();
		const text = requireString(values, "text", "text");
		onProgress?.({ stage: "processing", fraction: null, label: "Asking the AI to proofread…" });
		try {
			const result = await aiGrammar(text);
			if (!result.ok || typeof result.corrected !== "string") {
				throw new Error(result.error ?? "The AI helper returned nothing.");
			}
			const changes = result.changes ?? [];
			return {
				summary: changes.length
					? `${changes.length} correction${changes.length > 1 ? "s" : ""} suggested`
					: "No corrections needed",
				outputs: [
					{ type: "code", text: result.corrected },
					...(changes.length
						? [
								{
									type: "table" as const,
									columns: ["Original", "Corrected", "Why"],
									rows: changes.map((change) => [change.original, change.corrected, change.reason]),
								},
							]
						: []),
				],
				data: { corrected: result.corrected, changes },
			};
		} catch (error) {
			if (error instanceof ApiError) throw new UnavailableError("server", error.message);
			throw error;
		}
	},
};

export const paraphrasingTool: ToolRunner = {
	slug: "paraphrasing-tool",
	availability: "server",
	stdinField: "text",
	fields: [
		{
			name: "text",
			label: "Text to rewrite",
			kind: "textarea",
			required: true,
			help: "Runs on the QBTools server (AI); sign in with qbtools login",
		},
		{
			name: "tone",
			label: "Tone",
			kind: "select",
			default: "simple",
			options: [
				{ label: "Simple", value: "simple" },
				{ label: "Formal", value: "formal" },
				{ label: "Friendly", value: "friendly" },
				{ label: "Shorter", value: "shorter" },
				{ label: "Creative", value: "creative" },
			],
		},
	],
	async run({ values, onProgress }) {
		await requireSignedIn();
		const text = requireString(values, "text", "text");
		const tone = str(values, "tone", "simple");
		onProgress?.({ stage: "processing", fraction: null, label: "Rewriting on the server…" });
		try {
			const result = await aiParaphrase(text);
			if (!result.ok || !result.versions?.length) {
				throw new Error(result.error ?? "The AI helper returned nothing.");
			}
			const versions = result.versions;
			return {
				summary: `${versions.length} rewrite${versions.length > 1 ? "s" : ""}`,
				outputs: versions.map((version, index) => ({
					type: "code" as const,
					text: versions.length > 1 ? `[${index + 1}] ${version}` : version,
				})),
				data: { versions, tone },
			};
		} catch (error) {
			if (error instanceof ApiError) throw new UnavailableError("server", error.message);
			throw error;
		}
	},
};

export const aiRunners: ToolRunner[] = [grammarChecker, paraphrasingTool];
