# Twitch Doc Panel Builder

CLI и ESM API для сборки `index.json` из Markdown-документов Twitch Doc Panel.

Требуется Node.js 18 или новее. Пакет публикуется только как ESM.

## CLI

```bash
npx @ku6epxboctuk/twitch-doc-panel-builder <dir> [output]
```

`<dir>` — папка с `.md` и необязательной папкой `banners/`. Если `output` не
задан, CLI записывает `<dir>/index.json`. Существующие Markdown-файлы не
изменяются. Предупреждения о пропущенных блоках и баннерах выводятся в stderr.

## API

```js
import { buildIndex } from "@ku6epxboctuk/twitch-doc-panel-builder";

const { index, problems } = await buildIndex("./docs");
```

`buildIndex()` читает только `.md` верхнего уровня, валидирует front-matter и
возвращает отсортированный индекс вместе с массивом предупреждений. Сам файл она
не записывает.

## Локальная сборка

Из корня репозитория:

```bash
pnpm install
npm --prefix builder run build
```
