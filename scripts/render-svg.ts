// Рендер SVG → PNG через headless Chrome/Edge (без дополнительных зависимостей):
//   node scripts/render-svg.ts <source.svg> <width> <height> <out.png>
import path from "node:path";
import process from "node:process";
import { fail } from "./lib/repo.ts";
import { renderSvgToPng } from "./lib/svg.ts";

const [svgPathArg, wArg, hArg, outArg] = process.argv.slice(2);
if (!svgPathArg || !wArg || !hArg || !outArg) {
	fail(
		"Usage: node scripts/render-svg.ts <source.svg> <width> <height> <out.png>",
	);
}

const w = Number(wArg);
const h = Number(hArg);
if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) {
	fail(
		`invalid size: width=${wArg} height=${hArg} - expected positive integers`,
	);
}

const out = path.resolve(outArg);
try {
	renderSvgToPng(path.resolve(svgPathArg), w, h, out);
} catch (e) {
	fail(e instanceof Error ? e.message : String(e));
}
console.log(`${out} (${w}x${h})`);
