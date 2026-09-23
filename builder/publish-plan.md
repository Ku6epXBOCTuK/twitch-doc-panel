# План: публикация `@ku6epxboctuk/twitch-doc-panel-builder`

Имя на npm свободно (npm вернул 404). Аккаунт не залогинен — нужен `npm login`.
Подход: бандлинг при публикации, без дублей. Импорты `../src/shared/*` остаются,
в npm уезжает только собранный `dist/`. Единственный источник правды —
`src/shared/`. `builder/build.ts` не меняется (его используют
`vite.config.ts:5`, `scripts/screenshot.ts:12`, `scripts/install-cli.ts:11`).

## Шаги

1. **`builder/package.json` (новый)**
   - `name: "@ku6epxboctuk/twitch-doc-panel-builder"`, `version: "0.1.0"`
   - `"type": "module"`
   - `bin: { "twitch-doc-panel-builder": "dist/build.js" }`
   - `exports: { ".": { types: "./dist/build.d.ts", import: "./dist/build.js" } }`,
     `main: "dist/build.js"`
   - `files: ["dist"]`
   - `publishConfig: { "access": "public" }` (scoped пакеты по умолчанию
     приватные)
   - `dependencies: { "gray-matter": "^4.0.3", "marked": "^12.0.0" }` (внешние,
     не бандлим)
   - `engines: { "node": ">=18" }`
   - скрипты: `build`, `prepublishOnly`

2. **`builder/tsconfig.types.json` (новый)** —
   `tsc --declaration --emitDeclarationOnly` → `dist/*.d.ts`, с
   `rewriteRelativeImportExtensions` (TS 5.7+, в репо 5.9) и `rootDir` на корень
   репо, чтобы включить `src/shared/md.ts` + `types.ts`.

3. **`builder/README.md` (новый)** — CLI-использование + API `buildIndex(dir)`.

4. **Правка `package.json` в корне** — добавить `esbuild` в `devDependencies`
   (typescript уже есть), `npm install`. Сборка из общего `node_modules`, второй
   установщик не нужен.

5. **Сборка** (`npm run build` в `builder/`):
   - esbuild: `build.ts` бандлится целиком (md.ts/types.ts инлайнятся),
     `--external:gray-matter --external:marked`,
     `--platform=node --format=esm --target=node18`, banner
     `#!/usr/bin/env node` → `dist/build.js`. Один файл — и `bin`, и библиотека:
     CLI-обёртка `isDirectRun` (build.ts:128) работает в обоих режимах как
     задумано.
   - tsc: генерация `dist/*.d.ts`.

6. **Проверка**: `npm pack --dry-run` (состав тарбола), тест
   `node dist/build.js fixtures` и импорт `buildIndex`.

7. **Публикация**: `npm login`, затем `npm publish` из `builder/` (первый
   публикации создаст скоп `@ku6epxboctuk`). Далее:
   `npx @ku6epxboctuk/twitch-doc-panel-builder <dir> <out>`.

## Итог

Ноль изменений в `builder/build.ts` и `src/shared/`, ноль дублей, репо-скрипты
продолжают работать как раньше.

## Замечания

- Опубликованный пакет будет только ESM (репо с `type: module` и так ESM).
- Следующие релизы: бамп версии в `builder/package.json` → `npm run build` →
  `npm publish`.
