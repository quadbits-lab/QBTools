import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
	server: { port: 3000, strictPort: true },
	plugins: [tailwindcss(), tanstackStart(), viteReact()],
	ssr: {
		// Bundle every dependency so the Docker runtime needs no node_modules;
		// only Bun's built-in sqlite module stays external.
		noExternal: true,
		external: ["bun:sqlite"],
	},
	optimizeDeps: {
		// Workers and WASM inside these load relative to their own module URL.
		exclude: ["@huggingface/transformers", "pdfjs-dist"],
	},
});
