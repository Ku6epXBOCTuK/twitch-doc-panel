import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fail, repoRoot } from "./lib/repo.ts";

// app/ — html + ассеты для зипа. Контент (md + index.json) живёт в отдельном репозитории.
const viewerDir = path.join(repoRoot, "dist", "viewer");
const configDir = path.join(repoRoot, "dist", "config");
for (const dir of [viewerDir, configDir]) {
	if (!fs.existsSync(dir)) {
		fail(
			`${path.relative(repoRoot, dir).replace(/\\/g, "/")}/ not found - run "npm run build" first`,
		);
	}
}

const appDir = path.join(repoRoot, "app");
fs.rmSync(appDir, { recursive: true, force: true });
fs.mkdirSync(appDir, { recursive: true });
fs.cpSync(viewerDir, appDir, { recursive: true });
fs.cpSync(configDir, appDir, { recursive: true });

const zipDest = path.join(appDir, "doc-panel.zip");
const zipTmp = path.join(os.tmpdir(), `doc-panel-${process.pid}.zip`);
fs.rmSync(zipTmp, { force: true });
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const cmd = [
	"Add-Type -AssemblyName System.IO.Compression.FileSystem;",
	`$src = ${q(appDir)};`,
	`$dst = ${q(zipTmp)};`,
	"$zip = [System.IO.Compression.ZipFile]::Open($dst, 'Create');",
	"try {",
	"  Get-ChildItem -LiteralPath $src -Recurse -File | ForEach-Object {",
	"    $n = $_.FullName.Substring($src.Length).TrimStart('\\').Replace('\\', '/');",
	"    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $n) | Out-Null;",
	"  };",
	"  $zip.Dispose(); $zip = $null;",
	"} finally { if ($zip) { $zip.Dispose() } }",
].join("\n");
const res = spawnSync(
	"powershell.exe",
	["-NoProfile", "-NonInteractive", "-Command", cmd],
	{ stdio: "pipe" },
);
if (res.status !== 0 || !fs.existsSync(zipTmp)) {
	fs.rmSync(zipTmp, { force: true });
	fail(
		res.error?.message ||
			res.stderr?.toString().trim() ||
			"zip creation failed",
	);
}
try {
	fs.renameSync(zipTmp, zipDest);
} catch {
	fs.copyFileSync(zipTmp, zipDest);
	fs.rmSync(zipTmp, { force: true });
}
console.log("complete");
