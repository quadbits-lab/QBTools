import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
	resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
	server: { port: 8310, strictPort: true },
	plugins: [tailwindcss(), tanstackStart(), viteReact()],
	ssr: {
		// Production: bundle every dependency so the Docker runtime needs no
		// node_modules. Dev keeps Vite's defaults (CJS deps can't be inlined there).
		// Bun's built-in sqlite module always stays external.
		...(command === "build" ? { noExternal: true } : {}),
		external: ["bun:sqlite"],
	},
	optimizeDeps: {
		// Workers and WASM inside these load relative to their own module URL.
		exclude: ["@huggingface/transformers", "pdfjs-dist"],
	},
}));
