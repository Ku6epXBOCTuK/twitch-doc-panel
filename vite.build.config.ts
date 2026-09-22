import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Конфиг-вью (панель управления в Creator Dashboard).
// JS/CSS — отдельные файлы: Twitch запрещает inline-скрипты (CSP).
export default defineConfig({
	plugins: [svelte()],
	base: "./",
	build: {
		outDir: "dist/config",
		emptyOutDir: true,
		rollupOptions: {
			input: "config.html",
			output: {
				entryFileNames: "assets/config/[name]-[hash].js",
				assetFileNames: "assets/config/[name]-[hash][extname]",
			},
		},
	},
});
