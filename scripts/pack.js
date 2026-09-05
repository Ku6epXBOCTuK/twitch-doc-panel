import fs from 'node:fs/promises';

await fs.mkdir('dist/pkg', { recursive: true });
await fs.copyFile('dist/viewer/viewer.html', 'dist/pkg/viewer.html');
await fs.copyFile('dist/config/config.html', 'dist/pkg/config.html');
console.log('dist/pkg готов: viewer.html + config.html — загрузите их содержимое как zip-билд в консоли Twitch.');
