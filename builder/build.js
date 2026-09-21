import matter from "gray-matter";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { mdToBlocks } from "../src/shared/md.js";

// Генератор index.json для репозитория контента:
//   node builder/build.js [папка с .md] [куда записать index.json]
// Без аргументов — текущая папка. Сканирует .md, читает front-matter
// (title обязателен; order, hidden, header) и пишет список документов рядом
// с файлами. Сами .md не изменяются.
// buildIndex(dir) — переиспользуемая функция (мидлварь dev-режима в vite.config.js).

/**
 * Собирает список документов из .md файлов папки.
 * @returns {Promise<{index: Array, problems: string[]}>}
 * @throws {Error} если в папке нет .md или не собран ни один документ
 */
export async function buildIndex(dir) {
	const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
	if (!files.length) {
		throw new Error(`В ${dir} нет .md файлов.`);
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
		throw new Error("Ни один документ не собран:\n  " + problems.join("\n  "));
	}

	index.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
	return { index, problems };
}

// CLI-обёртка: выполняется только при запуске файла напрямую,
// не при импорте buildIndex из vite.config.js и т.п.
try {
	const isDirectRun =
		import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
	if (isDirectRun) {
		const dir = process.argv[2] ?? process.cwd();
		const out = process.argv[3] ?? path.join(dir, "index.json");

		try {
			const { index, problems } = await buildIndex(dir);
			await fs.writeFile(out, JSON.stringify(index, null, 2));
			console.log(`index.json: ${index.length} документ(ов) → ${out}`);
			for (const p of problems) console.warn("  ⚠ " + p);
		} catch (e) {
			console.error(e.message);
			process.exit(1);
		}
	}
} catch {
	// argv[1] не существует (запуск как модуль) — не CLI, молча выходим.
}
