# План: dev-режим для визуального аудита (без Twitch-конфига)

Статус: план согласован, ожидает реализации.

## Чеклист

- [x] Шаг 1. `builder/build.js` — экспорт `buildIndex(dir)` (CLI остаётся)
- [x] Шаг 2. `vite.config.js` — плагин `dev-content` (живой index.json в dev)
- [x] Шаг 3. `src/viewer/App.svelte` — dev-fallback + `?theme=`
- [x] Шаг 4. `src/config/App.svelte` — предзаполнение в dev
- [ ] Шаг 5. `dev.html` — страница-обёртка (панель 318×496 + config + темы)
- [ ] Шаг 6. README — раздел про dev-аудит
- [ ] Шаг 7. Фикс ошибки Svelte LS в VSCode (см. раздел «Шаг 7»)
- [ ] Проверка: `npm run dev` → `/dev.html` работает без Twitch-конфига;
      `npm run build` не изменился; `npm run screenshots` не сломался

## Проблема

Вне Local Test панель бесполезна: вьювер берёт ссылку на `index.json` только из
конфиг-сегмента Twitch (или `?index=`), поэтому показывает «Ссылка на контент не
задана». Кроме того, `index.json` для `content/docs` надо генерировать вручную
(`npm run build:index`). Верстку невозможно аудировать без Twitch-консоли.

## Идея

`npm run dev` → открыть `http://localhost:8080/dev.html` → панель в реальном
размере 318×496 с живым контентом из `content/docs/`. Без Twitch-конфига, без
ручной генерации индекса. Local Test в консоли остаётся для проверки в контексте
Twitch.

## Шаги

### Шаг 1. `builder/build.js` — рефакторинг

Вынести генерацию индекса в экспортируемую функцию `buildIndex(dir)` (возвращает
массив). CLI-обёртка остаётся как есть. Нужна, чтобы переиспользовать логику в
Vite-мидлвари.

### Шаг 2. `vite.config.js` — плагин `dev-content`

Middleware на `GET /content/docs/index.json`: на каждый запрос читает
`content/docs/*.md` (front-matter через ту же `buildIndex`) и отдаёт свежий
индекс с `Content-Type: application/json`, `Cache-Control: no-store`. Результат:

- `npm run build:index` для dev больше не нужен — правишь `.md`, перезагружаешь
  страницу, список актуален.
- Статику (`*.md`, картинки заголовков) Vite dev и так отдаёт из корня — ничего
  настраивать не надо.

### Шаг 3. `src/viewer/App.svelte` — dev-fallback

В `resolveIndexUrl()` (~строка 24): если `cfg?.indexUrl` нет **и** мы не внутри
Twitch (`isTwitch`) **и** `import.meta.env.DEV` → грузим
`/content/docs/index.json` (относительный URL → hostname `localhost`, он уже в
белом списке `src/shared/content.js`). Статус `need-config` остаётся только
внутри Twitch. Guard `import.meta.env.DEV` гарантирует, что прод-сборка ведёт
себя как раньше.

Плюс мелочь для аудита тем: параметр `?theme=light|dark` перекрывает тему
(сейчас локально всегда dark).

### Шаг 4. `src/config/App.svelte` — предзаполнение в dev

Когда конфига нет и не Twitch (`import.meta.env.DEV`) — предзаполнить поле
`/content/docs/index.json`. Конфиг-вью тоже станет кликабельным локально:
список, порядок, «скрыть», сохранение — как сейчас, в консоль
(`src/shared/twitch.js`, ветка `!ext`).

### Шаг 5. `dev.html` — страница-обёртка (dev-only)

Как обёртка в `scripts/screenshot.js` (~строка 74), но интерактивная:

- панель в рамке ровно 318×496 на фоне в духе Twitch — верстка в реальном
  контексте;
- рядом iframe `config.html`;
- переключатель dark/light (перезагружает iframe с `?theme=`).

В сборку не попадает (в `rollupOptions.input` только viewer/config).

### Шаг 6. README

Обновить раздел «Команды» / «Тест на своём канале»: dev-аудит = `npm run dev` →
`/dev.html`; Local Test по-прежнему для проверки в консоли Twitch.

### Шаг 7. Фикс ошибки Svelte LS в VSCode

Проблема: при открытии/редактировании `.svelte`-файлов в VSCode расширение
Svelte пишет ошибку в Problems:

```txt
Error in vite.config

Error: No Svelte configuration found in vite config. Is @sveltejs/vite-plugin-svelte configured?
```

Цель: убрать ошибку, чтобы language server работал штатно. Причину выяснить при
реализации шага.

## Затрагиваемые файлы

- `builder/build.js`
- `vite.config.js`
- `src/viewer/App.svelte`
- `src/config/App.svelte`
- `dev.html` (новый)
- `README.md`

## Риски

Минимальные: основная логика загрузки/рендера не трогается, меняется только
точка выбора URL индекса.

- Если внутри Twitch конфиг есть — dev-fallback не срабатывает (правильно).
- `?index=` по-прежнему главнее всего — скриншоты (`npm run screenshots`) не
  сломаются.
- Прод-сборка не меняется: guard `import.meta.env.DEV`; `dev.html` не в inputs
  билда; CLI `build:index` сохранён.
