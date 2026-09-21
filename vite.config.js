import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { buildIndex } from "./builder/build.js";

// Сапервизор Twitch (supervisor.js) запрашивает документы расширения (viewer/config)
// в CORS-режиме и проверяет доступность Base URI — без этих заголовков Local Test
// падает с «CORS error». Access-Control-Allow-Private-Network — для запросов
// с публичного twitch.tv на localhost (Private Network Access).
function devCors() {
	return {
		name: "dev-cors",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const origin = req.headers.origin;
				if (origin) {
					res.setHeader("Access-Control-Allow-Origin", origin);
					res.setHeader("Access-Control-Allow-Credentials", "true");
					res.setHeader("Vary", "Origin");
				} else {
					res.setHeader("Access-Control-Allow-Origin", "*");
				}
				res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
				res.setHeader(
					"Access-Control-Allow-Headers",
					req.headers["access-control-request-headers"] ?? "*",
				);
				res.setHeader("Access-Control-Allow-Private-Network", "true");
				res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
				if (req.method === "OPTIONS") {
					res.statusCode = 204;
					return res.end();
				}
				next();
			});
		},
	};
}

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

// Dev-only: index.json для content/docs генерируется на лету при каждом запросе —
// правки .md видны по перезагрузке страницы, `npm run build:index` в dev не нужен.
// Мидлварь зарегистрирована в теле configureServer (до внутренних мидлварей Vite),
// поэтому перехватывает запрос раньше статики, которая отдала бы устаревший файл.
function devContent() {
	const indexUrl = "/content/docs/index.json";
	const contentDir = path.join(process.cwd(), "content", "docs");
	return {
		name: "dev-content",
		apply: "serve",
		configureServer(server) {
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
					res.end(String(e.message ?? e));
				}
			});
		},
	};
}

// Dev-only: корень (/) открывает страницу аудита dev.html — не нужно помнить
// про отдельный путь, npm run dev → https://localhost:8080/
function devShell() {
	return {
		name: "dev-shell",
		apply: "serve",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = (req.url ?? "").split("?")[0];
				if (url !== "/") return next();
				req.url = "/dev.html";
				next();
			});
		},
	};
}

// Dev-сервер: обслуживает /viewer.html и /config.html на одном origin.
export default defineConfig({
	plugins: [svelte(), devCors(), devShell(), devContent()],
	server: { port: 8080, ...(https ? { https } : {}) },
});
