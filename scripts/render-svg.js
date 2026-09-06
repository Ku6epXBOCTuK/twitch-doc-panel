// Рендер SVG → PNG через headless Chrome/Edge (без дополнительных зависимостей):
//   node scripts/render-svg.js <source.svg> <width> <height> <out.png>
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const [svgPathArg, wArg, hArg, outArg] = process.argv.slice(2);
if (!svgPathArg || !wArg || !hArg || !outArg) {
  console.error('Использование: node scripts/render-svg.js <source.svg> <width> <height> <out.png>');
  process.exit(1);
}

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(os.homedir(), 'AppData/Local/Google/Chrome/Application/chrome.exe'),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const browser = candidates.find((c) => fs.existsSync(c));
if (!browser) {
  console.error('Не найден Chrome/Edge — установи или укажи путь в переменной CHROME_PATH');
  process.exit(1);
}

const w = Number(wArg);
const h = Number(hArg);
const svg = fs.readFileSync(svgPathArg, 'utf8');
const sized = svg.replace('<svg', `<svg width="${w}" height="${h}"`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'render-svg-'));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'render-svg-profile-'));
const htmlPath = path.join(tmp, 'render.html');
fs.writeFileSync(htmlPath, `<!doctype html><meta charset="utf-8"><style>*{margin:0}</style>${sized}`);
const out = path.resolve(outArg);
fs.mkdirSync(path.dirname(out), { recursive: true });

const r = spawnSync(
  browser,
  [
    '--headless=new',
    `--user-data-dir=${profile}`,
    `--screenshot=${out}`,
    `--window-size=${w},${h}`,
    '--hide-scrollbars',
    '--default-background-color=00000000',
    '--virtual-time-budget=3000',
    `file:///${htmlPath.replace(/\\/g, '/')}`,
  ],
  { stdio: 'pipe' },
);

fs.rmSync(tmp, { recursive: true, force: true });
fs.rmSync(profile, { recursive: true, force: true });

if (r.status !== 0 || !fs.existsSync(out)) {
  console.error(r.stderr?.toString() || 'рендер не удался');
  process.exit(1);
}
console.log(`${out} (${w}×${h})`);
