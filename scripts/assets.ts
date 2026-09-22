// Рендер PNG-ассетов для «Version Details» из SVG-исходников (assets/src/):
//   npm run assets
// Использует headless Chrome/Edge (--screenshot) — дополнительных зависимостей нет.
import path from "node:path";
import { fail, repoRoot } from "./lib/repo.ts";
import { renderSvgToPng } from "./lib/svg.ts";

const SRC = path.join(repoRoot, "assets", "src");
const OUT = path.join(repoRoot, "assets");

const targets = [
	{ svg: "logo.svg", w: 100, h: 100, out: "logo-100x100.png" },
	{ svg: "logo.svg", w: 64, h: 64, out: "icon-64x64.png" },
	{ svg: "logo.svg", w: 24, h: 24, out: "icon-24x24.png" },
	{ svg: "discovery.svg", w: 300, h: 200, out: "discovery-300x200.png" },
	{ svg: "banner-demo.svg", w: 636, h: 340, out: "banner-demo.png" },
];

try {
	for (const t of targets) {
		renderSvgToPng(path.join(SRC, t.svg), t.w, t.h, path.join(OUT, t.out));
		console.log(`${t.out}  <-  ${t.svg} (${t.w}x${t.h})`);
	}
} catch (e) {
	fail(e instanceof Error ? e.message : String(e));
}
console.log("Done: PNG in assets/");
