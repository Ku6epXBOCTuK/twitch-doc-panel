import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import Icons from "unplugin-icons/vite";
import { buildIndex } from "./builder/build.ts";

// HTTPS в dev — если в certs/ лежит сертификат от mkcert:
//   mkcert -install && mkcert localhost 127.0.0.1 ::1
// (файлы localhost+2.pem / localhost+2-key.pem в папке certs/).
// Тогда Base URI в консоли Twitch = https://localhost:8080/ — без флагов Chrome.
// Без сертификатов сервер поднимается по HTTP (Base URI http://localhost:8080/).
const certKey = path.join(process.cwd(), "certs", "localhost+2-key.pem");
const certPem = path.join(process.cwd(), "certs", "localhost+2.pem");
const https =
	fs.existsSync(certKey) && fs.existsSync(certPem)
		? { key: fs.readFileSync(certKey), cert: fs.readFileSync(certPem) }
		: undefined;

// Dev-only: index.json для fixtures/ генерируется на лету при каждом запросе —
// правки .md видны по перезагрузке страницы, `npm run build:fixtures` в dev не нужен.
// Мидлварь зарегистрирована в теле configureServer (до внутренних мидлварей Vite),
// поэтому перехватывает запрос раньше статики, которая отдала бы устаревший файл.
function devContent(): Plugin {
	const indexUrl = "/fixtures/index.json";
	const contentDir = path.join(process.cwd(), "fixtures");
	return {
		name: "dev-content",
		apply: "serve",
		configureServer(server: ViteDevServer) {
			server.middlewares.use(async (req, res, next) => {
				const url = (req.url ?? "").split("?")[0];
				if (url !== indexUrl) return next();
				try {
					const { index, problems } = await buildIndex(contentDir);
					for (const p of problems) server.config.logger.warn("  ⚠ " + p);
					res.statusCode = 200;
					res.setHeader("Content-Type", "application/json; charset=utf-8");
					res.setHeader("Cache-Control", "no-store");
					res.end(JSON.stringify(index, null, 2));
				} catch (e) {
					res.statusCode = 500;
					res.setHeader("Content-Type", "text/plain; charset=utf-8");
					res.end(String((e as Error).message ?? e));
				}
			});
		},
	};
}

// Dev-only: корень (/) открывает страницу аудита src/dev.html — не нужно помнить
// про отдельный путь, npm run dev → https://localhost:8080/
function devShell(): Plugin {
	return {
		name: "dev-shell",
		apply: "serve",
		configureServer(server: ViteDevServer) {
			server.middlewares.use((req, res, next) => {
				const url = (req.url ?? "").split("?")[0];
				if (url !== "/") return next();
				req.url = "/src/dev.html";
				next();
			});
		},
	};
}

// Dev-сервер: обслуживает /src/viewer.html и /src/config.html на одном origin.
export default defineConfig({
	plugins: [svelte(), Icons({ compiler: "svelte" }), devShell(), devContent()],
	server: { port: 8080, ...(https ? { https } : {}) },
});
