# План на потом: кеширование, предзагрузка, scroll shadow

Задачи посложнее — после лёгкого плана (`plan-today.md`).

## Viewer

- [ ] **Type guard для READY** — `src/viewer/viewer-state.svelte.ts` +
      `src/viewer/App.svelte`
  - Добавить тип-гард `isViewerReady(view)`: сужает `ViewerState` до
    `{ status: "ready"; docs: DocEntry[]; currentDoc: DocEntry; doc: LoadedDoc }`.
  - В `App.svelte` ветка `{#if isViewerReady(viewer)}` — внутри неё `currentDoc`
    и `doc` валидны по типам, убираются `?.` и лишние проверки
    (`currentDoc?.banner` → `currentDoc.banner`). Никакой логики рендера не
    добавляем.

- [ ] **Кеширование документов** — `src/viewer/viewer-state.svelte.ts`
  - Модульный `Map<url, Promise<LoadedDoc>>`.
  - `loadDoc(i)` берёт из кеша (ждёт промис), по неудаче удаляет запись и
    перезапрашивает.
  - Кеш отдаёт готовые блоки (после `absolutizeUrls`), чтобы не парсить md
    повторно.

- [ ] **Предзагрузка соседних** — `src/viewer/viewer-state.svelte.ts`
  - После успешной загрузки `i` фоном вызвать `loadDoc(i-1)` и `loadDoc(i+1)`
    (кеш из прошлого пункта сам кеширует).
  - Картинки: догрузка баннера текущего/соседних через `new Image()` → в
    браузерный кеш.

- [ ] **Scroll shadow** — `src/viewer/ScrollWrapper.svelte`
  - Сейчас градиентный трюк отключен (см. `plan-today.md`, пункт «Отключить
    scroll shadow»).
  - Заменить его на оверлеи: два абсолютных градиента сверху/снизу внутри
    `.scrollwrap`, показываются по `scrollTop > 2` / `scrollBottom > 2`.
  - Проверить в dev-аудите (318×500) и в `demoScroll`-режиме.

## Порядок и проверка

Порядок: кеш → предзагрузка → shadow.

Проверка после каждого шага: `npm run check`, `npm run test`,
`npm run format -- --check --log-level=warn`, визуально `npm run dev`
(`?theme=light`, `?demoScroll`).
