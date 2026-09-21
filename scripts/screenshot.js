// Скриншоты панели для «Version Details» (1024×768, 4:3 — как требует Twitch):
//   npm run screenshots
// Как работает: собирает временную папку (viewer.html + демо-контент + демо-заголовок),
// поднимает ОДНОРАЗОВЫЙ локальный сервер на случайном порту (только 127.0.0.1,
// закрывается сам после снимка) и снимает панель headless Chrome/Edge.
// Обновить демо-контент: правь content/docs/*.md и просто запусти скрипт снова.
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import os from "node:os";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import matter from "gray-matter";

const root = process.cwd();

function findBrowser() {
	const candidates = [
		process.env.CHROME_PATH,
		"C:/Program Files/Google/Chrome/Application/chrome.exe",
		"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
		path.join(
			os.homedir(),
			"AppData/Local/Google/Chrome/Application/chrome.exe",
		),
		"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
		"C:/Program Files/Microsoft/Edge/Application/msedge.exe",
	].filter(Boolean);
	for (const c of candidates) {
		if (fs.existsSync(c)) return c;
	}
	throw new Error(
		"Не найден Chrome/Edge — установи или укажи путь в переменной CHROME_PATH",
	);
}

const browser = findBrowser();
const STAGING = fs.mkdtempSync(path.join(os.tmpdir(), "panel-shot-"));
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "panel-shot-profile-"));
const OUT_DIR = path.join(root, "assets", "screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

// 2. Контент: .md из папки (аргумент, по умолчанию content/docs) + index.json.
//    Если у документа во front-matter указан header — картинка копируется в стейджинг.
const docsDir = path.resolve(
	root,
	process.argv[2] ?? path.join("content", "docs"),
);
const index = [];
for (const f of (await fsp.readdir(docsDir)).filter((f) => f.endsWith(".md"))) {
	const { data } = matter(await fsp.readFile(path.join(docsDir, f), "utf8"));
	const id = f.replace(/\.md$/, "");
	fs.copyFileSync(path.join(docsDir, f), path.join(STAGING, f));
	let header = null;
	if (typeof data.header === "string" && data.header) {
		const hp = path.resolve(docsDir, data.header);
		if (fs.existsSync(hp)) {
			fs.copyFileSync(hp, path.join(STAGING, data.header));
			header = data.header;
		}
	}
	index.push({
		id,
		title: data.title ?? id,
		order: Number.isFinite(data.order) ? data.order : 100,
		hidden: false,
		header,
		url: f,
	});
}
index.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
fs.writeFileSync(
	path.join(STAGING, "index.json"),
	JSON.stringify(index, null, 2),
);
console.log("staging:", fs.readdirSync(STAGING).join(", "));

// 3. viewer.html (собранный)
fs.copyFileSync(
	path.join(root, "app", "viewer.html"),
	path.join(STAGING, "viewer.html"),
);

// 4. Страница-обёртка: панель в контексте, как она выглядит на канале
fs.writeFileSync(
	path.join(STAGING, "index.html"),
	`<!doctype html>
<meta charset="utf-8">
<title>shot</title>
<style>
  html, body { margin: 0; height: 100%; }
  body {
    background:
      radial-gradient(900px 520px at 72% -10%, rgba(145, 70, 255, 0.35), transparent 60%),
      radial-gradient(760px 520px at 8% 112%, rgba(100, 65, 165, 0.45), transparent 60%),
      #0e0e10;
    display: flex; align-items: center; justify-content: center; gap: 72px;
    font-family: 'Segoe UI', system-ui, sans-serif; color: #efeff1;
  }
  .badge {
    display: inline-block; margin-bottom: 20px; padding: 6px 16px;
    border: 1px solid #9146FF; border-radius: 999px; color: #bf94ff;
    font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;
  }
  h1 { font-size: 46px; line-height: 1.15; margin: 0 0 14px; }
  h1 span { color: #bf94ff; }
  p { font-size: 18px; color: #adadb8; margin: 0; line-height: 1.55; }
  .card {
    width: 318px; height: 496px; border-radius: 10px; overflow: hidden;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }
  iframe { width: 318px; height: 496px; border: 0; display: block; }
</style>
<div>
  <div class="badge">Twitch Extension</div>
  <h1>Enhanced<br><span>Twitch Panel</span></h1>
  <p>Несколько документов<br>в одной панели канала</p>
</div>
<div class="card"><iframe src="/viewer.html?index=/index.json"></iframe></div>
<script>
  if (new URLSearchParams(location.search).has('scroll')) {
    document.querySelector('iframe').src = '/viewer.html?index=/index.json&demoScroll=1';
  }
</script>
`,
);

// 5. Одноразовый сервер
const MIME = {
	".html": "text/html",
	".json": "application/json",
	".md": "text/markdown",
	".png": "image/png",
};
const server = http.createServer((req, res) => {
	const rel = decodeURIComponent(req.url.split("?")[0]);
	const file = path.join(STAGING, rel === "/" ? "index.html" : rel);
	if (
		!file.startsWith(STAGING) ||
		!fs.existsSync(file) ||
		!fs.statSync(file).isFile()
	) {
		res.statusCode = 404;
		return res.end("nope");
	}
	res.setHeader(
		"Content-Type",
		(MIME[path.extname(file)] ?? "application/octet-stream") +
			"; charset=utf-8",
	);
	fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

// 6. Снимок. ВАЖНО: chrome запускается через асинхронный spawn — сервер живёт
// в этом же процессе, и синхронный spawnSync заблокировал бы event loop
// (сервер перестал бы отвечать, chrome завис бы навечно).
function shoot(w, h, outName, urlPath) {
	const out = path.join(OUT_DIR, outName);
	return new Promise((resolve, reject) => {
		const child = spawn(
			browser,
			[
				"--headless=new",
				`--user-data-dir=${PROFILE}`,
				`--screenshot=${out}`,
				`--window-size=${w},${h}`,
				"--hide-scrollbars",
				"--timeout=8000",
				`http://127.0.0.1:${port}${urlPath}`,
			],
			{ stdio: "ignore" },
		);
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code !== 0 || !fs.existsSync(out)) {
				reject(
					new Error(`chrome завершился с кодом ${code}, скриншот не снят`),
				);
			} else {
				console.log(`${outName}  (${w}×${h})`);
				resolve();
			}
		});
	});
}

await await shoot(1024, 768, "panel-1024x768.png", "/");
await shoot(1024, 768, "panel-scrolled-1024x768.png", "/?scroll=1");

server.close();
try {
	fs.rmSync(STAGING, { recursive: true, force: true });
	fs.rmSync(PROFILE, { recursive: true, force: true });
} catch {
	// папки профиля могут быть ненадолго заняты Chrome — не критично
}
console.log(`Готово: скриншоты в assets/screenshots/ (сервер остановлен)`);
process.exit(0);
