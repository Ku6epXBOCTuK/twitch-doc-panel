import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import Icons from "unplugin-icons/vite";

// Исходные html живут в src/, но Vite кладёт их в dist/ с сохранением пути
// относительно root (dist/src/viewer.html), а base "./" считает ссылки на
// ассеты от этой глубины (../assets/...). Twitch и pack.ts ждут плоский dist:
// этот плагин переименовывает html в корень dist/ и правит ссылки.
function flattenHtml(): Plugin {
	return {
		name: "flatten-html",
		apply: "build",
		enforce: "post",
		generateBundle(_options, bundle) {
			for (const [name, item] of Object.entries(bundle)) {
				if (!name.startsWith("src/") || !name.endsWith(".html")) continue;
				const flat = name.slice("src/".length);
				item.fileName = flat;
				if (item.type === "asset" && typeof item.source === "string") {
					item.source = item.source.replace(/\.\.\/assets\//g, "./assets/");
				}
				bundle[flat] = item;
				delete bundle[name];
			}
		},
	};
}

// Единый билд расширения: viewer + config в один dist/.
// JS/CSS — отдельные файлы: Twitch запрещает inline-скрипты
// на hosted-тесте (CSP script-src 'self' ... без unsafe-inline).
// На выходе плоская структура (viewer.html, config.html, assets/),
// готовая для zip без промежуточного merge.
export default defineConfig({
	plugins: [svelte(), Icons({ compiler: "svelte" }), flattenHtml()],
	base: "./",
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: { viewer: "src/viewer.html", config: "src/config.html" },
			output: {
				entryFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]",
				chunkFileNames: "assets/[name]-[hash].js",
			},
		},
	},
});
