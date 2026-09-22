import fs from "node:fs";
import path from "node:path";
import { createTempDirs, screenshotChromeSync } from "./browser.ts";
import { repoRoot } from "./repo.ts";

const FRAME = path.join(repoRoot, "scripts", "templates", "svg-frame.html");

let frame: string | undefined;

export function renderSvgToPng(
	svgPath: string,
	w: number,
	h: number,
	out: string,
): void {
	const svg = fs.readFileSync(svgPath, "utf8");
	const sized = svg.replace("<svg", `<svg width="${w}" height="${h}"`);
	frame ??= fs.readFileSync(FRAME, "utf8");
	const html = frame.replace("{{svg}}", () => sized);
	const dirs = createTempDirs("render-svg");
	try {
		fs.mkdirSync(path.dirname(out), { recursive: true });
		const htmlPath = path.join(dirs.tmp, "frame.html");
		fs.writeFileSync(htmlPath, html);
		screenshotChromeSync({
			url: `file:///${htmlPath.replace(/\\/g, "/")}`,
			out,
			width: w,
			height: h,
			profile: dirs.profile,
			transparent: true,
			virtualTimeBudget: 3000,
		});
	} finally {
		dirs.cleanup();
	}
}
