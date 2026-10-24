import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
	const rootDir = path.resolve(import.meta.dirname, "../..");
	const rootEnv = loadEnv(mode, rootDir, "");
	for (const [key, val] of Object.entries(rootEnv)) {
		if (process.env[key] === undefined || process.env[key] === "") {
			process.env[key] = val;
		}
	}

	return {
		envDir: "../../",
		resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
		server: { port: 8310, strictPort: true },
		plugins: [tailwindcss(), tanstackStart(), viteReact()],
		ssr: {
			// Production: bundle every dependency so the Docker runtime needs no
			// node_modules. Dev keeps Vite's defaults (CJS deps can't be inlined there).
			// Bun's built-in sqlite module always stays external.
			...(command === "build" ? { noExternal: true } : {}),
			external: ["bun:sqlite", "@electric-sql/pglite"],
		},
		optimizeDeps: {
			// Workers and WASM inside these load relative to their own module URL.
			exclude: ["@huggingface/transformers", "pdfjs-dist"],
		},
	};
});
