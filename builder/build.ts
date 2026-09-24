import matter from "gray-matter";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { mdToBlocks } from "../src/shared/md.ts";
import {
	DEFAULT_DOC_ORDER,
	type DocEntry,
	type DocFrontMatter,
} from "../src/shared/types.ts";

// Генератор index.json для репозитория контента:
//   node builder/build.ts [папка с .md] [куда записать index.json]
// Без аргументов — текущая папка. Сканирует .md, читает front-matter
// (title обязателен; order, hidden) и пишет список документов рядом
// с файлами. Сами .md не изменяются. Баннеры из подпапки banners/ автоматически
// становятся banner документов (about.md ← banners/about.png|jpg|jpeg|webp).
// buildIndex(dir) — переиспользуемая функция (мидлварь dev-режима в vite.config.ts).

const IMG_EXT = new Set(["png", "jpg", "jpeg", "webp"]);
const IMG_EXT_ORDER = ["png", "jpg", "jpeg", "webp"];

// Собирает список документов из .md файлов папки.
// Бросает Error, если в папке нет .md или не собран ни один документ.
export async function buildIndex(
	dir: string,
): Promise<{ index: DocEntry[]; problems: string[] }> {
	const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
	if (!files.length) {
		throw new Error(`В ${dir} нет .md файлов.`);
	}

	const index: DocEntry[] = [];
	const problems: string[] = [];

	for (const fileName of files) {
		const { data, content } = matter(
			await fs.readFile(path.join(dir, fileName), "utf8"),
		);
		const fm = data as DocFrontMatter;
		if (typeof fm.title !== "string" || !fm.title.trim()) {
			problems.push(`${fileName}: во front-matter нет title — файл пропущен`);
			continue;
		}
		// Валидация тем же парсером, что в расширении: неподдерживаемое — предупреждение.
		const skips: string[] = [];
		mdToBlocks(content, { onSkip: (type) => skips.push(type) });
		for (const s of new Set(skips)) {
			problems.push(
				`${fileName}: «${s}» не поддерживается панелью и будет пропущен`,
			);
		}
		index.push({
			id: fileName.replace(/\.md$/, ""),
			title: fm.title,
			order: Number.isFinite(fm.order)
				? (fm.order as number)
				: DEFAULT_DOC_ORDER,
			hidden: Boolean(fm.hidden),
			banner: null,
			url: fileName,
		});
	}

	// Баннеры: banners/<id>.png|jpg|jpeg|webp → banner документа.
	// Нет папки banners — предупреждение, документы остаются без баннера.
	const bannersDir = path.join(dir, "banners");
	let bannerFiles: string[] | null = null;
	try {
		bannerFiles = (await fs.readdir(bannersDir)).filter((f) =>
			IMG_EXT.has(path.extname(f).toLowerCase().slice(1)),
		);
	} catch (e) {
		if ((e as NodeJS.ErrnoException)?.code === "ENOENT") {
			problems.push("banners/: нет папки — все документы без баннера");
		} else {
			problems.push(`banners/: не удалось прочитать (${(e as Error).message})`);
		}
	}

	if (bannerFiles) {
		const prio = (f: string) =>
			IMG_EXT_ORDER.indexOf(path.extname(f).toLowerCase().slice(1));
		bannerFiles.sort((a, b) => prio(a) - prio(b));
		const byBase = new Map<string, string>();
		for (const f of bannerFiles) {
			const base = f.replace(/\.[^.]+$/, "");
			const cur = byBase.get(base);
			if (cur) {
				problems.push(
					`banners/: несколько картинок для «${base}» (${cur}, ${f}) — взят ${cur}`,
				);
			} else {
				byBase.set(base, f);
			}
		}
		const mdBases = new Set(files.map((f) => f.replace(/\.md$/, "")));
		for (const d of index) {
			const b = byBase.get(d.id);
			if (b) {
				d.banner = `banners/${b}`;
			} else {
				problems.push(
					`${d.id}.md: в banners/ нет баннера (${d.id}.png|jpg|webp)`,
				);
			}
		}
		for (const [base, f] of byBase) {
			if (!mdBases.has(base)) {
				problems.push(
					`banners/${f}: нет ${base}.md — картинка не используется`,
				);
			}
		}
	}

	if (!index.length) {
		throw new Error("Ни один документ не собран:\n  " + problems.join("\n  "));
	}

	index.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
	return { index, problems };
}

// CLI-обёртка: выполняется только при запуске файла напрямую,
// не при импорте buildIndex из vite.config.ts и т.п.
try {
	const isDirectRun =
		process.argv[1] !== undefined &&
		(await fs.realpath(process.argv[1])) ===
			(await fs.realpath(fileURLToPath(import.meta.url)));
	if (isDirectRun) {
		const dir = process.argv[2] ?? process.cwd();
		const out = process.argv[3] ?? path.join(dir, "index.json");

		try {
			const { index, problems } = await buildIndex(dir);
			await fs.writeFile(out, JSON.stringify(index, null, 2));
			console.log(`index.json: ${index.length} документ(ов) → ${out}`);
			for (const p of problems) console.warn("  ⚠ " + p);
		} catch (e) {
			console.error((e as Error).message);
			process.exit(1);
		}
	}
} catch {
	// argv[1] не существует (запуск как модуль) — не CLI, молча выходим.
}
