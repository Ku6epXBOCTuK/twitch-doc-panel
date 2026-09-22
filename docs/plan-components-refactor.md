# План рефакторинга: компоненты → мелкие, логика → ts

Статус: план согласован. Реализация по шагам, после каждого шага — ревью и
коммит (делает автор, не агент). Стартуем с шага 0.

## Диагноз

| Файл                            | Строк | Проблема                                                                                                              |
| ------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------- |
| `src/viewer/App.svelte`         | 411   | ~215 строк скрипта: тема, конфиг, загрузка индекса/дока, `absolutize`, оверлей-скроллбар с ResizeObserver             |
| `src/config/App.svelte`         | 239   | загрузка/валидация индекса, строки списка, move/save — всё в скрипте компонента                                       |
| `src/shared/DocRenderer.svelte` | 173   | helpers `safeImg/safeLink/textOf/listItems` можно в ts (сам компонент — рекурсивный шаблон, делить по тегам не будем) |

Дублирование: viewer (`loadIndex`) и config (`load`) оба делают fetch →
валидация массива → фильтр `hidden` → сортировка по `order`.

## Принципы

- Компоненты «тупые»: пропсы вниз, колбэки вверх, почти ноль логики.
- Состояние и логика — в `.svelte.ts`-store'ах (Svelte 5 руны) и чистых
  ts-модулях.
- Чистая логика покрыта юнит-тестами (vitest).
- Решение о поведении не меняется — только структура. CSS-переменные (`--text`,
  `--muted`, …) остаются на корневом `.panel` — каскадом доходят до детей.

## Целевая структура

```sh
src/
  shared/
    types.ts              + ConfigRow
    docs.ts               НОВЫЙ: fetchDocsIndex, sortByOrder, applyHidden,
                          buildConfigRows, moveRow, toBroadcasterConfig
    md.ts                 + absolutizeUrls (перенос из viewer/App.svelte)
    md-sanitize.ts        НОВЫЙ: safeImg, safeLink (перенос из DocRenderer)
    theme.svelte.ts       НОВЫЙ: реактивная тема (?theme + onContext)
    DocRenderer.svelte    упрощается: helpers → md-sanitize.ts
  viewer/
    viewer-store.svelte.ts   НОВЫЙ: status/docs/current/doc, loadIndex/loadDoc/
                          prev/next/retry, init (?index/?doc + подписка на конфиг)
    scroll-thumb.svelte.ts   НОВЫЙ: visible/top/height, update/onScroll, demoScroll
    App.svelte            ~70 строк: композиция + CSS-переменные темы
    StatusMessage.svelte  5 состояний (props: status, detail; onRetry)
    DocView.svelte        баннер + заголовок + DocRenderer (props: banner, title,
                          blocks, error)
    ScrollArea.svelte     main + .sb-thumb, children-snippet
    Pager.svelte          ‹ title › (props: index, count, title; onPrev/onNext)
  config/
    config-store.svelte.ts   НОВЫЙ: savedCfg/indexUrl/list/status/load/move/
                          toggle/save
    App.svelte            ~70 строк: композиция
    IndexUrlField.svelte  поле + подсказка + кнопка (bindable value, onSubmit)
    DocRow.svelte         строка (props: title, isFirst, isLast, hidden;
                          колбэки) — полностью тупая
    SaveBar.svelte        кнопка + «Сохранено» (можно оставить в App — решить
                          на ревью)
```

## Шаги

### Шаг 0. Vitest + baseline (~30 мин)

- `pnpm add -D vitest`, скрипт `"test": "vitest run"` в `package.json`.
- Смоук-тест на существующую чистую функцию (`isContentUrl`, `resolveIndexUrl`)
  — проверка инфраструктуры.
- Проверка: `pnpm check`, `pnpm test`.

### Шаг 1. Чистая логика → ts, компоненты пока монолитны (~2 ч)

- `absolutize` → `md.ts`; `docs.ts` с общей для viewer/config логикой;
  `md-sanitize.ts` для DocRenderer.
- Тесты: `docs.test.ts` (fetch через мок, sort, rows, move), `md.test.ts`
  (absolutize), `md-sanitize.test.ts`.
- Проверка: `pnpm test`, `pnpm check`, ручной dev-прогон.

#### Опционально: упрощение dispatch в DocRenderer

- Цепочку `if tag === ...` (~13 веток) сократить до ~7: теги-обёртки
  (`p, em, strong, del, li, blockquote, h1–h6`) — через whitelist-`Set` в
  скрипте + одна ветка `<svelte:element this={tag}>` вокруг содержимого.
- Спец-случаи (`br, hr, code, a, img, ul/ol`) остаются отдельными ветками — у
  каждого своя логика (атрибуты, санитайзинг, извлечение items).
- Буквальный `Record<tag, Snippet>` не подходит: сниппеты живут только в
  шаблоне, карту из `<script>` не собрать — вышел бы больший бойлерплейт.
- Поведение не меняется: неизвестные теги мимо whitelist → warning.

### Шаг 2. Store'ы на рунах (`.svelte.ts`) (~1.5 ч)

- `ViewerStore`, `ScrollThumb`, `theme`, `ConfigStore` — компоненты оставляют
  только `$effect` для DOM-привязок (bind:this, ResizeObserver).
- Скрипты App'ов сжимаются до `const store = new ViewerStore()` + разметка.
- Проверка: `pnpm check`, dev обеих вьюх.

### Шаг 3. Разбивка viewer (~1.5 ч)

- StatusMessage, DocView, ScrollArea, Pager; App — композиция.
- Кнопочные стили, общие для viewer → `viewer.css`; scoped-стили разъезжаются по
  компонентам.
- Проверка: dev c `?theme=light`, `?doc=…`, `?demoScroll=1`.

### Шаг 4. Разбивка config (~1 ч)

- IndexUrlField, DocRow (тупая, только колбэки), SaveBar.
- Проверка: dev config-вью (load/move/hidden/save + storage-синк между
  вкладками).

### Шаг 5. Финал (~30 мин)

- `pnpm format`, `pnpm check && pnpm test && pnpm build`, `npm run screenshots`.
- Обновить `backlog.md` (снять пункт «отрефакторить svelte компоненты»).

## Риски

- **Scoped-стили**: селектор `button` в App сейчас стилизует и пейджер — при
  разбивке уедет в `viewer.css` или scoped в Pager.
- **`$state` в классах** — работает в Svelte 5 в `.svelte.ts`, но проверить на
  шаге 2 в первую очередь.
- **DocRenderer сознательно не делим** — рекурсивный рендер по своей природе
  шаблон, дробление на per-tag компоненты усложнит код.

Итого App.svelte: 411 → ~70 строк, config: 239 → ~70, остальные файлы по 30–100
строк.
