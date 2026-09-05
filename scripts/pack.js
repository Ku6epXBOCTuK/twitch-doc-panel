import fs from 'node:fs/promises';

// app/ — только два html. Контент (md + index.json) живёт в отдельном репозитории.
await fs.rm('app', { recursive: true, force: true });
await fs.mkdir('app', { recursive: true });
await fs.copyFile('dist/viewer/viewer.html', 'app/viewer.html');
await fs.copyFile('dist/config/config.html', 'app/config.html');
console.log('app/ готов: viewer.html + config.html (контент — отдельный репозиторий).');
