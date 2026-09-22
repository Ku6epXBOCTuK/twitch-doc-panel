import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Вьювер-панель. JS/CSS — отдельные файлы: Twitch запрещает inline-скрипты
// на hosted-тесте (CSP script-src 'self' ... без unsafe-inline).
export default defineConfig({
	plugins: [svelte()],
	base: "./",
	build: {
		outDir: "dist/viewer",
		emptyOutDir: true,
		rollupOptions: {
			input: "viewer.html",
			output: {
				entryFileNames: "assets/viewer/[name]-[hash].js",
				assetFileNames: "assets/viewer/[name]-[hash][extname]",
			},
		},
	},
});
