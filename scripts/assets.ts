// Рендер PNG-ассетов для «Version Details» из SVG-исходников (assets/src/):
//   npm run assets
// Использует headless Chrome/Edge (--screenshot) — дополнительных зависимостей нет.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import os from "node:os";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const SRC = path.join(root, "assets", "src");
const OUT = path.join(root, "assets");

function findBrowser(): string {
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
	].filter((c): c is string => Boolean(c));
	for (const c of candidates) {
		if (fs.existsSync(c)) return c;
	}
	throw new Error(
		"Не найден Chrome/Edge — установи или укажи путь в переменной CHROME_PATH",
	);
}

const browser = findBrowser();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "panel-assets-"));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "panel-assets-profile-"));

function svgToPng(
	svgName: string,
	w: number,
	h: number,
	outName: string,
): void {
	const svg = fs.readFileSync(path.join(SRC, svgName), "utf8");
	const sized = svg.replace("<svg", `<svg width="${w}" height="${h}"`);
	const htmlPath = path.join(tmp, `${outName}.html`);
	fs.writeFileSync(
		htmlPath,
		`<!doctype html><meta charset="utf-8"><style>*{margin:0}</style>${sized}`,
	);
	const out = path.join(OUT, outName);
	const r = spawnSync(
		browser,
		[
			"--headless=new",
			`--user-data-dir=${profile}`,
			`--screenshot=${out}`,
			`--window-size=${w},${h}`,
			"--hide-scrollbars",
			"--default-background-color=00000000",
			"--virtual-time-budget=3000",
			`file:///${htmlPath.replace(/\\/g, "/")}`,
		],
		{ stdio: "pipe" },
	);
	if (r.status !== 0 || !fs.existsSync(out)) {
		console.error(
			r.stderr?.toString() ||
				r.stdout?.toString() ||
				`не удалось отрендерить ${outName}`,
		);
		process.exit(1);
	}
	console.log(`${outName}  ←  ${svgName} (${w}×${h})`);
}

svgToPng("logo.svg", 100, 100, "logo-100x100.png");
svgToPng("logo.svg", 64, 64, "icon-64x64.png");
svgToPng("logo.svg", 24, 24, "icon-24x24.png");
svgToPng("discovery.svg", 300, 200, "discovery-300x200.png");
svgToPng("header-demo.svg", 636, 340, "header-demo.png");

fs.rmSync(tmp, { recursive: true, force: true });
fs.rmSync(profile, { recursive: true, force: true });
console.log("Готово: PNG лежат в assets/");
