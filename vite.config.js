import fs from 'node:fs';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const MIME = {
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

// Сапервизор Twitch (supervisor.js) запрашивает документы расширения (viewer/config)
// в CORS-режиме и проверяет доступность Base URI. Набор заголовков закрывает все
// известные блокировки Local Test:
//  - ACAO с эхом origin (не *): запросы с credentials требуют конкретный origin;
//  - Cross-Origin-Resource-Policy: cross-origin — иначе COEP-страницы Twitch блокируют
//    iframe-документ, и DevTools показывает это как «CORS error»;
//  - Access-Control-Allow-Private-Network — запросы с публичного twitch.tv на localhost
//    (Private Network Access) и их preflight.
function devCors() {
  return {
    name: 'dev-cors',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Vary', 'Origin');
        } else {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? '*');
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }
        next();
      });
    },
  };
}

// Раздаёт site/ на /content/ в dev-режиме: контент проверяется локально без деплоя.
// Тот же origin, что и вьювер — для собственного fetch() CORS не нужен, но заголовки
// из devCors всё равно уходят с каждым ответом.
function serveSite() {
  return {
    name: 'serve-site-dev',
    configureServer(server) {
      server.middlewares.use('/content', (req, res, next) => {
        const rel = decodeURIComponent(req.url.split('?')[0]);
        const root = path.join(process.cwd(), 'site');
        const file = path.join(root, rel === '/' ? 'index.json' : rel);
        if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          res.statusCode = 404;
          return res.end('not found');
        }
        res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        createReadStream(file).pipe(res);
      });
    },
  };
}

// HTTPS в dev — если в certs/ лежит сертификат от mkcert:
//   mkcert -install && mkcert localhost 127.0.0.1 ::1
// (файлы localhost+2.pem / localhost+2-key.pem в папке certs/).
// Тогда Base URI в консоли Twitch = https://localhost:8080/ — без флагов Chrome.
// Без сертификатов сервер поднимается по HTTP (Base URI http://localhost:8080/).
const certKey = path.join(process.cwd(), 'certs', 'localhost+2-key.pem');
const certPem = path.join(process.cwd(), 'certs', 'localhost+2.pem');
const https =
  fs.existsSync(certKey) && fs.existsSync(certPem)
    ? { key: fs.readFileSync(certKey), cert: fs.readFileSync(certPem) }
    : undefined;

// Dev-сервер: обслуживает /viewer.html, /config.html и /content/ на одном origin.
export default defineConfig({
  plugins: [svelte(), devCors(), serveSite()],
  server: { port: 8080, ...(https ? { https } : {}) },
});
