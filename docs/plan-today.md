# План на сегодня: лёгкие задачи

## Viewer

- [x] **Отключить scroll shadow** — `src/viewer/ScrollWrapper.svelte`
  - Убрать/закомментировать трюк с 4 фоновыми градиентами
    (`background-attachment` в `main`), пока вместо него не сделаем нормальные
    оверлеи (см. `plan-hard.md`, пункт 3).
  - Проверить визуально в dev-аудите: фон должен остаться чистым, без
    затемнённых кромок.

- [x] **Тёмная/светлая тема viewer** — `ThemeState`, `viewer.css`
  - `data-theme` вешать на `document.documentElement` (сейчас только на `.panel`
    → `color-scheme` и нативные контролы/скроллбары всегда тёмные).
  - Пройтись по компонентам (Pager, StatusMessage, DocRenderer) и прибрать
    хардкод в пользу `var(--*)`.
  - Проверка: audit page + `?theme=light`.

- [x] **Авто-переход по прогрессу** — `src/viewer/Pager.svelte` +
      `src/viewer/viewer-state.svelte.ts`
  - Прогресс-бару добавить `key={current}` (перезапуск анимации на каждую
    страницу) и `onanimationend` → новый проп `onAutoNext` → `viewer.next()`.
  - Отключить при 1 документе / `duration === 0`; ручной prev/next перезапускает
    таймер.

- [x] **Длительность прогресса в конфиге** — `src/shared/types.ts`, `config`,
      `Pager.svelte`, `viewer-state.svelte.ts`
  - `duration?: number` (сек, по умолчанию 10, 0 = выкл) в `BroadcasterConfig`.
  - Длительность через inline `style="--duration: {duration}s"`.
  - В config: новое поле «Автопереход, сек» (в `SaveBar`/новый компонент),
    проброс через `toBroadcasterConfig`/`buildConfigRows`/`save` и чтение в
    viewer-state.

- [x] **Циклический переход** — `src/viewer/viewer-state.svelte.ts`
  - `next()` при last → 0; `prev()` при 0 → last (при `len > 1`).
  - Кнопки пейджера больше не дизейблить; авто-переход тоже зацикливается.

## Config

- [ ] **Описание jsDelivr** — `src/config/IndexUrlField.svelte:20`
  - Только текст: «Контент грузится только через jsDelivr:
    `https://cdn.jsdelivr.net/gh/user/repo@main/index.json`, либо путь рядом с
    виджетом». Валидацию не трогаем.

- [ ] **Direction enum** — `src/shared/docs.ts` +
      `src/config/config-state.svelte.ts` + `src/config/App.svelte`
  - `DIRECTION = { UP: -1, DOWN: 1 }`, тип `Direction`.
  - Убрать дубли `move/moveUp/moveDown`, оставить `move(i, dir: Direction)`.
  - Обновить тесты (`docs.test.ts`).

- [ ] **Тема config-страницы** — `src/config/App.svelte`,
      `IndexUrlField.svelte`, `DocRow.svelte`, `SaveBar.svelte`
  - Сейчас всё хардкод-тёмное (`#0e0e10` и т.д.).
  - Использовать `ThemeState` (как в viewer), вынести CSS-переменные в общий
    файл (напр. `src/shared/theme.css`, импорт и в viewer, и в config),
    `data-theme` на корень, заменить хардкод на `var(--*)`.

## Общее

- [ ] **# приватные поля** — `viewer-state.svelte.ts`, `config-state.svelte.ts`,
      `scroll-thumb-state.svelte.ts`
  - viewer-state: `#cfg`, `#lastCfgJson`, `#lastIndexUrl`, `#qpDoc`
  - config-state: `#savedCfg`
  - scroll-thumb-state: `#mainEl`, `#hideTimer`, `#update`
  - В проекте нет линтера (только prettier + svelte-check) — «линтер» не
    подключаем.
  - Риск: совместимость `$state` с `#`-полями в Svelte 5 — проверить
    `svelte-check`; если не взлетит, `#` оставляем на нереактивных членах
    (`cfg`, `lastCfgJson`, `lastIndexUrl`, `qpDoc`, `mainEl`, `hideTimer`,
    `update`), для `$state`-полей — `private` с пояснением в комментарии.

## Порядок и проверка

Порядок: viewer guard → cycle → авто-переход (п.4+5) → тема → отключить shadow →
config (jsDelivr, Direction, тема) → #-поля.

Проверка после каждого шага: `npm run check`, `npm run test`,
`npm run format -- --check --log-level=warn`, визуально `npm run dev`
(`?theme=light`, `?demoScroll`).
