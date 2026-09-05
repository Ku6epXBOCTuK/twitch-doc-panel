import fs from 'node:fs/promises';
import path from 'node:path';

await fs.mkdir('app', { recursive: true });
await fs.copyFile('dist/viewer/viewer.html', 'app/viewer.html');
await fs.copyFile('dist/config/config.html', 'app/config.html');

// Контент кладём рядом с html: одна папка = один Base URI = один origin.
for (const entry of ['index.json', 'docs', 'img']) {
  const src = path.join('site', entry);
  try {
    await fs.access(src);
  } catch {
    continue;
  }
  const dest = path.join('app', entry);
  await fs.rm(dest, { recursive: true, force: true });
  await fs.cp(src, dest, { recursive: true });
}
console.log('app/ готов: viewer.html + config.html + index.json + docs/ + img/');
