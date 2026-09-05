import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import { parseDoc, validateDoc, serializeDoc } from './md.js';
import { optimizeImage, hashFile } from './images.js';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'site');

const errors = [];
const imageCache = new Map();

function report(file, pos, hint) {
  errors.push({ file, line: pos?.line ?? 0, column: pos?.column ?? 0, hint });
}

// Все пути в выдаче — ОТНОСИТЕЛЬНЫЕ (от корня контента): вьювер сам резолвит
// их через config.json → contentBase. Никакой привязки к конкретному хостингу.
async function resolveImage(src, { absPath, id, pos }) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) {
    if (!/^https:\/\//i.test(src)) {
      report(absPath, pos, `внешняя картинка должна быть https: ${src}`);
      return null;
    }
    return src;
  }
  const abs = path.resolve(path.dirname(absPath), src);
  if (!abs.startsWith(path.join(CONTENT, path.sep))) {
    report(absPath, pos, `путь картинки вне content/: ${src}`);
    return null;
  }
  try {
    await fs.access(abs);
  } catch {
    report(absPath, pos, `файл картинки не найден: ${src}`);
    return null;
  }
  const hash = await hashFile(abs);
  const name = `${id}-${hash}.webp`;
  if (!imageCache.has(name)) {
    await optimizeImage(abs, path.join(OUT, 'img', name), { width: 640 });
    imageCache.set(name, true);
  }
  return `img/${name}`;
}

async function main() {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(path.join(OUT, 'docs'), { recursive: true });

  const docsDir = path.join(CONTENT, 'docs');
  const files = (await fs.readdir(docsDir)).filter((f) => f.endsWith('.md'));
  if (!files.length) {
    console.error('В content/docs/ нет .md файлов.');
    process.exit(1);
  }

  const index = [];
  for (const fileName of files) {
    const absPath = path.join(docsDir, fileName);
    const id = fileName.replace(/\.md$/, '');
    const { data, content } = matter(await fs.readFile(absPath, 'utf8'));

    if (typeof data.title !== 'string' || !data.title.trim()) {
      report(absPath, null, 'front-matter: обязательно поле title (строка)');
      continue;
    }

    const ast = parseDoc(content);
    errors.push(
      ...validateDoc(ast, fileName).map((e) => ({
        file: e.file,
        line: e.line,
        column: e.column,
        hint: `${e.type}: ${e.hint}`,
      })),
    );
    if (errors.some((e) => e.file === fileName)) continue;

    const blocks = await serializeDoc(ast, {
      resolveImage: (src, pos) => resolveImage(src, { absPath, id, pos }),
    });

    // Заголовочная картинка: относительный путь от content/assets, кроп 636×340 (318×170 @2x).
    let header = null;
    if (data.header) {
      const headerPath = path.resolve(CONTENT, 'assets', data.header);
      try {
        await fs.access(headerPath);
      } catch {
        report(absPath, null, `front-matter header: файл не найден content/assets/${data.header}`);
        continue;
      }
      const name = `${id}-header.webp`;
      await optimizeImage(headerPath, path.join(OUT, 'img', name), {
        width: 636,
        height: 340,
      });
      header = `img/${name}`;
    }

    await fs.writeFile(
      path.join(OUT, 'docs', `${id}.json`),
      JSON.stringify({ id, title: data.title, header, blocks }),
    );
    index.push({
      id,
      title: data.title,
      order: Number.isFinite(data.order) ? data.order : 1000,
      hidden: Boolean(data.hidden),
      header,
      url: `docs/${id}.json`,
    });
  }

  if (errors.length) {
    console.error('\nОшибки сборки контента:');
    for (const e of errors) {
      console.error(`  ${e.file}${e.line ? `:${e.line}${e.column ? `:${e.column}` : ''}` : ''} — ${e.hint}`);
    }
    process.exit(1);
  }

  index.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  await fs.writeFile(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`Готово: ${index.length} документ(ов) → site/ (index.json, docs/, img/)`);
}

await main();
