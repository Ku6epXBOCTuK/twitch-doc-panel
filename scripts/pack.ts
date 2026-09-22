import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

// app/ — html + ассеты для зипа. Контент (md + index.json) живёт в отдельном репозитории.
await fs.rm("app", { recursive: true, force: true });
await fs.mkdir("app", { recursive: true });
await fs.cp("dist/viewer", "app", { recursive: true });
await fs.cp("dist/config", "app", { recursive: true });

const sevenZip = "C:\\Program Files\\7-Zip\\7z.exe";
const zipPath = path.resolve("app", "twitch-multi-panel.zip");
const res = spawnSync(sevenZip, ["a", "-tzip", zipPath, "*"], {
	cwd: path.resolve("app"),
	stdio: "inherit",
});
if (res.status !== 0) process.exit(res.status ?? 1);
console.log("complete");
