// Скриншоты панели для «Version Details» (1024×768, 4:3 — как требует Twitch):
//   npm run screenshots
// Как работает: сперва собирает бандл (npm run build:bundle), собирает временную
// папку (viewer.html + демо-контент + демо-заголовок), поднимает ОДНОРАЗОВЫЙ
// локальный сервер на случайном порту (только 127.0.0.1, закрывается после
// снимка) и снимает панель headless Chrome/Edge.
// Обновить демо-контент: правь fixtures/*.md и просто запусти скрипт снова.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { buildIndex } from "../builder/build.ts";
import {
	createTempDirs,
	findBrowser,
	screenshotChrome,
} from "./lib/browser.ts";
import { fail, repoRoot } from "./lib/repo.ts";
import { startStaticServer } from "./lib/static-server.ts";

const root = repoRoot;
const OUT_DIR = path.join(root, "assets", "screenshots");
const WRAPPER = path.join(root, "scripts", "templates", "screenshot.html");

// 1. Сборка бандла: скриншоты всегда со свежего dist/.
//    vite вызывается через node напрямую — без npm (на Windows .cmd-обёртка
//    требует shell, а shell:true даёт DeprecationWarning).
function buildBundle(): void {
	const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");
	const build = spawnSync(
		process.execPath,
		[viteBin, "build", "-c", "vite.build.ts"],
		{ stdio: "inherit", cwd: root },
	);
	if (build.status !== 0) {
		console.error("build:bundle failed - screenshots cancelled");
		process.exit(build.status ?? 1);
	}
}

// 2. Контент: индекс через общий buildIndex (title/order/hidden/баннеры —
//    те же правила, что и в билде контента), сами .md и баннеры копируются
//    в стейджинг отдельно.
async function stageDocs(docsDir: string, staging: string): Promise<void> {
	const { index } = await buildIndex(docsDir);
	for (const entry of index) {
		fs.copyFileSync(
			path.join(docsDir, entry.url),
			path.join(staging, entry.url),
		);
		if (entry.banner) {
			const dest = path.join(staging, entry.banner);
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.copyFileSync(path.join(docsDir, entry.banner), dest);
		}
	}
	fs.writeFileSync(
		path.join(staging, "index.json"),
		JSON.stringify(index, null, 2),
	);
	console.log(`staged: ${fs.readdirSync(staging).join(", ")}`);
}

// 3. viewer.html + его ассеты из dist/
function stageViewer(staging: string): void {
	fs.copyFileSync(
		path.join(root, "dist", "viewer.html"),
		path.join(staging, "viewer.html"),
	);
	fs.cpSync(path.join(root, "dist", "assets"), path.join(staging, "assets"), {
		recursive: true,
	});
}

// 4. Страница-обёртка: панель в контексте, как она выглядит на канале
function stageWrapper(staging: string): void {
	fs.copyFileSync(WRAPPER, path.join(staging, "index.html"));
}

// ВАЖНО: chrome запускается через асинхронный spawn — сервер живёт
// в этом же процессе, и синхронный spawnSync заблокировал бы event loop
// (сервер перестал бы отвечать, chrome завис бы навечно).
async function shoot(
	port: number,
	profile: string,
	outName: string,
	urlPath: string,
): Promise<void> {
	await screenshotChrome({
		url: `http://127.0.0.1:${port}${urlPath}`,
		out: path.join(OUT_DIR, outName),
		width: 1024,
		height: 768,
		profile,
		timeoutMs: 8000,
	});
	console.log(`${outName} (1024x768)`);
}

async function main(): Promise<void> {
	buildBundle();
	findBrowser();
	fs.mkdirSync(OUT_DIR, { recursive: true });
	const dirs = createTempDirs("panel-shot");
	try {
		const docsDir = path.resolve(root, process.argv[2] ?? "fixtures");
		await stageDocs(docsDir, dirs.tmp);
		stageViewer(dirs.tmp);
		stageWrapper(dirs.tmp);

		// 5. Одноразовый сервер
		const server = await startStaticServer(dirs.tmp);
		try {
			// 6. Снимки
			await shoot(server.port, dirs.profile, "panel-1024x768.png", "/");
			await shoot(
				server.port,
				dirs.profile,
				"panel-rules-1024x768.png",
				"/?scroll=1",
			);
		} finally {
			await server.close();
		}
	} finally {
		dirs.cleanup();
	}
	console.log("Done: screenshots in assets/screenshots/ (server stopped)");
}

try {
	await main();
} catch (e) {
	fail(e instanceof Error ? e.message : String(e));
}
