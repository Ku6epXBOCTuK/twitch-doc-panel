# Dev-режим для визуального аудита (без Twitch-конфига)

Статус: ядро реализовано. Осталось: README, фикс Svelte LS в VSCode, финальная
проверка.

## Чеклист

- [x] Шаг 1. `builder/build.js` — экспорт `buildIndex(dir)` (CLI остаётся)
- [x] Шаг 2. `vite.config.js` — плагин `dev-content` (живой index.json в dev)
- [x] Шаг 3. `src/viewer/App.svelte` — `?theme=light|dark` для аудита тем
- [x] Шаг 4. `src/config/App.svelte` — предзаполнение поля индекса в dev
- [x] Шаг 5. `dev.html` — страница-обёртка (viewer 318×496 + config + темы)
- [x] Шаг 6. `dev.html` открывается по корню `/` (плагин `dev-shell` в
      vite.config.js)
- [x] Шаг 7. Единая dev-логика: только `content.js` и `twitch.js` через
      `import.meta.env.DEV`
- [ ] Шаг 8. README — раздел про dev-аудит
- [ ] Шаг 9. Фикс ошибки Svelte LS в VSCode (см. раздел «Шаг 9»)
- [ ] Проверка: `npm run dev` → `https://localhost:8080/` работает без
      Twitch-конфига; `npm run build` не изменился; `npm run screenshots` не
      сломался

## Проблема

Вне Local Test панель бесполезна: вьювер берёт ссылку на `index.json` только из
конфиг-сегмента Twitch (или `?index=`), поэтому показывает «Ссылка на контент не
задана». Кроме того, `index.json` для `content/docs` надо генерировать вручную
(`npm run build:index`). Верстку невозможно аудировать без Twitch-консоли.

## Итоговый UX

`npm run dev` → `https://localhost:8080/` (HTTPS с mkcert-сертификатом из
`certs/`, без него HTTP). Корень `/` отдаёт `dev.html` — страницу аудита: панель
в реальном размере 318×496 с живым контентом из `content/docs/`, рядом
config-вью и переключатель темы. Без Twitch-конфига, без ручной генерации
индекса. Local Test в консоли остаётся для проверки в контексте Twitch.

## Что сделано

### Шаг 1. `builder/build.js` — рефакторинг

Генерация индекса вынесена в экспортируемую функцию `buildIndex(dir)`
(возвращает массив и список проблем). CLI-обёртка осталась как есть —
переиспользуется в Vite-мидлвари.

### Шаг 2. `vite.config.js` — плагин `dev-content`

Middleware на `GET /content/docs/index.json`: на каждый запрос читает
`content/docs/*.md` через `buildIndex` и отдаёт свежий индекс с
`Content-Type: application/json`, `Cache-Control: no-store`. Зарегистрирована в
теле `configureServer` до внутренних мидлварей Vite — перехватывает запрос
раньше статики. Результат: `npm run build:index` для dev не нужен — правишь
`.md`, перезагружаешь страницу, список актуален. Статику (`.md`, картинки
заголовков) Vite и так отдаёт из корня.

Там же в `vite.config.js`:

- `dev-cors` — CORS-заголовки (включая `Access-Control-Allow-Private-Network`)
  для supervisor'а Twitch: без них Local Test падает с «CORS error»;
- `dev-shell` — `GET /` переписывается на `/dev.html` (apply: serve):
  `npm run dev` → сразу страница аудита, отдельный путь помнить не надо;
- HTTPS по mkcert-сертификатам из `certs/` (есть — https, нет — http).

### Шаг 3. `src/viewer/App.svelte` — `?theme=`

Параметр `?theme=light|dark` перекрывает тему (иначе локально всегда dark —
заглушка `onContext` отдаёт dark). Без параметра тема приходит из Twitch, как
раньше.

### Шаг 4. `src/config/App.svelte` — предзаполнение в dev

Конфига нет → поле индекса предзаполняется через `initialIndexUrl()` из
`content.js` (в dev — локальный `/content/docs/index.json`) и список грузится
сразу: content/docs виден без ручного ввода ссылки. Конфиг-вью кликабелен
локально: список, порядок, «скрыть», сохранение — как в Twitch.

### Шаг 5. `dev.html` — страница-обёртка (dev-only)

- viewer в рамке ровно 318×496 на фоне в духе Twitch — верстка в реальном
  контексте;
- рядом config-вью (640×640);
- переключатель dark/light — перезагружает viewer-iframe с `?theme=`.

В билд не попадает: в inputs только viewer/config.

### Шаг 6. Единая dev-логика

Svelte-компоненты вообще не знают про dev — они вызывают чистые функции из
`src/shared/content.js` и `src/shared/twitch.js`, где проверки сделаны прямо
через `import.meta.env.DEV` (статическая замена Vite — dev-ветки вырезаются из
прод-бандла).

- `src/shared/content.js`: `resolveIndexUrl(cfg)` — URL индекса для viewer
  (конфиг канала → `DEFAULT_INDEX_URL` → в dev локальный
  `/content/docs/index.json`, в проде без конфига — `error: 'need-config'`;
  `bad-host` с деталями — тоже отсюда). `initialIndexUrl(cfg)` — с чего стартует
  поле в config-вью.
- `src/shared/twitch.js`: в dev — моки: тема dark, конфиг канала хранится в
  localStorage (`dev:broadcaster-config`), «Сохранить» в config-вью пишет туда,
  viewer ловит storage-событие — работает как onChanged в Twitch: сохранила в
  конфиге → viewer перезагрузил список с порядком/скрытыми. В проде — только
  реальные API расширения.

Следствие: Local Test тоже работает на дев-моках (конфиг-сегмент рига не
читается). Реальный конфиг Twitch проверять выкладкой на канал.

## Осталось

### Шаг 7. README

Обновить раздел «Команды» / «Тест на своём канале»: dev-аудит = `npm run dev` →
`https://localhost:8080/`; Local Test по-прежнему для проверки в консоли Twitch.

### Шаг 8. Фикс ошибки Svelte LS в VSCode

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
- `src/shared/content.js`
- `src/shared/twitch.js`
- `dev.html`
- `README.md`

## Риски

Минимальные: основная логика загрузки/рендера не трогается, меняется только
точка выбора URL индекса.

- Если внутри Twitch конфиг есть — dev-fallback не срабатывает (правильно).
- `?index=` по-прежнему главнее всего — скриншоты (`npm run screenshots`) не
  сломаются.
- Прод-сборка не меняется: `import.meta.env.DEV` статический — dev-ветки
  вырезаются; `dev.html` не в inputs билда; CLI `build:index` сохранён.
