# План рефакторинга: scripts/

Статус: план согласован, **ожидает команды на старт**. Выполнение по шагам
чеклиста, каждый шаг — отдельная команда/коммит. Решения согласованы: HTML — в
`scripts/templates/`; staging скриншотов — через `buildIndex()` из
`builder/build.ts` (строгое поведение); упаковка зипа — на PowerShell (7-Zip
больше не нужен); `install-cli` — только Windows.

## Диагноз

- **Дублирование (×3):** `findBrowser()` + пути Chrome/Edge (`assets.ts:14`,
  `render-svg.ts:17`, `screenshot.ts:21`); аргументы Chrome (`--headless=new`,
  `--screenshot=...`) там же; SVG→HTML-обёртка (`assets.ts:44-50`,
  `render-svg.ts:36-44`); mkdtemp tmp/profile + rmSync — в трёх файлах.
- **Утечка temp-папок:** в `assets.ts` и `render-svg.ts` при ошибке
  (`process.exit(1)`) tmp/profile не удаляются — нет try/finally.
- **HTML внутри TS:** `screenshot.ts:111-153` — страница-обёртка (~40 строк)
  инлайном; `assets.ts:49`, `render-svg.ts:43` — SVG-обёртка.
- **`screenshot.ts` — god-script (236 строк, 6 ответственностей):** сборка
  viewer, staging, копирование dist, генерация HTML, HTTP-сервер, снимок Chrome,
  cleanup. Дублирует `buildIndex()` из `builder/build.ts` своей упрощённой
  версией (`screenshot.ts:66-96`); MIME-таблица неполная (нет
  jpg/jpeg/webp/svg/ico).
- **`pack.ts`:** хардкод `C:\Program Files\7-Zip\7z.exe`; баг — `7z a` не
  вычищает устаревшие записи старого архива; нет проверки
  `dist/viewer`/`dist/config` перед `cp`; пути от `cwd`, в отличие от
  `install-cli.ts` (от `import.meta.url`).
- **Непоследовательность:** ошибки — то `throw`, то `console.error` + `exit`;
  корень репо резолвится по-разному.

## Согласованные решения

1. **HTML — в `scripts/templates/`** (страница screenshot + SVG-обёртка), чтение
   в рантайме, TS без HTML.
2. **Staging — через `buildIndex()` из `builder/build.ts`:** строгое поведение
   (нет title → пропуск с предупреждением, hidden из front-matter) = поведение
   скриншотов совпадает с боевой панелью.
3. **Зип — PowerShell:** `[IO.Compression.ZipFile]::CreateFromDirectory()` через
   `powershell.exe -NoProfile -NonInteractive`; 7-Zip не нужен, бага устаревших
   записей нет (архив пересоздаётся целиком).
4. **`install-cli` — только Windows:** оставить `.cmd`-шим + проверка
   существования `builder/build.ts`.
5. **Весь вывод в консоль — на английском, по-ASCII** (ошибки, usage, валидация,
   логи прогресса): при неверной codepage кириллица и символы вроде «←», «×»,
   «—» превращаются в кракозябры. Правится не отдельным шагом, а сразу в каждом
   затронутом файле: шаг 1 — уже на английском; шаги 2 и 3 пишут весь вывод на
   английском с рождения.

## Чеклист

- [x] Шаг 1. Общие либы + SVG-рендер: `scripts/lib/repo.ts` (`repoRoot`,
      `fail()`), `scripts/lib/browser.ts` (`findBrowser()`, `screenshotChrome()`
      sync/async, temp-папки с try/finally),
      `scripts/templates/svg-frame.html` + `scripts/lib/svg.ts`
      (`renderSvgToPng()`); `scripts/assets.ts` и `scripts/render-svg.ts`
      переписать тонкими потребителями этих либ (убрать все дубли, починить
      утечку temp при ошибке); весь вывод в консоль — на английском (ASCII)
- [x] Шаг 2. `scripts/screenshot.ts`: вынести страницу в
      `scripts/templates/screenshot.html`, сервер — в
      `scripts/lib/static-server.ts` (handler `sirv`, lifecycle — наш), staging
      перевести на `buildIndex()` из `builder/build.ts` + копирование
      .md/баннеров, снимок через `lib/browser.ts` (async), cleanup в
      try/finally; на выходе — оркестратор вместо god-script; весь вывод — на
      английском
- [ ] Шаг 3. `scripts/pack.ts` переписать на PowerShell (`CreateFromDirectory`
      через `powershell.exe -NoProfile`), с проверкой
      `dist/viewer`/`dist/config` и путями от `repoRoot`; в
      `scripts/install-cli.ts` добавить проверку существования
      `builder/build.ts` до записи шима; весь вывод — на английском
- [ ] Проверка (одним заходом): `npm run check`, `npm run assets`,
      `npm run screenshots`, `npm run build`, `npm run install-cli` — всё
      зелёное, temp-папки почищены, зип собран

## Не меняется

- `package.json` — пути к скриптам не меняются.
- Поведение рендера PNG/скриншотов визуально то же (только внутренняя
  структура).
