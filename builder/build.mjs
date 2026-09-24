import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const builderDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(builderDir);
const distDir = path.join(builderDir, "dist");
const tscPath = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");
const tsconfigPath = path.join(builderDir, "tsconfig.types.json");

async function rewriteDeclarationImports(dir) {
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const file = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			await rewriteDeclarationImports(file);
		} else if (entry.name.endsWith(".d.ts")) {
			const source = await fs.readFile(file, "utf8");
			const output = source.replace(
				/(from\s+["']\.[^"']+)\.ts(["'])/g,
				"$1.js$2",
			);
			if (output !== source) await fs.writeFile(file, output);
		}
	}
}

await fs.rm(distDir, { recursive: true, force: true });
await fs.access(tscPath);

await build({
	entryPoints: [path.join(builderDir, "build.ts")],
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node18",
	external: ["gray-matter", "marked"],
	outfile: path.join(distDir, "build.js"),
	banner: { js: "#!/usr/bin/env node" },
});

const tsc = spawnSync(process.execPath, [tscPath, "-p", tsconfigPath], {
	cwd: builderDir,
	stdio: "inherit",
});
if (tsc.error) throw tsc.error;
if (tsc.status !== 0) process.exit(tsc.status ?? 1);

await rewriteDeclarationImports(distDir);

const outputFiles = [
	"build.js",
	"builder/build.d.ts",
	"src/shared/md.d.ts",
	"src/shared/types.d.ts",
];
await Promise.all(
	outputFiles.map((file) => fs.access(path.join(distDir, file))),
);
const declarations = await Promise.all(
	outputFiles
		.filter((file) => file.endsWith(".d.ts"))
		.map((file) => fs.readFile(path.join(distDir, file), "utf8")),
);
if (declarations.some((source) => /from\s+["']\.[^"']+\.ts["']/.test(source))) {
	throw new Error("Generated declarations contain a relative .ts import");
}

const bundle = await fs.readFile(path.join(distDir, "build.js"), "utf8");
if (!/^#!\/usr\/bin\/env node\r?\n/.test(bundle)) {
	throw new Error("dist/build.js has no executable shebang");
}

console.log("Builder package built in dist/");
