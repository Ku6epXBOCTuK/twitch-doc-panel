import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";
import { mdToBlocks } from "../src/shared/md.js";

// Генератор index.json для репозитория контента:
//   node builder/build.js <папка с .md> [куда записать index.json]
// Сканирует .md, читает front-matter (title обязателен; order, hidden, header)
// и пишет список документов рядом с файлами. Сами .md не изменяются.

const dir = process.argv[2];
if (!dir) {
	console.error(
		"Использование: node builder/build.js <папка с .md> [index.json]",
	);
	console.error("Пример: node builder/build.js content/docs");
	process.exit(1);
}
const out = process.argv[3] ?? path.join(dir, "index.json");

const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
if (!files.length) {
	console.error(`В ${dir} нет .md файлов.`);
	process.exit(1);
}

const index = [];
const problems = [];

for (const fileName of files) {
	const { data, content } = matter(
		await fs.readFile(path.join(dir, fileName), "utf8"),
	);
	if (typeof data.title !== "string" || !data.title.trim()) {
		problems.push(`${fileName}: во front-matter нет title — файл пропущен`);
		continue;
	}
	// Валидация тем же парсером, что в расширении: неподдерживаемое — предупреждение.
	const skips = [];
	mdToBlocks(content, { onSkip: (type) => skips.push(type) });
	for (const s of new Set(skips)) {
		problems.push(
			`${fileName}: «${s}» не поддерживается панелью и будет пропущен`,
		);
	}
	index.push({
		id: fileName.replace(/\.md$/, ""),
		title: data.title,
		order: Number.isFinite(data.order) ? data.order : 1000,
		hidden: Boolean(data.hidden),
		header: typeof data.header === "string" ? data.header : null,
		url: fileName,
	});
}

if (!index.length) {
	console.error("Ни один документ не собран:\n  " + problems.join("\n  "));
	process.exit(1);
}

index.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
await fs.writeFile(out, JSON.stringify(index, null, 2));
console.log(`index.json: ${index.length} документ(ов) → ${out}`);
for (const p of problems) console.warn("  ⚠ " + p);
