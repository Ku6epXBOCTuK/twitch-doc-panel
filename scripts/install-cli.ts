import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fail, repoRoot } from "./lib/repo.ts";

// Глобальная команда build-docs: кладёт в ~/bin .cmd-шим, который запускает
// builder/build.ts из ЭТОЙ копии репозитория — правки builder'а видны сразу,
// без переустановки. Повторный запуск перезаписывает шим с актуальным путём:
// используй после переезда репозитория.

const entry = path.join(repoRoot, "builder", "build.ts");
if (!fs.existsSync(entry)) {
	fail(`builder entry not found: ${entry}`);
}
const binDir = path.join(os.homedir(), "bin");
fs.mkdirSync(binDir, { recursive: true });
const shim = path.join(binDir, "build-docs.cmd");
fs.writeFileSync(shim, `@node "${entry}" %*\r\n`);
console.log(`OK: ${shim}`);
console.log(`    -> node ${entry}`);
