# План: публикация `@ku6epxboctuk/twitch-doc-panel-builder`

Статус: пакет настроен и проверен локально; публикация в npm не выполнялась.

## Решения после ревью

- Корень репозитория использует pnpm, поэтому `esbuild` добавлен в корневые
  `devDependencies`, а lock-файл обновляется через `pnpm install`.
- Корневой пакет помечен `private`, чтобы случайный `npm publish` из корня не
  опубликовал пакет расширения.
- `builder` остаётся publish boundary, но не отдельным workspace-пакетом:
  исходники и build-инструменты берутся из корня без второго lock-файла.
- Runtime собирается одним ESM-файлом `builder/dist/build.js`; импорты
  `src/shared/*` инлайнятся. `gray-matter` и `marked` остаются внешними
  зависимостями.
- Публичный entry и `bin` указывают на один файл. Определение прямого запуска
  сравнивает realpath, поэтому CLI работает и через POSIX symlink npm-bin.
- `tsc` генерирует декларации в `dist/builder/` и `dist/src/shared/`;
  build-helper детерминированно заменяет оставшиеся относительные `.ts` на `.js`
  в `.d.ts` и проверяет результат.
- `prepack`, а не `prepublishOnly`, запускает сборку для `npm pack` и
  `npm publish`. Перед сборкой `builder/dist` удаляется целиком.
- Пакет ESM-only, Node.js `>=18`. Npm всегда добавляет `package.json`, README и
  лицензию к пользовательскому `files: ["dist"]`.

## Настроенные файлы

1. `builder/package.json` — метаданные, exports/bin/types, зависимости и
   lifecycle.
2. `builder/tsconfig.types.json` — отдельная declaration-only сборка.
3. `builder/build.mjs` — очистка, esbuild, tsc и проверка обязательных outputs.
4. `builder/README.md` — CLI и API `buildIndex(dir)`.
5. `builder/LICENSE` — текст MIT внутри публикуемого tarball.
6. `builder/build.ts` — только совместимость direct-run через realpath.
7. Корневой `package.json` и `pnpm-lock.yaml` — `private`, `build:builder` и
   прямой `esbuild`.

## Локальная сборка

Из корня репозитория:

```bash
pnpm install
pnpm run build:builder
```

Ожидаемые файлы:

```text
builder/dist/build.js
builder/dist/builder/build.d.ts
builder/dist/src/shared/md.d.ts
builder/dist/src/shared/types.d.ts
```

## Проверки

Из корня:

```bash
pnpm run check
pnpm test
node --input-type=module -e "import { buildIndex } from './builder/dist/build.js'; const result = await buildIndex('./fixtures'); if (!result.index.length) process.exit(1)"
node builder/dist/build.js fixtures <временный-файл>/index.json
```

Из `builder/`:

```bash
npm pack --dry-run --json
```

Реальный tarball установлен в отдельный временный consumer. Проверены
установленный `twitch-doc-panel-builder`, импорт по package name, декларации с
`moduleResolution: NodeNext` и direct-run через junction к `dist`.

## Публикация

Перед выпуском проверить `npm whoami`, registry, доступ к scope и требования
2FA/token. Ответ 404 от `npm view` не доказывает свободное имя: приватный scope
или пакет без публичного доступа может не отвечать анонимному клиенту. Первая
публикация не создаёт scope автоматически — аккаунт должен им владеть.

После `npm login` и повторного `npm pack --dry-run`:

```bash
cd builder
npm publish --dry-run
npm publish
```

Следующие релизы: бамп версии в `builder/package.json` →
`pnpm run build:builder` → повторный smoke-тест → `npm publish`.
