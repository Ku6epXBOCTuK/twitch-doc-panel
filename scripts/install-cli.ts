import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Глобальная команда build-docs: кладёт в ~/bin .cmd-шим, который запускает
// builder/build.ts из ЭТОЙ копии репозитория — правки builder'а видны сразу,
// без переустановки. Повторный запуск перезаписывает шим с актуальным путём:
// используй после переезда репозитория.

const repoRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const entry = path.join(repoRoot, "builder", "build.ts");
const binDir = path.join(os.homedir(), "bin");

fs.mkdirSync(binDir, { recursive: true });
const shim = path.join(binDir, "build-docs.cmd");
fs.writeFileSync(shim, `@node "${entry}" %*\r\n`);
console.log(`OK: ${shim}`);
console.log(`    └─ node ${entry}`);
