import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fail, repoRoot } from "./lib/repo.ts";

// dist/ — html + ассеты (viewer + config) уже плоские, zip пишется из него
// напрямую. Контент (md + index.json) живёт в отдельном репозитории.
const distDir = path.join(repoRoot, "dist");
if (!fs.existsSync(path.join(distDir, "viewer.html"))) {
	fail(`dist/viewer.html not found - run "npm run build" first`);
}
if (!fs.existsSync(path.join(distDir, "config.html"))) {
	fail(`dist/config.html not found - run "npm run build" first`);
}

const zipDest = path.join(repoRoot, "doc-panel.zip");
const zipTmp = path.join(os.tmpdir(), `doc-panel-${process.pid}.zip`);
fs.rmSync(zipTmp, { force: true });
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const cmd = [
	"Add-Type -AssemblyName System.IO.Compression.FileSystem;",
	`$src = ${q(distDir)};`,
	`$dst = ${q(zipTmp)};`,
	"$zip = [System.IO.Compression.ZipFile]::Open($dst, 'Create');",
	"try {",
	"  Get-ChildItem -LiteralPath $src -Recurse -File | Where-Object { $_.Extension -ne '.zip' } | ForEach-Object {",
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
