import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"..",
);

export function fail(message: string): never {
	console.error(message);
	process.exit(1);
}
