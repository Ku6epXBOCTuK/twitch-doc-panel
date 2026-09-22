import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

// app/ — только два html. Контент (md + index.json) живёт в отдельном репозитории.
await fs.rm("app", { recursive: true, force: true });
await fs.mkdir("app", { recursive: true });
await fs.copyFile("dist/viewer/viewer.html", "app/viewer.html");
await fs.copyFile("dist/config/config.html", "app/config.html");

const sevenZip = "C:\\Program Files\\7-Zip\\7z.exe";
const zipPath = path.resolve("app", "twitch-multi-panel.zip");
const res = spawnSync(
	sevenZip,
	["a", "-tzip", zipPath, "viewer.html", "config.html"],
	{ cwd: path.resolve("app"), stdio: "inherit" },
);
if (res.status !== 0) process.exit(res.status ?? 1);
console.log("complete");
