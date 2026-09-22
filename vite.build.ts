import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Единый билд расширения: viewer + config в один dist/.
// JS/CSS — отдельные файлы: Twitch запрещает inline-скрипты
// на hosted-тесте (CSP script-src 'self' ... без unsafe-inline).
// На выходе плоская структура (viewer.html, config.html, assets/),
// готовая для zip без промежуточного merge.
export default defineConfig({
	plugins: [svelte()],
	base: "./",
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: { viewer: "viewer.html", config: "config.html" },
			output: {
				entryFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]",
				chunkFileNames: "assets/[name]-[hash].js",
			},
		},
	},
});
